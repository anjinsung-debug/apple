import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';

const { buildOrderNo, orderNoPrefix, canTransition } = await import('../../src/services/order.service.js');
const { ORDER_STATUS } = await import('../../src/utils/constants.js');
const { disconnectDb } = await import('../../src/config/db.js');

after(() => disconnectDb());

describe('주문번호 생성', () => {
  it('AP + YYMMDD + 4자리 일련번호 형태여야 한다', () => {
    assert.equal(buildOrderNo(new Date(2025, 8, 3), 1), 'AP250903-0001');
    assert.equal(buildOrderNo(new Date(2025, 11, 25), 42), 'AP251225-0042');
  });

  it('일련번호가 4자리를 넘어도 잘리지 않는다', () => {
    assert.equal(buildOrderNo(new Date(2025, 0, 1), 12345), 'AP250101-12345');
  });

  it('prefix 는 같은 날짜의 주문을 세는 데 쓰인다', () => {
    const date = new Date(2025, 8, 3);
    assert.equal(orderNoPrefix(date), 'AP250903');
    assert.ok(buildOrderNo(date, 7).startsWith(orderNoPrefix(date)));
  });
});

describe('주문 상태 전이 규칙', () => {
  it('정상 흐름은 허용된다', () => {
    assert.ok(canTransition(ORDER_STATUS.PENDING, ORDER_STATUS.ACCEPTED));
    assert.ok(canTransition(ORDER_STATUS.ACCEPTED, ORDER_STATUS.DELIVERING));
    assert.ok(canTransition(ORDER_STATUS.DELIVERING, ORDER_STATUS.DELIVERED));
  });

  it('단계를 건너뛰거나 되돌리는 전이는 막는다', () => {
    assert.equal(canTransition(ORDER_STATUS.PENDING, ORDER_STATUS.DELIVERED), false);
    assert.equal(canTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.ACCEPTED), false);
    assert.equal(canTransition(ORDER_STATUS.DELIVERING, ORDER_STATUS.CANCELLED), false);
  });

  it('종료 상태에서는 어떤 전이도 불가능하다', () => {
    assert.equal(canTransition(ORDER_STATUS.DELIVERED, ORDER_STATUS.DELIVERING), false);
    assert.equal(canTransition(ORDER_STATUS.CANCELLED, ORDER_STATUS.ACCEPTED), false);
  });

  it('접수 전에는 취소할 수 있다', () => {
    assert.ok(canTransition(ORDER_STATUS.PENDING, ORDER_STATUS.CANCELLED));
    assert.ok(canTransition(ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED));
  });
});
