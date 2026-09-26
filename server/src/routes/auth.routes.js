import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLE } from '../utils/constants.js';

export const authRouter = Router();

authRouter.post('/kakao', asyncHandler(authController.kakaoLogin));
authRouter.post('/dev-login', asyncHandler(authController.devLogin));
authRouter.get('/me', requireAuth, asyncHandler(authController.me));
authRouter.post('/device-token', requireAuth, asyncHandler(authController.registerDeviceToken));
authRouter.patch(
  '/me/bank',
  requireAuth,
  requireRole(ROLE.SELLER, ROLE.ADMIN),
  asyncHandler(authController.updateBank),
);
