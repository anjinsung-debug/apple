import { authService, toPublicUser } from '../services/auth.service.js';
import {
  deviceTokenSchema,
  devLoginSchema,
  kakaoLoginSchema,
  updateBankSchema,
} from '../validators/auth.validator.js';

export const authController = {
  /** POST /api/auth/kakao — 카카오 access_token 으로 로그인/회원가입 */
  async kakaoLogin(req, res) {
    const input = kakaoLoginSchema.parse(req.body);
    res.json(await authService.loginWithKakao(input));
  },

  /** POST /api/auth/dev-login — 카카오 앱 등록 전 로컬 테스트용 */
  async devLogin(req, res) {
    const input = devLoginSchema.parse(req.body);
    res.json(await authService.loginAsDev(input));
  },

  /** GET /api/auth/me */
  async me(req, res) {
    res.json({ user: toPublicUser(req.user) });
  },

  /** POST /api/auth/device-token — FCM 토큰 등록 */
  async registerDeviceToken(req, res) {
    const input = deviceTokenSchema.parse(req.body);
    res.status(201).json(await authService.registerDeviceToken(req.user.id, input));
  },

  /** PATCH /api/auth/me/bank — 판매자 입금 계좌 등록/수정 */
  async updateBank(req, res) {
    const input = updateBankSchema.parse(req.body);
    res.json({ user: await authService.updateBank(req.user.id, input) });
  },
};
