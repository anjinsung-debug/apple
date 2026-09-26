import { prisma } from '../config/db.js';

/** 주문 조회 시 항상 함께 가져오는 관계 */
export const orderInclude = {
  items: true,
  buyer: { select: { id: true, nickname: true, phone: true } },
  seller: { select: { id: true, nickname: true, phone: true } },
  logs: { orderBy: { createdAt: 'asc' } },
};

export const orderModel = {
  create(data, client = prisma) {
    return client.order.create({ data, include: orderInclude });
  },

  findById(id, client = prisma) {
    return client.order.findUnique({ where: { id }, include: orderInclude });
  },

  listFor({ userId, asSeller, status }, client = prisma) {
    return client.order.findMany({
      where: {
        ...(asSeller ? { sellerId: userId } : { buyerId: userId }),
        ...(status ? { status } : {}),
      },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  confirmPayment(id, client = prisma) {
    return client.order.update({
      where: { id },
      data: { paymentConfirmedAt: new Date() },
      include: orderInclude,
    });
  },

  updateStatus({ id, status, timestampField, memo }, client = prisma) {
    return client.order.update({
      where: { id },
      data: {
        status,
        ...(timestampField ? { [timestampField]: new Date() } : {}),
        logs: { create: { status, memo: memo ?? null } },
      },
      include: orderInclude,
    });
  },

  countByOrderNoPrefix(prefix, client = prisma) {
    return client.order.count({ where: { orderNo: { startsWith: prefix } } });
  },
};
