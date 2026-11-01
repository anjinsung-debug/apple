// 구매자·판매자 앱이 같은 도메인을 쓰므로 앱(base 경로)별로 토큰을 따로 둔다
const TOKEN_KEY = `apple.token${import.meta.env.BASE_URL}`;

/** JWT 보관소 — localStorage 한 곳에서만 다룬다 */
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * 개발 중에는 vite 프록시가 있어서 상대경로(/api)로 충분하지만,
 * 배포 환경(예: Vercel 프론트 + Railway 백엔드처럼 서로 다른 오리진)에서는
 * VITE_API_BASE_URL 로 백엔드 주소를 직접 지정해야 한다.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * 모든 API 호출의 단일 통로.
 * - 토큰 자동 첨부 (auth: false 로 끌 수 있음)
 * - 서버 오류 응답을 ApiError 로 변환
 * - 401 이면 토큰을 비운다
 */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) tokenStore.clear();
    throw new ApiError(res.status, data.message || '요청에 실패했습니다.', data.details);
  }
  return data;
}

/* 기능별 api 모듈에서 사용하는 단축 함수 */
export const get = (path, options) => request(path, { ...options, method: 'GET' });
export const post = (path, body, options) => request(path, { ...options, method: 'POST', body });
export const patch = (path, body, options) => request(path, { ...options, method: 'PATCH', body });
export const del = (path, options) => request(path, { ...options, method: 'DELETE' });
