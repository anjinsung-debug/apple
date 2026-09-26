import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const BASE = 'https://apis.openapi.sk.com/tmap';

/* ──────────────────────────────────────────────────────────
 * 무료 할당량 보호 장치
 *  1) 결과 캐시 (같은 주소/같은 경로는 재호출 안 함)
 *  2) 일일 호출 상한 (TMAP_DAILY_LIMIT)
 *  ※ 프로세스 메모리 기반. 다중 인스턴스로 가면 Redis 로 옮길 것.
 * ────────────────────────────────────────────────────────── */
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7일
const cache = new Map(); // key -> { value, expiresAt }

const usage = { date: today(), count: 0 };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function getUsage() {
  if (usage.date !== today()) {
    usage.date = today();
    usage.count = 0;
  }
  return { ...usage, limit: env.TMAP_DAILY_LIMIT, cached: cache.size };
}

function consumeQuota() {
  const current = getUsage();
  if (current.count >= current.limit) {
    throw ApiError.tooManyRequests('TMAP 일일 호출 한도를 초과했습니다. 내일 다시 시도해주세요.');
  }
  usage.count += 1;
}

function readCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

async function callTmap(path, { method = 'GET', query = {}, body } = {}) {
  if (!env.hasTmap) throw ApiError.unavailable('TMAP_APP_KEY 가 설정되지 않았습니다.');

  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('version', '1');
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }

  consumeQuota();

  const res = await fetch(url, {
    method,
    headers: {
      appKey: env.TMAP_APP_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(
      res.status === 429 ? 429 : 502,
      `TMAP 요청 실패 (${res.status}) ${text.slice(0, 200)}`,
    );
  }
  return res.json();
}

/** 주소 → 좌표 (지오코딩). 결과는 7일간 캐시된다. */
export async function geocode(fullAddress) {
  const key = `geo:${fullAddress}`;
  const cached = readCache(key);
  if (cached) return { ...cached, cached: true };

  const data = await callTmap('/geo/fullAddrGeo', {
    query: { coordType: 'WGS84GEO', fullAddr: fullAddress },
  });

  const info = data?.coordinateInfo?.coordinate?.[0];
  if (!info) throw ApiError.notFound('주소의 좌표를 찾지 못했습니다.');

  // 신주소(newLat/newLon) 우선, 없으면 구주소(lat/lon)
  const lat = Number(info.newLat || info.lat);
  const lng = Number(info.newLon || info.lon);
  if (!lat || !lng) throw ApiError.notFound('주소의 좌표를 찾지 못했습니다.');

  const value = { lat, lng, matched: fullAddress };
  writeCache(key, value);
  return { ...value, cached: false };
}
