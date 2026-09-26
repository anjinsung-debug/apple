import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '@shared/api/order.api.js';
import StatusBadge from '@shared/components/StatusBadge.jsx';

/** 판매자 주문 상세: 배송지 확인 + 배송 완료 처리 */
export default function SellerDeliveryPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOrder(id)
      .then(({ order }) => setOrder(order))
      .catch((err) => setError(err.message));
  }, [id]);

  const complete = async () => {
    setBusy(true);
    try {
      await updateOrderStatus(id, 'DELIVERED');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (error && !order) return <div className="page narrow"><p className="error">{error}</p></div>;
  if (!order) return <div className="page narrow"><p className="muted">불러오는 중…</p></div>;

  return (
    <div className="page narrow">
      <div className="row between">
        <h1>{order.orderNo}</h1>
        <StatusBadge status={order.status} />
      </div>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <strong>{order.recipient}</strong>
        <p>
          ({order.zonecode}) {order.roadAddress} {order.detail}
        </p>
        <p className="muted small">{order.phone}</p>
        {order.memo && <p className="muted small">요청: {order.memo}</p>}
      </section>

      {order.status === 'DELIVERING' && (
        <button className="btn lg full" onClick={complete} disabled={busy}>
          배송 완료 처리 (구매자에게 알림 전송)
        </button>
      )}
    </div>
  );
}
