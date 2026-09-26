import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1),
  variety: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  unit: z.string().default('kg'),
  unitAmount: z.number().positive().default(1),
  price: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});

/** PATCH 는 부분 수정 */
export const updateProductSchema = createProductSchema.partial();

export const productIdSchema = z.coerce.number().int().positive('잘못된 상품 번호입니다.');
