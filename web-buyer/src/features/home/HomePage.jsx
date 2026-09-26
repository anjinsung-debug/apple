import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listProducts } from '@shared/api/product.api.js';
import { won } from '@shared/lib/format.js';

/** 구매자 첫 화면: 홍보 문구 + 사진 + 판매 중인 사과 */
export default function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    listProducts().then(({ products }) => setProducts(products)).catch(() => {});
  }, []);

  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-copy">
          <h1>진안 고원, 농장부터 안방까지</h1>
          <p className="lead">
            주문이 들어오면 직접 수확한 사과를 골라 담아
            농장 주인이 직접 배송합니다.
          </p>
        </div>
      </section>

      <section className="section">
        <h2>지금 판매 중인 사과</h2>
        {products.length === 0 ? (
          <p className="muted">아직 등록된 상품이 없습니다.</p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <article key={p.id} className="card product-card">
                <div className="product-thumb">🍎</div>
                <div className="product-body">
                  <h3>{p.name}</h3>
                  <p className="muted small">{p.description}</p>
                  <div className="product-foot">
                    <strong>{won(p.price)}</strong>
                    <span className="muted small">{p.stock > 0 ? `재고 ${p.stock}` : '품절'}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <br></br>
        <Link className="btn lg full" to="/order">
          주문하러 가기
        </Link>
      </section>
    </div>
  );
}
