import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const KAKAO_ME_URL = 'https://kapi.kakao.com/v2/user/me';

/**
 * 프론트가 Kakao.Auth.authorize() 로 받아온 인가 코드를 access_token 으로 교환한다.
 * (JS SDK 2.x 부터 Kakao.Auth.login() 이 사라지고 redirect + code 방식만 남음)
 */
export async function exchangeKakaoCode({ code, redirectUri }) {
  if (!env.KAKAO_REST_API_KEY) throw ApiError.unavailable('KAKAO_REST_API_KEY 가 설정되지 않았습니다.');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.KAKAO_REST_API_KEY,
    redirect_uri: redirectUri,
    code,
  });
  if (env.KAKAO_CLIENT_SECRET) body.set('client_secret', env.KAKAO_CLIENT_SECRET);

  const res = await fetch(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw ApiError.unauthorized(`카카오 토큰 발급에 실패했습니다. ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.access_token;
}

/** access_token 으로 카카오 프로필을 가져온다 */
export async function fetchKakaoProfile(accessToken) {
  const res = await fetch(KAKAO_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw ApiError.unauthorized('카카오 인증에 실패했습니다.');

  const data = await res.json();
  const account = data.kakao_account ?? {};
  const profile = account.profile ?? {};

  return {
    kakaoId: String(data.id),
    nickname: profile.nickname || '사용자',
    email: account.email ?? null,
  };
}
