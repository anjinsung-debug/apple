import { z } from 'zod';
import { ORDER_STATUS } from '../utils/constants.js';

export const createOrderSchema = z.object({
  addressId: z.number().int().optional(),
  // 저장된 배송지 없이 1회성 주소로도 주문할 수 있다
  address: z
    .object({
      recipient: z.string().min(1),
      phone: z.string().min(9),
      zonecode: z.string().min(1),
      roadAddress: z.string().min(1),
      jibunAddress: z.string().optional().nullable(),
      detail: z.string().optional().nullable(),
    })
    .optional(),
  items: z
    .array(z.object({ productId: z.number().int(), quantity: z.number().int().positive() }))
    .min(1, '상품을 1개 이상 선택해주세요.'),
  memo: z.string().max(300).optional().nullable(),
  depositorName: z.string().min(1, '입금자명을 입력해주세요.'),
});

export const listOrderQuerySchema = z.object({
  status: z.string().optional(),
  as: z.enum(['buyer', 'seller']).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    ORDER_STATUS.ACCEPTED,
    ORDER_STATUS.DELIVERING,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.CANCELLED,
  ]),
  memo: z.string().optional().nullable(),
});

export const orderIdSchema = z.coerce.number().int().positive('잘못된 주문 번호입니다.');
