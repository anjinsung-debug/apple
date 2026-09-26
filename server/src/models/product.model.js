import { prisma } from '../config/db.js';

export const productModel = {
  /** 구매자에게 보여줄 판매 중 상품 (공개) — 입금 계좌 확인용으로 판매자 계좌 정보 포함 */
  listActive(client = prisma) {
    return client.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: {
        seller: {
          select: { id: true, nickname: true, bankName: true, bankAccount: true, bankHolder: true },
        },
      },
    });
  },

  listBySeller(sellerId, client = prisma) {
    return client.product.findMany({ where: { sellerId }, orderBy: { createdAt: 'asc' } });
  },

  findById(id, client = prisma) {
    return client.product.findUnique({ where: { id } });
  },

  findByIdWithItems(id, client = prisma) {
    return client.product.findUnique({ where: { id }, include: { items: true } });
  },

  findManyByIds(ids, client = prisma) {
    return client.product.findMany({ where: { id: { in: ids } } });
  },

  create(data, client = prisma) {
    return client.product.create({ data });
  },

  update(id, data, client = prisma) {
    return client.product.update({ where: { id }, data });
  },

  deleteById(id, client = prisma) {
    return client.product.delete({ where: { id } });
  },

  decrementStock(id, quantity, client = prisma) {
    return client.product.update({ where: { id }, data: { stock: { decrement: quantity } } });
  },

  incrementStock(id, quantity, client = prisma) {
    return client.product.update({ where: { id }, data: { stock: { increment: quantity } } });
  },
};
