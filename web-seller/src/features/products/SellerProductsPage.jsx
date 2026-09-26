import { useEffect, useState } from 'react';
import { createProduct, deleteProduct, listMyProducts, updateProduct } from '@shared/api/product.api.js';
import { won } from '@shared/lib/format.js';

const EMPTY = {
  name: '',
  variety: '부사',
  description: '',
  unit: '박스',
  unitAmount: 5,
  price: 0,
  stock: 0,
  isActive: true,
};

/** 판매자가 자기 판매 품목을 직접 설정하는 화면 */
export default function SellerProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    listMyProducts()
      .then(({ products }) => setProducts(products))
      .catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      await createProduct({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        unitAmount: Number(form.unitAmount),
      });
      setForm(EMPTY);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const patch = async (id, data) => {
    try {
      const { product } = await updateProduct(id, data);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm('이 품목을 삭제할까요? 주문 이력이 있으면 판매 중지로 전환됩니다.')) return;
    try {
      await deleteProduct(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page narrow">
      <h1>판매 품목</h1>
      <p className="muted">가격과 재고를 바꾸면 구매자 화면에 바로 반영됩니다.</p>
      {error && <p className="error">{error}</p>}

      <ul className="list">
        {products.map((p) => (
          <li key={p.id} className="card">
            <div className="row between">
              <strong>{p.name}</strong>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={p.isActive}
                  onChange={(e) => patch(p.id, { isActive: e.target.checked })}
                />
                <span>{p.isActive ? '판매 중' : '판매 중지'}</span>
              </label>
            </div>
            <div className="field">
              <label>설명</label>
              <textarea
                rows={2}
                defaultValue={p.description}
                onBlur={(e) => patch(p.id, { description: e.target.value })}
              />
            </div>

            <div className="row gap">
              <div className="field grow">
                <label>가격(원)</label>
                <input
                  type="number"
                  defaultValue={p.price}
                  onBlur={(e) => patch(p.id, { price: Number(e.target.value) })}
                />
              </div>
              <div className="field grow">
                <label>재고</label>
                <input
                  type="number"
                  defaultValue={p.stock}
                  onBlur={(e) => patch(p.id, { stock: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="row between">
              <span className="price">{won(p.price)}</span>
              <button className="btn ghost sm" onClick={() => remove(p.id)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      <section className="section">
        <h2>새 품목 추가</h2>
        <div className="card form">
          <div className="field">
            <label>상품명</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="부사 사과 5kg"
            />
          </div>
          <div className="field">
            <label>설명</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="row gap">
            <div className="field grow">
              <label>품종</label>
              <input value={form.variety} onChange={(e) => setForm({ ...form, variety: e.target.value })} />
            </div>
            <div className="field grow">
              <label>단위</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div className="field grow">
              <label>단위 수량(kg)</label>
              <input
                type="number"
                value={form.unitAmount}
                onChange={(e) => setForm({ ...form, unitAmount: e.target.value })}
              />
            </div>
          </div>
          <div className="row gap">
            <div className="field grow">
              <label>가격(원)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div className="field grow">
              <label>재고</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <button className="btn full" onClick={create} disabled={busy || !form.name}>
            품목 추가
          </button>
        </div>
      </section>
    </div>
  );
}
