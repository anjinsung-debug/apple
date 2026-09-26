import { z } from 'zod';

export const createAddressSchema = z.object({
  label: z.string().default('우리집'),
  recipient: z.string().min(1, '받는 사람을 입력해주세요.'),
  phone: z.string().min(9, '연락처를 확인해주세요.'),
  zonecode: z.string().min(1),
  roadAddress: z.string().min(1),
  jibunAddress: z.string().optional().nullable(),
  detail: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
});

export const addressIdSchema = z.coerce.number().int().positive('잘못된 배송지 번호입니다.');
