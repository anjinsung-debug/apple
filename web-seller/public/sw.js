// 아주 단순한 오프라인 캐시 (PWA 설치 요건 충족용)
const CACHE = 'apple-delivery-seller-v1';
const ASSETS = ['./', './index.html', './icon.svg', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // API 는 항상 네트워크 우선 (주문 데이터는 캐시하면 안 됨)
  if (request.method !== 'GET' || new URL(request.url).pathname.startsWith('/api')) return;

  e.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).catch(() => caches.match('./index.html'))),
  );
});
