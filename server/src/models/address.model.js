import { prisma } from '../config/db.js';

export const addressModel = {
  listByUser(userId, client = prisma) {
    return client.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  },

  findById(id, client = prisma) {
    return client.address.findUnique({ where: { id } });
  },

  countByUser(userId, client = prisma) {
    return client.address.count({ where: { userId } });
  },

  clearDefault(userId, client = prisma) {
    return client.address.updateMany({ where: { userId }, data: { isDefault: false } });
  },

  create(data, client = prisma) {
    return client.address.create({ data });
  },

  updateCoords(id, { lat, lng }, client = prisma) {
    return client.address.update({ where: { id }, data: { lat, lng } });
  },

  deleteById(id, client = prisma) {
    return client.address.delete({ where: { id } });
  },
};
