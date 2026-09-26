import { STATUS_LABEL } from '../lib/order.constants.js';

export default function StatusBadge({ status }) {
  return <span className={`badge ${status.toLowerCase()}`}>{STATUS_LABEL[status] ?? status}</span>;
}
