import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/** 매칭되는 라우트가 없을 때 */
export function notFoundHandler(_req, _res, next) {
  next(ApiError.notFound());
}

/** 모든 오류의 최종 응답 형태를 한 곳에서 결정한다 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: '입력값이 올바르지 않습니다.',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  const status = err.status ?? 500;
  if (status >= 500) logger.error(err);

  res.status(status).json({
    message: status >= 500 ? '서버 오류가 발생했습니다.' : err.message,
    details: err.details,
  });
}
