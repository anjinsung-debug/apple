import morgan from 'morgan';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/** HTTP 접근 로그. 콘솔과 logs/app.log 로 함께 나간다. */
export const httpLogger = morgan(env.isDev ? 'dev' : 'combined', {
  stream: logger.stream,
  skip: () => env.isTest,
});
