import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.SELLER_KAKAO_IDS = ' 111, 222 ';

const { assertCanBeSeller } = await import('../../src/services/auth.service.js');
const { disconnectDb } = await import('../../src/config/db.js');

after(() => disconnectDb());

describe('판매자 카카오 ID 허용 목록', () => {
  it('목록에 있는 계정은 통과한다 (공백은 무시)', () => {
    assert.doesNotThrow(() => assertCanBeSeller('111'));
    assert.doesNotThrow(() => assertCanBeSeller('222'));
  });

  it('목록에 없는 계정은 403 과 함께 자기 카카오 ID 를 알려준다', () => {
    assert.throws(() => assertCanBeSeller('333'), (err) => err.status === 403 && /333/.test(err.message));
  });
});
