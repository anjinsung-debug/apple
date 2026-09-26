import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userModel } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLE } from '../utils/constants.js';
import { addRole, hasRole, parseRoles } from '../utils/roles.js';
import { exchangeKakaoCode, fetchKakaoProfile } from './kakao.service.js';

/** 클라이언트에 내려도 되는 사용자 필드만 추린다 */
export function toPublicUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    phone: user.phone,
    roles: parseRoles(user.roles),
    bankName: user.bankName,
    bankAccount: user.bankAccount,
    bankHolder: user.bankHolder,
  };
}

export function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/**
 * 카카오 계정(kakaoId) 하나가 구매자/판매자 역할을 동시에 가질 수 있다.
 * 이미 있는 계정이 지금 로그인한 앱의 role 을 아직 안 가지고 있으면 자동으로 더해준다
 * (예: BUYER 로 가입한 계정이 판매자 앱에 처음 로그인하면 SELLER 가 추가됨).
 */
async function findOrCreateUser({ kakaoId, nickname, email = null }, role) {
  const existing = await userModel.findByKakaoId(kakaoId);
  if (!existing) {
    return userModel.create({ kakaoId, nickname, email, roles: role ?? ROLE.BUYER });
  }
  if (role && !hasRole(existing, role)) {
    return userModel.update(existing.id, { roles: addRole(existing.roles, role) });
  }
  return existing;
}

export const authService = {
  /** 카카오 인가 코드 → access_token 교환 → 프로필 조회 → 로그인/회원가입 */
  async loginWithKakao({ code, redirectUri, role }) {
    const accessToken = await exchangeKakaoCode({ code, redirectUri });
    const profile = await fetchKakaoProfile(accessToken);
    const user = await findOrCreateUser(profile, role);
    return { token: signToken(user), user: toPublicUser(user) };
  },

  /** 카카오 앱 등록 전 로컬 테스트용 로그인 */
  async loginAsDev({ kakaoId, nickname, role }) {
    if (!env.ALLOW_DEV_LOGIN) {
      throw ApiError.forbidden('개발용 로그인이 비활성화되어 있습니다.');
    }
    const user = await findOrCreateUser({ kakaoId, nickname }, role);
    return { token: signToken(user), user: toPublicUser(user) };
  },

  async registerDeviceToken(userId, { token, platform }) {
    await userModel.upsertDeviceToken({ userId, token, platform });
    return { ok: true };
  },

  /** 판매자 입금 계좌 정보 등록/수정 */
  async updateBank(userId, input) {
    const user = await userModel.update(userId, input);
    return toPublicUser(user);
  },
};
