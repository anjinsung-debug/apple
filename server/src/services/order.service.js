import { prisma } from '../config/db.js';
import { addressModel } from '../models/address.model.js';
import { orderModel } from '../models/order.model.js';
import { productModel } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { ORDER_STATUS, ROLE, STATUS_FLOW, STATUS_TIMESTAMP_FIELD } from '../utils/constants.js';
import { hasRole } from '../utils/roles.js';
import { notificationService, ORDER_NOTIFICATION } from './notification.service.js';
import { toFullAddress } from './address.service.js';
import { geocode } from './tmap.service.js';

/** AP250903-0001 형태의 주문번호 (날짜 + 당일 일련번호) */
export function buildOrderNo(date, sequence) {
  const p = (n) => String(n).padStart(2, '0');
  const prefix = `AP${String(date.getFullYear()).slice(2)}${p(date.getMonth() + 1)}${p(date.getDate())}`;
  return `${prefix}-${String(sequence).padStart(4, '0')}`;
}

export function orderNoPrefix(date) {
  return buildOrderNo(date, 0).split('-')[0];
}

/** 상태 전이가 허용되는지 (STATUS_FLOW 가 유일한 기준) */
export function canTransition(from, to) {
  return (STATUS_FLOW[from] ?? []).includes(to);
}

/** 주문 시점 배송지 스냅샷 — 주소가 나중에 바뀌어도 배송 이력이 깨지지 않게 복사해 둔다 */
function toSnapshot(address) {
  return {
    recipient: address.recipient,
    phone: address.phone,
    zonecode: address.zonecode,
    roadAddress: address.roadAddress,
    jibunAddress: address.jibunAddress ?? null,
    detail: address.detail ?? null,
    lat: address.lat ?? null,
    lng: address.lng ?? null,
  };
}

/** 저장된 배송지 또는 1회성 주소 → 스냅샷 + (있으면) 원본 레코드 */
async function resolveDeliveryTarget(userId, input) {
  if (input.addressId) {
    const address = await addressModel.findById(input.addressId);
    if (!address || address.userId !== userId) throw ApiError.notFound('배송지를 찾을 수 없습니다.');
    return { record: address, snapshot: toSnapshot(address) };
  }

  if (input.address) return { record: null, snapshot: toSnapshot(input.address) };

  throw ApiError.badRequest('배송지를 선택하거나 입력해주세요.');
}

/** 좌표가 없으면 지오코딩 시도. 실패해도 주문은 계속 진행한다. */
async function fillCoords({ record, snapshot }) {
  if (snapshot.lat != null && snapshot.lng != null) return snapshot;

  try {
    const coords = await geocode(toFullAddress(snapshot));
    snapshot.lat = coords.lat;
    snapshot.lng = coords.lng;
    if (record) await addressModel.updateCoords(record.id, coords);
  } catch (err) {
    logger.warn(`[geocode] order skipped: ${err.message}`);
  }
  return snapshot;
}

/** 주문 라인 검증 — 한 주문은 한 판매자, 재고/판매여부 확인 */
async function buildOrderItems(lines) {
  const productIds = lines.map((l) => l.productId);
  const products = await productModel.findManyByIds(productIds);
  if (products.length !== productIds.length) throw ApiError.notFound('판매 중이 아닌 상품이 있습니다.');

  const sellerIds = [...new Set(products.map((p) => p.sellerId))];
  if (sellerIds.length > 1) {
    throw ApiError.badRequest('한 번에 한 판매자의 상품만 주문할 수 있습니다.');
  }

  const items = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product.isActive) throw ApiError.badRequest(`${product.name}은(는) 현재 판매하지 않습니다.`);
    if (product.stock < line.quantity) throw ApiError.badRequest(`${product.name} 재고가 부족합니다.`);
    return {
      productId: product.id,
      name: product.name,
      unit: product.unit,
      price: product.price,
      quantity: line.quantity,
    };
  });

  return {
    sellerId: sellerIds[0],
    items,
    totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  };
}

