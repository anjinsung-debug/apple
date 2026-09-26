import express from 'express';
import cors from 'cors';

import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { httpLogger } from './middlewares/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

/**
 * Express 앱 조립만 담당한다(listen 없음).
 * 테스트에서는 이 앱을 그대로 임의 포트에 띄워 사용한다.
 */
export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigins.length > 0 ? env.corsOrigins : true }));
  app.use(express.json());
  app.use(httpLogger);

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
