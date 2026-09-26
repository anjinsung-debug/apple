import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const orderRouter = Router();
orderRouter.use(requireAuth);

orderRouter.post('/', asyncHandler(orderController.create));
orderRouter.get('/', asyncHandler(orderController.list));
orderRouter.get('/:id', asyncHandler(orderController.detail));
orderRouter.patch('/:id/status', asyncHandler(orderController.updateStatus));
orderRouter.patch('/:id/confirm-payment', asyncHandler(orderController.confirmPayment));
