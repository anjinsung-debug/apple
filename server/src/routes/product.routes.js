import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ROLE } from '../utils/constants.js';

export const productRouter = Router();

const sellerOnly = [requireAuth, requireRole(ROLE.SELLER, ROLE.ADMIN)];

// 구매자용 목록은 공개
productRouter.get('/', asyncHandler(productController.listActive));

productRouter.get('/mine', sellerOnly, asyncHandler(productController.listMine));
productRouter.post('/', sellerOnly, asyncHandler(productController.create));
productRouter.patch('/:id', sellerOnly, asyncHandler(productController.update));
productRouter.delete('/:id', sellerOnly, asyncHandler(productController.remove));
