import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listOrders } from '@shared/api/order.api.js';
import StatusBadge from '@shared/components/StatusBadge.jsx';
import { dateTime, won } from '@shared/lib/format.js';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    listOrders({ as: 'buyer' })
      .then(({ orders }) => setOrders(orders))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="page narrow">
      <h1>내 주문 내역</h1>
      {error && <p className="error">{error}</p>}

      {orders.length === 0 ? (
        <div className="empty">
          <p className="muted">아직 주문이 없습니다.</p>
          <Link className="btn" to="/order">
            사과 주문하러 가기
          </Link>
        </div>
      ) : (
        <ul className="list">
          {orders.map((o) => (
            <li key={o.id}>
              <Link to={`/orders/${o.id}`} className="card row link-card">
                <div className="grow">
                  <div className="row between">
                    <strong>{o.orderNo}</strong>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="muted small">{dateTime(o.createdAt)}</p>
                  <p className="small">
                    {o.items[0]?.name}
                    {o.items.length > 1 && ` 외 ${o.items.length - 1}건`} · {won(o.totalPrice)}
                  </p>
                  <p className="muted small">{o.roadAddress}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
