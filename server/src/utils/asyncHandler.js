/**
 * async 컨트롤러의 reject 를 next(err) 로 넘겨 error.middleware 가 처리하게 한다.
 *   router.get('/', asyncHandler(controller.list))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
