import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userModel } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { hasRole } from '../utils/roles.js';

/** Authorization: Bearer <jwt> 를 검증하고 req.user 를 채운다 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized();

    let payload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET);
    } catch {
      throw ApiError.unauthorized('토큰이 유효하지 않습니다.');
    }

    const user = await userModel.findById(Number(payload.sub));
    if (!user) throw ApiError.unauthorized('존재하지 않는 사용자입니다.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** requireRole(ROLE.SELLER, ROLE.ADMIN) — requireAuth 뒤에 사용. req.user 가 이 중 하나라도 가지고 있으면 통과 */
export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.some((role) => hasRole(req.user, role))) return next(ApiError.forbidden());
    next();
  };
}
