import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { tokenStore } from '../api/client.js';
import { devLogin, fetchMe, kakaoLogin } from '../api/auth.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    fetchMe()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isSeller: user?.roles?.includes('SELLER') || user?.roles?.includes('ADMIN'),

      /**
       * 카카오 로그인 시작 — Kakao.Auth.authorize() 로 카카오 동의 화면으로 이동한다.
       * (JS SDK 2.x 부터 팝업으로 access_token 을 바로 받는 Kakao.Auth.login() 이 사라지고
       *  redirectUri 로 돌아오는 인가 코드(code) 방식만 남음. 페이지를 완전히 떠나므로 반환값 없음)
       */
      startKakaoLogin(redirectUri) {
        const jsKey = import.meta.env.VITE_KAKAO_JS_KEY;
        if (!jsKey || !window.Kakao) throw new Error('카카오 키가 설정되지 않았습니다.');
        if (!window.Kakao.isInitialized()) window.Kakao.init(jsKey);
        window.Kakao.Auth.authorize({ redirectUri });
      },

      /** redirectUri 로 돌아온 인가 코드(code)로 로그인을 마무리한다 */
      async completeKakaoLogin(code, redirectUri, role) {
        const { token, user } = await kakaoLogin({ code, redirectUri, role });
        tokenStore.set(token);
        setUser(user);
        return user;
      },

      /** 로컬 개발용: 카카오 앱 등록 전에도 흐름을 확인할 수 있게 */
      async loginAsDev(kakaoId, nickname, role) {
        const { token, user } = await devLogin({ kakaoId, nickname, role });
        tokenStore.set(token);
        setUser(user);
        return user;
      },

      logout() {
        tokenStore.clear();
        setUser(null);
        if (window.Kakao?.Auth?.getAccessToken()) window.Kakao.Auth.logout();
      },

      /** 서버에 저장된 최신 내 정보로 갱신 (예: 계좌 정보 수정 후) */
      async refreshUser() {
        const { user } = await fetchMe();
        setUser(user);
        return user;
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
