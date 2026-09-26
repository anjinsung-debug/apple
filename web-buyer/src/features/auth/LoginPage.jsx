import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/auth/AuthProvider.jsx';

const KAKAO_REDIRECT_URI = `${window.location.origin}/login`;
const FROM_KEY = 'kakao.from';

export default function LoginPage() {
  const { startKakaoLogin, completeKakaoLogin, loginAsDev } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const handledRef = useRef(false); // 개발 모드 StrictMode 이중 실행 + 새로고침 시 code 재사용 방지

  const go = () => {
    const from = sessionStorage.getItem(FROM_KEY);
    sessionStorage.removeItem(FROM_KEY);
    navigate(from || location.state?.from || '/order', { replace: true });
  };

  // 카카오 동의 화면 → 여기(redirectUri)로 돌아왔을 때: URL 의 code 로 로그인을 마무리한다
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const kakaoError = params.get('error');
    if (!code && !kakaoError) return;
    if (handledRef.current) return;
    handledRef.current = true;

    // code 는 1회용이라 재시도/재실행이 다시 쓰지 못하도록 URL 에서 즉시 제거
    window.history.replaceState(null, '', '/login');

    if (kakaoError) {
      setError('카카오 로그인이 취소되었습니다.');
      return;
    }

    setBusy(true);
    completeKakaoLogin(code, KAKAO_REDIRECT_URI, 'BUYER')
      .then(go)
      .catch((err) => setError(err.message))
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      go();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startKakao = () => {
    try {
      sessionStorage.setItem(FROM_KEY, location.state?.from ?? '/order');
      startKakaoLogin(KAKAO_REDIRECT_URI);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page narrow">
      <h1>로그인</h1>
      <p className="muted">카카오 계정으로 로그인하면 주문 내역이 저장됩니다.</p>

      {error && <p className="error">{error}</p>}

      <button className="btn kakao lg full" disabled={busy} onClick={startKakao}>
        카카오로 시작하기
      </button>

      <div className="divider">
        <span>또는 개발용 계정</span>
      </div>

      <div className="dev-login">
        <button
          className="btn ghost full"
          disabled={busy}
          onClick={() => run(() => loginAsDev('buyer-demo', '홍길동', 'BUYER'))}
        >
          구매자로 접속 (buyer-demo)
        </button>
        <p className="muted small">
          카카오 앱 등록 전에도 전체 흐름을 확인할 수 있는 계정입니다. 배포 시
          <code> ALLOW_DEV_LOGIN=false </code>로 꺼주세요.
        </p>
      </div>
    </div>
  );
}
