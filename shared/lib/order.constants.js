/** 서버 server/src/utils/constants.js 의 ORDER_STATUS 와 짝을 이룬다 */
export const STATUS_LABEL = {
  PENDING: '접수 대기',
  ACCEPTED: '주문 접수',
  DELIVERING: '배송 중',
  DELIVERED: '배송 완료',
  CANCELLED: '취소됨',
};

/** 타임라인에 표시할 정상 흐름 (취소는 별도 처리) */
export const STATUS_STEPS = ['PENDING', 'ACCEPTED', 'DELIVERING', 'DELIVERED'];
