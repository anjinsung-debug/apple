import { prisma } from '../config/db.js';

/**
 * User / DeviceToken 데이터 접근.
 * 모든 함수는 `client` 를 마지막 인자로 받아 트랜잭션(tx) 안에서도 재사용할 수 있다.
 */
export const userModel = {
  findById(id, client = prisma) {
    return client.user.findUnique({ where: { id } });
  },

  findByKakaoId(kakaoId, client = prisma) {
    return client.user.findUnique({ where: { kakaoId } });
  },

  create(data, client = prisma) {
    return client.user.create({ data });
  },

  update(id, data, client = prisma) {
    return client.user.update({ where: { id }, data });
  },

  upsertDeviceToken({ userId, token, platform = 'web' }, client = prisma) {
    return client.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  },

  listDeviceTokens(userId, client = prisma) {
    return client.deviceToken.findMany({ where: { userId } });
  },
};
