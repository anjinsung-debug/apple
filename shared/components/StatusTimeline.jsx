import { dateTime } from '../lib/format.js';
import { STATUS_LABEL, STATUS_STEPS } from '../lib/order.constants.js';

const TIME_FIELD = {
  PENDING: 'createdAt',
  ACCEPTED: 'acceptedAt',
  DELIVERING: 'startedAt',
  DELIVERED: 'deliveredAt',
};

export default function StatusTimeline({ order }) {
  if (order.status === 'CANCELLED') {
    return <p className="cancelled-note">{dateTime(order.cancelledAt)} 에 취소된 주문입니다.</p>;
  }

  const currentIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <ol className="timeline">
      {STATUS_STEPS.map((step, i) => (
        <li key={step} className={i <= currentIndex ? 'done' : ''}>
          <span className="dot" />
          <div>
            <strong>{STATUS_LABEL[step]}</strong>
            <small className="muted">{order[TIME_FIELD[step]] ? dateTime(order[TIME_FIELD[step]]) : '대기 중'}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
