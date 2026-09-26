import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

/**
 * Prisma 클라이언트 싱글턴.
 * `node --watch` 로 재시작될 때 연결이 중복 생성되지 않도록 globalThis 에 캐시한다.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__applePrisma ??
  new PrismaClient({ log: env.isDev ? ['warn', 'error'] : ['error'] });

if (env.isDev) globalForPrisma.__applePrisma = prisma;

export async function disconnectDb() {
  await prisma.$disconnect();
}
