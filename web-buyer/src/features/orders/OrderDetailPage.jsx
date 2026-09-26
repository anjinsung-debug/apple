import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '@shared/api/order.api.js';
import StatusBadge from '@shared/components/StatusBadge.jsx';
import StatusTimeline from '@shared/components/StatusTimeline.jsx';
import { dateTime, won } from '@shared/lib/format.js';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    getOrder(id)
      .then(({ order }) => setOrder(order))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    // 배송 상태는 판매자가 바꾸므로 화면이 열려 있는 동안 주기적으로 갱신
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [id]);

  const cancel = async () => {
    if (!confirm('주문을 취소할까요?')) return;
    setBusy(true);
    try {
      const { order } = await updateOrderStatus(id, 'CANCELLED', '구매자 취소');
      setOrder(order);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="page narrow"><p className="error">{error}</p></div>;
  if (!order) return <div className="page narrow"><p className="muted">불러오는 중…</p></div>;

  return (
    <div className="page narrow">
      <div className="row between">
        <h1>{order.orderNo}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="muted small">{dateTime(order.createdAt)} 주문</p>

      <section className="section">
        <h2>배송 진행</h2>
        <StatusTimeline order={order} />
      </section>

      {order.status === 'PENDING' && (
        <section className="section">
          <h2>입금 확인</h2>
          <div className="card">
            <p>
              입금자명 <strong>{order.depositorName}</strong>
            </p>
            {order.paymentConfirmedAt ? (
              <p className="muted small">판매자가 입금을 확인했습니다. 곧 접수됩니다.</p>
            ) : (
              <p className="muted small">판매자가 입금을 확인하면 주문이 접수됩니다.</p>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <h2>배송지</h2>
        <div className="card">
          <strong>{order.recipient}</strong>
          <p className="muted small">{order.phone}</p>
          <p>
            ({order.zonecode}) {order.roadAddress} {order.detail}
          </p>
          {order.memo && <p className="muted small">요청사항: {order.memo}</p>}
        </div>
      </section>

      <section className="section">
        <h2>주문 품목</h2>
        <div className="card">
          {order.items.map((item) => (
            <div key={item.id} className="row between">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>{won(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="row between total">
            <strong>합계</strong>
            <strong>{won(order.totalPrice)}</strong>
          </div>
        </div>
      </section>

      {order.status === 'PENDING' && (
        <button className="btn ghost full" onClick={cancel} disabled={busy}>
          주문 취소
        </button>
      )}
      <Link className="btn ghost full" to="/orders">
        주문 내역으로
      </Link>
    </div>
  );
}
