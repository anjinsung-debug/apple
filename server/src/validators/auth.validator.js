import { z } from 'zod';
import { ROLE } from '../utils/constants.js';

export const kakaoLoginSchema = z.object({
  code: z.string().min(1),
  redirectUri: z.string().min(1),
  role: z.enum([ROLE.BUYER, ROLE.SELLER]).optional(),
});

export const devLoginSchema = z.object({
  kakaoId: z.string().min(1),
  nickname: z.string().min(1).default('테스트 사용자'),
  role: z.enum([ROLE.BUYER, ROLE.SELLER, ROLE.ADMIN]).default(ROLE.BUYER),
});

export const deviceTokenSchema = z.object({
  token: z.string().min(10),
  platform: z.string().optional().default('web'),
});

export const updateBankSchema = z.object({
  bankName: z.string().min(1, '은행명을 입력해주세요.'),
  bankAccount: z.string().min(1, '계좌번호를 입력해주세요.'),
  bankHolder: z.string().min(1, '예금주명을 입력해주세요.'),
});