export const orderService = {
  /** 구매자 주문 생성 — 배송지 확정 → 상품 검증 → 저장(재고 차감) → 알림 */
  async create(user, input) {
    const target = await resolveDeliveryTarget(user.id, input);
    const snapshot = await fillCoords(target);
    const { sellerId, items, totalPrice } = await buildOrderItems(input.items);

    const order = await prisma.$transaction(async (tx) => {
      const sequence = (await orderModel.countByOrderNoPrefix(orderNoPrefix(new Date()), tx)) + 1;

      const created = await orderModel.create(
        {
          orderNo: buildOrderNo(new Date(), sequence),
          buyerId: user.id,
          sellerId,
          addressId: target.record?.id ?? null,
          status: ORDER_STATUS.PENDING,
          totalPrice,
          memo: input.memo ?? null,
          depositorName: input.depositorName,
          ...snapshot,
          items: { create: items },
          logs: { create: { status: ORDER_STATUS.PENDING, memo: '주문 전송' } },
        },
        tx,
      );

      for (const line of items) {
        await productModel.decrementStock(line.productId, line.quantity, tx);
      }
      return created;
    });

    // 구매자에게 "주문 전송", 판매자에게 "새 주문"
    await notificationService.sendOrderEvent({
      userId: order.buyerId,
      order,
      template: ORDER_NOTIFICATION.ORDER_CREATED,
    });
    await notificationService.sendOrderEvent({
      userId: order.sellerId,
      order,
      template: ORDER_NOTIFICATION.ORDER_RECEIVED,
    });

    return order;
  },

  /** 구매자: 내가 주문한 것 / 판매자: 나에게 들어온 것 */
  async list(user, { status, as }) {
    const asSeller = as === 'seller' || (as !== 'buyer' && !hasRole(user, ROLE.BUYER));
    const orders = await orderModel.listFor({ userId: user.id, asSeller, status });
    return { orders, as: asSeller ? 'seller' : 'buyer' };
  },

  /** 주문 당사자(구매자/판매자) 또는 관리자만 조회 가능 */
  async getAccessible(user, id) {
    const order = await orderModel.findById(id);
    if (!order) throw ApiError.notFound('주문을 찾을 수 없습니다.');

    const mine = order.buyerId === user.id || order.sellerId === user.id;
    if (!mine && !hasRole(user, ROLE.ADMIN)) throw ApiError.forbidden();
    return order;
  },

  /** 판매자: 입금 확인 표시 (PENDING 주문만, 확인 후에만 접수 가능) */
  async confirmPayment(user, id) {
    const order = await orderService.getAccessible(user, id);
    if (order.sellerId !== user.id) throw ApiError.forbidden('판매자만 입금 확인을 할 수 있습니다.');
    if (order.status !== ORDER_STATUS.PENDING) {
      throw ApiError.badRequest('접수 대기 중인 주문만 입금 확인할 수 있습니다.');
    }
    if (order.paymentConfirmedAt) return order;

    return orderModel.confirmPayment(order.id);
  },

  /**
   * 상태 변경
   *   ACCEPTED / DELIVERING / DELIVERED : 판매자만
   *   CANCELLED                         : 판매자, 또는 접수 전인 구매자
   */
  async changeStatus(user, id, { status, memo }) {
    const order = await orderService.getAccessible(user, id);
    const isSeller = order.sellerId === user.id;

    if (!isSeller && status !== ORDER_STATUS.CANCELLED) {
      throw ApiError.forbidden('판매자만 배송 상태를 변경할 수 있습니다.');
    }
    if (!isSeller && order.status !== ORDER_STATUS.PENDING) {
      throw ApiError.badRequest('이미 접수된 주문은 판매자에게 문의해주세요.');
    }
    if (!canTransition(order.status, status)) {
      throw ApiError.badRequest(`현재 상태(${order.status})에서 ${status} 로 변경할 수 없습니다.`);
    }
    if (status === ORDER_STATUS.ACCEPTED && !order.paymentConfirmedAt) {
      throw ApiError.badRequest('입금 확인 후 접수할 수 있습니다.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await orderModel.updateStatus(
        { id: order.id, status, timestampField: STATUS_TIMESTAMP_FIELD[status], memo },
        tx,
      );

      // 취소 시 재고 복구
      if (status === ORDER_STATUS.CANCELLED) {
        for (const item of order.items) {
          await productModel.incrementStock(item.productId, item.quantity, tx);
        }
      }
      return next;
    });

    await notificationService.sendOrderEvent({
      userId: updated.buyerId,
      order: updated,
      template: ORDER_NOTIFICATION[`ORDER_${status}`],
    });

    return updated;
  },
};
