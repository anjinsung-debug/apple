import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 배포 시 한 도메인의 /seller 경로에서 서비스된다 (루트 vercel.json 참고)
  base: '/seller/',
  build: { outDir: 'dist/seller' },
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    proxy: {
      // 개발 중에는 프론트에서 /api 로만 호출하면 서버(4000)로 넘어감
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
  },
});
