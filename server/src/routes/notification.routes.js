import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const notificationRouter = Router();
notificationRouter.use(requireAuth);

notificationRouter.get('/', asyncHandler(notificationController.list));
notificationRouter.post('/read', asyncHandler(notificationController.markAllRead));
