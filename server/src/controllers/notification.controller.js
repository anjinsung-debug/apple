import { notificationService } from '../services/notification.service.js';

export const notificationController = {
  /** GET /api/notifications — 내 알림함 */
  async list(req, res) {
    res.json(await notificationService.list(req.user.id));
  },

  /** POST /api/notifications/read — 전체 읽음 처리 */
  async markAllRead(req, res) {
    res.json(await notificationService.markAllRead(req.user.id));
  },
};
