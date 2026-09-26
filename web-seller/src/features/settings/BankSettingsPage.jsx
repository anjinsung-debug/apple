import { useState } from 'react';
import { useAuth } from '@shared/auth/AuthProvider.jsx';
import { updateBank } from '@shared/api/auth.api.js';

/** 판매자 입금 계좌 정보 — 구매자 주문 화면에 그대로 노출된다 */
export default function BankSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    bankName: user?.bankName ?? '',
    bankAccount: user?.bankAccount ?? '',
    bankHolder: user?.bankHolder ?? '',
  });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateBank(form);
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page narrow">
      <h1>내 계좌 정보</h1>
      <p className="muted">구매자가 주문할 때 이 계좌로 입금 안내를 받습니다.</p>
      {error && <p className="error">{error}</p>}
      {saved && !error && <p className="muted small">저장했습니다.</p>}

      <div className="card form">
        <div className="field">
          <label>은행명</label>
          <input
            value={form.bankName}
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            placeholder="농협"
          />
        </div>
        <div className="field">
          <label>계좌번호</label>
          <input
            value={form.bankAccount}
            onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
            placeholder="000-0000-0000-00"
          />
        </div>
        <div className="field">
          <label>예금주</label>
          <input
            value={form.bankHolder}
            onChange={(e) => setForm({ ...form, bankHolder: e.target.value })}
            placeholder="홍길동"
          />
        </div>
        <button
          className="btn full"
          onClick={save}
          disabled={busy || !form.bankName || !form.bankAccount || !form.bankHolder}
        >
          저장
        </button>
      </div>
    </div>
  );
}
