import { prisma } from '../config/db.js';

export const notificationModel = {
  create(data, client = prisma) {
    return client.notification.create({ data });
  },

  listByUser(userId, { take = 50 } = {}, client = prisma) {
    return client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },

  markAllRead(userId, client = prisma) {
    return client.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },
};
