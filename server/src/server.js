import { app } from './app.js';
import { env } from './config/env.js';
import { disconnectDb } from './config/db.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🍎 apple-delivery server  →  http://localhost:${env.PORT}  [${env.NODE_ENV}]`);
});

/** 종료 시 열려 있는 연결과 DB 커넥션을 정리한다 */
async function shutdown(signal) {
  logger.info(`${signal} 수신 — 서버를 종료합니다.`);
  server.close(async () => {
    await disconnectDb();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => logger.error('unhandledRejection', reason));
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', err);
  process.exit(1);
});
