export const ROLE = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',       // 주문 전송됨 (판매자 접수 대기)
  ACCEPTED: 'ACCEPTED',     // 판매자 주문 접수
  DELIVERING: 'DELIVERING', // 배송 시작
  DELIVERED: 'DELIVERED',   // 배송 완료
  CANCELLED: 'CANCELLED',   // 취소
};

export const ORDER_STATUS_LABEL = {
  PENDING: '주문 접수 대기',
  ACCEPTED: '주문 접수 완료',
  DELIVERING: '배송 중',
  DELIVERED: '배송 완료',
  CANCELLED: '주문 취소',
};

/** 허용된 상태 전이. 그 외 요청은 400 으로 거부된다. */
export const STATUS_FLOW = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

/** 상태 변경 시 함께 기록할 타임스탬프 컬럼 */
export const STATUS_TIMESTAMP_FIELD = {
  ACCEPTED: 'acceptedAt',
  DELIVERING: 'startedAt',
  DELIVERED: 'deliveredAt',
  CANCELLED: 'cancelledAt',
};

export const NOTIFICATION_TYPE = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_RECEIVED: 'ORDER_RECEIVED',
  ORDER_ACCEPTED: 'ORDER_ACCEPTED',
  ORDER_DELIVERING: 'ORDER_DELIVERING',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
};
