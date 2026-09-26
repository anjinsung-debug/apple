import { prisma } from '../config/db.js';
import { addressModel } from '../models/address.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { geocode } from './tmap.service.js';

/** 도로명 + 상세주소를 지오코딩용 한 줄 주소로 */
export function toFullAddress({ roadAddress, detail }) {
  return `${roadAddress} ${detail ?? ''}`.trim();
}

/**
 * 지오코딩 실패(키 미설정/할당량 초과 등)가 주소 저장이나 주문을 막지 않도록
 * 실패를 null 로 흡수한다.
 */
export async function safeGeocode(input) {
  try {
    return await geocode(toFullAddress(input));
  } catch (err) {
    logger.warn(`[geocode] skipped: ${err.message}`);
    return null;
  }
}

export const addressService = {
  list(userId) {
    return addressModel.listByUser(userId);
  },

  /** 다음(카카오) 우편번호 결과 저장 + TMAP 지오코딩 결과 캐시 */
  async create(userId, input) {
    const coords = await safeGeocode(input);

    return prisma.$transaction(async (tx) => {
      if (input.isDefault) await addressModel.clearDefault(userId, tx);

      const count = await addressModel.countByUser(userId, tx);
      return addressModel.create(
        {
          ...input,
          userId,
          isDefault: input.isDefault ?? count === 0, // 첫 주소는 자동 기본배송지
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null,
        },
        tx,
      );
    });
  },

  async remove(userId, id) {
    const address = await addressModel.findById(id);
    if (!address || address.userId !== userId) throw ApiError.notFound('배송지를 찾을 수 없습니다.');

    await addressModel.deleteById(id);
    return { ok: true };
  },
};
