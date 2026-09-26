import { Router } from 'express';
import { addressController } from '../controllers/address.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const addressRouter = Router();
addressRouter.use(requireAuth);

addressRouter.get('/', asyncHandler(addressController.list));
addressRouter.post('/', asyncHandler(addressController.create));
addressRouter.delete('/:id', asyncHandler(addressController.remove));
