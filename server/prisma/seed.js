import { disconnectDb, prisma } from '../src/config/db.js';
import { ROLE } from '../src/utils/constants.js';

async function main() {
  // ── 판매자 (사과 농장 주인) ─────────────────────────────
  const seller = await prisma.user.upsert({
    where: { kakaoId: 'seller-demo' },
    update: {},
    create: {
      kakaoId: 'seller-demo',
      nickname: '사과농장 주인',
      phone: '010-1111-2222',
      roles: ROLE.SELLER,
    },
  });

  // 판매자 기본 주소 = 배송 출발지 (경로 안내의 출발점)
  const existingBase = await prisma.address.findFirst({ where: { userId: seller.id } });
  if (!existingBase) {
    await prisma.address.create({
      data: {
        userId: seller.id,
        label: '농장 창고',
        recipient: '사과농장 주인',
        phone: '010-1111-2222',
        zonecode: '36628',
        roadAddress: '경상북도 안동시 풍천면 도청대로 455',
        detail: '창고동',
        lat: 36.5760,
        lng: 128.5056,
        isDefault: true,
      },
    });
  }

  // ── 구매자 ────────────────────────────────────────────
  const buyer = await prisma.user.upsert({
    where: { kakaoId: 'buyer-demo' },
    update: {},
    create: {
      kakaoId: 'buyer-demo',
      nickname: '홍길동',
      phone: '010-3333-4444',
      roles: ROLE.BUYER,
    },
  });

  // 구매자 기본 배송지 = "우리집" (다음 우편번호 검색 없이도 바로 주문 흐름을 확인할 수 있게)
  const existingHome = await prisma.address.findFirst({ where: { userId: buyer.id } });
  if (!existingHome) {
    await prisma.address.create({
      data: {
        userId: buyer.id,
        label: '우리집',
        recipient: '홍길동',
        phone: '010-3333-4444',
        zonecode: '06158',
        roadAddress: '서울특별시 강남구 테헤란로 427',
        detail: '101동 1201호',
        lat: 37.5045,
        lng: 127.0492,
        isDefault: true,
      },
    });
  }

  // ── 상품: 사과 고정 ────────────────────────────────────
  const apples = [
    {
      name: '부사 사과 5kg',
      variety: '부사',
      description: '아침에 딴 햇사과. 아삭하고 당도가 높습니다. (13~16과)',
      unit: '박스',
      unitAmount: 5,
      price: 29000,
      stock: 50,
      imageUrl: '/images/apple-busa.jpg',
    },
    {
      name: '홍로 사과 3kg',
      variety: '홍로',
      description: '추석 선물용으로 인기 있는 새콤달콤한 사과. (9~11과)',
      unit: '박스',
      unitAmount: 3,
      price: 21000,
      stock: 30,
      imageUrl: '/images/apple-hongro.jpg',
    },
    {
      name: '못난이 사과 10kg',
      variety: '부사',
      description: '흠집만 있을 뿐 맛은 똑같습니다. 주스·잼용으로 추천.',
      unit: '박스',
      unitAmount: 10,
      price: 32000,
      stock: 20,
      imageUrl: '/images/apple-ugly.jpg',
    },
  ];

  for (const apple of apples) {
    const found = await prisma.product.findFirst({ where: { sellerId: seller.id, name: apple.name } });
    if (!found) {
      await prisma.product.create({ data: { ...apple, sellerId: seller.id } });
    }
  }

  console.log('✅ seed 완료');
  console.log(`   판매자 kakaoId: seller-demo (role=SELLER, id=${seller.id})`);
  console.log(`   구매자 kakaoId: buyer-demo  (role=BUYER,  id=${buyer.id})`);
  console.log('   → 프론트 개발용 로그인에서 위 계정으로 접속하세요.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => disconnectDb());
