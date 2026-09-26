import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth/AuthProvider.jsx';
import { createOrder } from '@shared/api/order.api.js';
import { listProducts } from '@shared/api/product.api.js';
import { won } from '@shared/lib/format.js';
import { createAddress, listAddresses } from '../addresses/address.api.js';
import { openPostcode } from '../../lib/postcode.js';

const EMPTY_ADDRESS = {
  label: '우리집',
  recipient: '',
  phone: '',
  zonecode: '',
  roadAddress: '',
  jibunAddress: '',
  detail: '',
};

export default function NewOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [quantities, setQuantities] = useState({}); // productId -> qty
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [adding, setAdding] = useState(false);
  const [memo, setMemo] = useState('');
  const [depositorName, setDepositorName] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([listProducts(), listAddresses()])
      .then(([p, a]) => {
        setProducts(p.products);
        setAddresses(a.addresses);
        const preferred = a.addresses.find((x) => x.isDefault) ?? a.addresses[0];
        if (preferred) setSelectedAddressId(preferred.id);
        else setAdding(true);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (user?.nickname) setDepositorName((prev) => prev || user.nickname);
  }, [user]);

  const setQty = (productId, next) =>
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, next) }));

  const lines = products
    .map((p) => ({ product: p, quantity: quantities[p.id] ?? 0 }))
    .filter((l) => l.quantity > 0);
  const total = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);
  const seller = lines[0]?.product.seller;

  /** 다음 우편번호 팝업 → 폼 채우기 */
  const searchAddress = async () => {
    try {
      const result = await openPostcode();
      setForm((prev) => ({
        ...prev,
        zonecode: result.zonecode,
        roadAddress: result.roadAddress,
        jibunAddress: result.jibunAddress ?? '',
        detail: result.buildingName ? `${result.buildingName} ` : prev.detail,
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const saveAddress = async () => {
    setBusy(true);
    setError(null);
    try {
      const { address } = await createAddress({
        ...form,
        isDefault: addresses.length === 0,
      });
      setAddresses((prev) => [address, ...prev]);
      setSelectedAddressId(address.id);
      setForm(EMPTY_ADDRESS);
      setAdding(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { order } = await createOrder({
        addressId: selectedAddressId,
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        memo: memo || null,
        depositorName: depositorName.trim(),
      });
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = lines.length > 0 && selectedAddressId && depositorName.trim() && !busy;

  return (
    <div className="page narrow">
      <h1>사과 주문하기</h1>
      {error && <p className="error">{error}</p>}

      {/* ── 1. 상품 선택 ───────────────────────────────── */}
      <section className="section">
        <h2>1. 품목 선택</h2>
        {products.length === 0 && <p className="muted">판매 중인 상품이 없습니다.</p>}

        <ul className="list">
          {products.map((p) => (
            <li key={p.id} className="card row">
              <div className="grow">
                <strong>{p.name}</strong>
                <p className="muted small">{p.description}</p>
                <span className="price">{won(p.price)}</span>
                {p.stock === 0 && <span className="badge cancelled">품절</span>}
              </div>
              <div className="stepper">
                <button onClick={() => setQty(p.id, (quantities[p.id] ?? 0) - 1)} aria-label="수량 줄이기">
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  max={p.stock}
                  value={quantities[p.id] ?? 0}
                  onChange={(e) => setQty(p.id, Number(e.target.value))}
                />
                <button
                  onClick={() => setQty(p.id, Math.min(p.stock, (quantities[p.id] ?? 0) + 1))}
                  aria-label="수량 늘리기"
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 2. 배송지 ─────────────────────────────────── */}
      <section className="section">
        <h2>2. 배송지</h2>

        {addresses.length > 0 && (
          <ul className="list">
            {addresses.map((a) => (
              <li key={a.id}>
                <label className={`card row selectable ${selectedAddressId === a.id ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === a.id}
                    onChange={() => setSelectedAddressId(a.id)}
                  />
                  <div className="grow">
                    <strong>
                      {a.label} · {a.recipient}
                    </strong>
                    <p className="muted small">
                      ({a.zonecode}) {a.roadAddress} {a.detail}
                    </p>
                    <p className="muted small">{a.phone}</p>
                  </div>
                  {a.lat == null && <span className="badge pending">좌표 미확인</span>}
                </label>
              </li>
            ))}
          </ul>
        )}

        {!adding ? (
          <button className="btn ghost full" onClick={() => setAdding(true)}>
            + 새 배송지 추가
          </button>
        ) : (
          <div className="card form">
            <div className="field">
              <label>주소</label>
              <div className="row gap">
                <input value={form.roadAddress} placeholder="주소 검색을 눌러주세요" readOnly />
                <button className="btn sm" onClick={searchAddress}>
                  주소 검색
                </button>
              </div>
              {form.zonecode && <small className="muted">우편번호 {form.zonecode}</small>}
            </div>

            <div className="field">
              <label>상세 주소</label>
              <input
                value={form.detail}
                onChange={(e) => setForm({ ...form, detail: e.target.value })}
                placeholder="동/호수, 출입 방법 등"
              />
            </div>

            <div className="row gap">
              <div className="field grow">
                <label>받는 분</label>
                <input
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                />
              </div>
              <div className="field grow">
                <label>연락처</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="field">
              <label>배송지 이름</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>

            <div className="row gap">
              <button
                className="btn grow"
                onClick={saveAddress}
                disabled={busy || !form.roadAddress || !form.recipient || !form.phone}
              >
                이 주소로 저장
              </button>
              {addresses.length > 0 && (
                <button className="btn ghost" onClick={() => setAdding(false)}>
                  취소
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── 3. 요청사항 ─────────────────────────────────── */}
      <section className="section">
        <h2>3. 요청사항</h2>
        <textarea
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="문 앞에 놓아주세요 / 부재 시 연락 부탁드립니다"
        />
      </section>

      {/* ── 4. 입금 계좌 ─────────────────────────────────── */}
      {lines.length > 0 && (
        <section className="section">
          <h2>4. 입금 계좌</h2>
          {seller?.bankAccount ? (
            <div className="card">
              <p>
                <strong>{seller.bankName}</strong> {seller.bankAccount}
              </p>
              <p className="muted small">예금주 {seller.bankHolder}</p>
              <p className="muted small">위 계좌로 합계 금액을 입금해주세요.</p>
            </div>
          ) : (
            <p className="error">판매자가 아직 계좌 정보를 등록하지 않았습니다. 문의 후 주문해주세요.</p>
          )}

          <div className="field">
            <label>입금자명</label>
            <input
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              placeholder="입금하실 분 성함"
            />
            <small className="muted">주문자와 입금자가 다르면 꼭 입금자명을 알려주세요.</small>
          </div>
        </section>
      )}

      <div className="summary card">
        {lines.map((l) => (
          <div key={l.product.id} className="row between">
            <span>
              {l.product.name} × {l.quantity}
            </span>
            <span>{won(l.product.price * l.quantity)}</span>
          </div>
        ))}
        <div className="row between total">
          <strong>합계</strong>
          <strong>{won(total)}</strong>
        </div>
      </div>

      <button className="btn lg full" onClick={submit} disabled={!canSubmit}>
        {busy ? '주문 전송 중…' : '주문 전송하기'}
      </button>
    </div>
  );
}
