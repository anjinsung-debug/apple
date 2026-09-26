/**
 * 서비스/컨트롤러에서 throw 하면 error.middleware 가 status + message 로 변환한다.
 * `new ApiError(404, '...')` 대신 정적 헬퍼(`ApiError.notFound('...')`) 사용을 권장.
 */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.expected = status < 500; // 예상된 오류는 스택을 남기지 않는다
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = '로그인이 필요합니다.') {
    return new ApiError(401, message);
  }

  static forbidden(message = '접근 권한이 없습니다.') {
    return new ApiError(403, message);
  }

  static notFound(message = '요청한 리소스를 찾을 수 없습니다.') {
    return new ApiError(404, message);
  }

  static tooManyRequests(message) {
    return new ApiError(429, message);
  }

  static badGateway(message) {
    return new ApiError(502, message);
  }

  static unavailable(message) {
    return new ApiError(503, message);
  }
}
