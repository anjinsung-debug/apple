import { env } from '../config/env.js';
import { notificationModel } from '../models/notification.model.js';
import { userModel } from '../models/user.model.js';
import { logger } from '../utils/logger.js';
import { NOTIFICATION_TYPE } from '../utils/constants.js';

/** 주문 상태별 알림 문구 */
export const ORDER_NOTIFICATION = {
  ORDER_CREATED: (order) => ({
    type: NOTIFICATION_TYPE.ORDER_CREATED,
    title: '주문이 전송되었습니다',
    body: `주문번호 ${order.orderNo} · 판매자 확인을 기다리고 있어요.`,
  }),
  ORDER_RECEIVED: (order) => ({
    type: NOTIFICATION_TYPE.ORDER_RECEIVED,
    title: '새 주문이 도착했습니다',
    body: `${order.recipient} 님 · ${order.roadAddress}`,
  }),
  ORDER_ACCEPTED: (order) => ({
    type: NOTIFICATION_TYPE.ORDER_ACCEPTED,
    title: '주문이 접수되었습니다',
    body: `주문번호 ${order.orderNo} · 곧 배송을 준비합니다.`,
  }),
  ORDER_DELIVERING: (order) => ({
    type: NOTIFICATION_TYPE.ORDER_DELIVERING,
    title: '배송이 시작되었습니다',
    body: `주문번호 ${order.orderNo} · 상품이 출발했어요.`,
  }),
  ORDER_DELIVERED: (order) => ({
    type: NOTIFICATION_TYPE.ORDER_DELIVERED,
    title: '배송이 완료되었습니다',
    body: `주문번호 ${order.orderNo} · 맛있게 드세요!`,
  }),
  ORDER_CANCELLED: (order) => ({
    type: NOTIFICATION_TYPE.ORDER_CANCELLED,
    title: '주문이 취소되었습니다',
    body: `주문번호 ${order.orderNo}`,
  }),
};

export const notificationService = {
  /** 내 알림함 */
  async list(userId) {
    const notifications = await notificationModel.listByUser(userId);
    return { notifications, unread: notifications.filter((n) => !n.isRead).length };
  },

  async markAllRead(userId) {
    await notificationModel.markAllRead(userId);
    return { ok: true };
  },

  /**
   * 알림 발송 = DB 이력 기록 + 푸시.
   * Firebase 설정이 없으면 기록 + 로그만 남긴다(로컬 개발).
   */
  async send({ userId, orderId = null, type, title, body }) {
    const record = await notificationModel.create({ userId, orderId, type, title, body });
    await sendPush(userId, { title, body, data: { type, orderId: String(orderId ?? '') } });
    return record;
  },

  /** 주문 이벤트 알림 — ORDER_NOTIFICATION 템플릿 사용 */
  async sendOrderEvent({ userId, order, template }) {
    return notificationService.send({ userId, orderId: order.id, ...template(order) });
  },
};

/**
 * 실서비스 전환 시:
 *   npm i firebase-admin
 *   아래 TODO 를 admin.messaging().sendEachForMulticast 로 교체하면 된다.
 *   호출부(주문 생성/상태 변경)는 그대로 두어도 되도록 분리해 두었다.
 */
async function sendPush(userId, message) {
  const tokens = await userModel.listDeviceTokens(userId);

  if (!env.hasFirebase || tokens.length === 0) {
    logger.info(`[notify] user=${userId} "${message.title}" - ${message.body}`);
    return;
  }

  // TODO: firebase-admin 연동
  // const admin = await getFirebaseAdmin();
  // await admin.messaging().sendEachForMulticast({
  //   tokens: tokens.map((t) => t.token),
  //   notification: { title: message.title, body: message.body },
  //   data: message.data,
  // });
  logger.info(`[notify:fcm] user=${userId} tokens=${tokens.length} "${message.title}"`);
}
