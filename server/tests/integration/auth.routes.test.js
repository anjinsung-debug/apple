import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

// 환경변수는 앱을 import 하기 전에 고정한다 (DB 를 건드리지 않는 경로만 테스트)
process.env.NODE_ENV = 'test';
process.env.ALLOW_DEV_LOGIN = 'false';

const { createApp } = await import('../../src/app.js');
const { disconnectDb } = await import('../../src/config/db.js');

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDb();
});

const get = (path, init) => fetch(`${baseUrl}${path}`, init);
const postJson = (path, body) =>
  fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/health', () => {
  it('200 과 ok:true 를 돌려준다', async () => {
    const res = await get('/api/health');
    assert.equal(res.status, 200);
    assert.equal((await res.json()).ok, true);
  });
});

describe('없는 경로', () => {
  it('404 로 응답한다', async () => {
    const res = await get('/api/does-not-exist');
    assert.equal(res.status, 404);
    assert.match((await res.json()).message, /찾을 수 없습니다/);
  });
});

describe('GET /api/auth/me', () => {
  it('토큰이 없으면 401', async () => {
    const res = await get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  it('토큰이 잘못됐으면 401', async () => {
    const res = await get('/api/auth/me', { headers: { Authorization: 'Bearer not-a-jwt' } });
    assert.equal(res.status, 401);
  });
});

describe('POST /api/auth/dev-login', () => {
  it('입력값이 없으면 400 과 상세 오류를 준다', async () => {
    const res = await postJson('/api/auth/dev-login', {});
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.ok(Array.isArray(body.details));
    assert.ok(body.details.some((d) => d.path === 'kakaoId'));
  });

  it('ALLOW_DEV_LOGIN=false 면 403 으로 막는다', async () => {
    const res = await postJson('/api/auth/dev-login', { kakaoId: 'test-user' });
    assert.equal(res.status, 403);
  });
});
