import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { confirmOrderPayment, listOrders, updateOrderStatus } from '@shared/api/order.api.js';
import StatusBadge from '@shared/components/StatusBadge.jsx';
import { dateTime, won } from '@shared/lib/format.js';

const TABS = [
  { key: 'PENDING', label: '접수 대기' },
  { key: 'ACCEPTED', label: '접수 완료' },
  { key: 'DELIVERING', label: '배송 중' },
  { key: 'DELIVERED', label: '배송 완료' },
];

/** 판매자(admin) 화면: 나에게 들어온 주문만 본다 */
export default function SellerOrdersPage() {
  const [tab, setTab] = useState('PENDING');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    listOrders({ as: 'seller' })
      .then(({ orders }) => setOrders(orders))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
    const timer = setInterval(load, 20000); // 새 주문 폴링 (FCM 붙이면 제거 가능)
    return () => clearInterval(timer);
  }, []);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    setError(null);
    try {
      await updateOrderStatus(id, status);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const confirmPayment = async (id) => {
    setBusyId(id);
    setError(null);
    try {
      await confirmOrderPayment(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const filtered = orders.filter((o) => o.status === tab);
  const counts = Object.fromEntries(TABS.map((t) => [t.key, orders.filter((o) => o.status === t.key).length]));

  return (
    <div className="page">
      <h1>들어온 주문</h1>
      {error && <p className="error">{error}</p>}

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
            {counts[t.key] > 0 && <span className="count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="muted">해당하는 주문이 없습니다.</p>
      ) : (
        <ul className="list">
          {filtered.map((o) => (
            <li key={o.id} className="card">
              <div className="row between">
                <strong>{o.orderNo}</strong>
                <StatusBadge status={o.status} />
              </div>
              <p className="muted small">{dateTime(o.createdAt)}</p>

              <p>
                <strong>{o.recipient}</strong> · {o.phone}
              </p>
              <p className="muted small">
                ({o.zonecode}) {o.roadAddress} {o.detail}
              </p>
              {o.memo && <p className="muted small">요청: {o.memo}</p>}

              {o.status === 'PENDING' && (
                <p className="small">
                  입금자명: <strong>{o.depositorName}</strong>{' '}
                  {o.paymentConfirmedAt ? (
                    <span className="badge delivered">입금 확인됨</span>
                  ) : (
                    <span className="badge pending">입금 확인 전</span>
                  )}
                </p>
              )}

              <ul className="item-lines">
                {o.items.map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
              <p className="price">{won(o.totalPrice)}</p>

              <div className="row gap">
                {o.status === 'PENDING' && (
                  <>
                    {!o.paymentConfirmedAt ? (
                      <button className="btn grow" disabled={busyId === o.id} onClick={() => confirmPayment(o.id)}>
                        입금 확인
                      </button>
                    ) : (
                      <button className="btn grow" disabled={busyId === o.id} onClick={() => changeStatus(o.id, 'ACCEPTED')}>
                        주문 접수
                      </button>
                    )}
                    <button
                      className="btn ghost"
                      disabled={busyId === o.id}
                      onClick={() => changeStatus(o.id, 'CANCELLED')}
                    >
                      거절
                    </button>
                  </>
                )}
                {o.status === 'ACCEPTED' && (
                  <>
                    <button className="btn grow" disabled={busyId === o.id} onClick={() => changeStatus(o.id, 'DELIVERING')}>
                      배송 시작
                    </button>
                    <Link className="btn ghost" to={`/orders/${o.id}`}>
                      상세보기
                    </Link>
                  </>
                )}
                {o.status === 'DELIVERING' && (
                  <>
                    <Link className="btn grow" to={`/orders/${o.id}`}>
                      상세보기
                    </Link>
                    <button
                      className="btn ghost"
                      disabled={busyId === o.id}
                      onClick={() => changeStatus(o.id, 'DELIVERED')}
                    >
                      배송 완료
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
