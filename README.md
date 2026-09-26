# 🍎 사과랑 — 산지직송 사과 주문/배송

구매자가 **주소 + 품목**으로 주문하면, 판매자(농장 주인)가 **주문을 접수하고 배송 상태를 관리**하는 서비스.
구매자용 앱과 판매자(농장 운영자)용 앱은 **완전히 분리된 별도의 웹 앱**입니다.

- **web-buyer/** — 구매자 앱 (React 18 + Vite, PWA)
- **web-seller/** — 판매자(농장 운영자) 앱 (React 18 + Vite, PWA)
- **shared/** — 두 앱이 함께 쓰는 코드 (API 클라이언트, 로그인, 포맷 유틸, 주문 상태 컴포넌트, 기본 스타일)
- **server/** — Node.js + Express + Prisma (routes → controllers → services → models 계층 구조), 두 앱이 같은 API 서버를 공유
- **DB** — 현재 SQLite (`server/prisma/dev.db`) → 추후 PostgreSQL(AWS RDS)로 provider 만 교체

---

## 빠른 실행

```bash
# 1) 서버
cd server
cp .env.example .env          # 이미 있으면 생략
npm install
npm run setup                 # prisma db push + seed(판매자/구매자/사과 3종)
npm run dev                   # http://localhost:4000
npm test                      # 단위 + 통합 테스트

# 2) 구매자 앱 (새 터미널)
cd web-buyer
npm install
npm run dev                   # http://localhost:5173

# 3) 판매자 앱 (새 터미널)
cd web-seller
npm install
npm run dev                   # http://localhost:5174
```

구매자 앱(`5173`)의 로그인 화면에서 **"구매자로 접속"**, 판매자 앱(`5174`)의 로그인 화면에서 **"판매자로 접속"** 을 누르면
카카오 앱 등록 없이 각 앱의 전체 흐름을 확인할 수 있습니다.
(`server/.env` 의 `ALLOW_DEV_LOGIN=false` 로 끄면 카카오 로그인만 남습니다.)

두 앱 모두 `/api` 요청을 같은 서버(`:4000`)로 프록시하므로, 서버 하나만 띄우면 됩니다.

---

## 전체 흐름

```
구매자                              서버                          판매자(admin)
──────────────────────────────────────────────────────────────────────────────
카카오 로그인 ─────────────────► JWT 발급
다음 우편번호로 주소 선택 ──────► TMAP 지오코딩 → lat/lng 캐시
품목·수량 선택 + 입금자명 입력
   → 판매자 계좌로 직접 이체 ───► Order(PENDING) 생성, 재고 차감
      ◄── "주문 전송" 알림                      "새 주문" 알림 ──►
                                                            (통장에서 입금 확인)
                                                            입금 확인 클릭
                                                            주문 접수 클릭 (입금 확인 전엔 불가)
      ◄── "주문 접수" 알림          Order(ACCEPTED)
                                                            배송 시작 클릭
      ◄── "배송 시작" 알림          Order(DELIVERING)   배송지 확인
                                                            배송 완료 클릭
      ◄── "배송 완료" 알림          Order(DELIVERED)
```

상태 전이는 서버에서 강제됩니다 (`server/src/utils/constants.js` 의 `STATUS_FLOW`).
`DELIVERED` 된 주문을 다시 `ACCEPTED` 로 되돌리는 요청은 400 으로 거부됩니다.

---

## 폴더 구조

### server — 계층별로 나눈 Express 앱

```
server/
├── src/
│   ├── config/          env(검증된 환경변수) · db(Prisma 싱글턴)
│   ├── routes/          경로 ↔ 컨트롤러 연결만 (index.js 가 /api 전체를 조립)
│   ├── controllers/     요청 파싱 · 검증 호출 · 응답 형태 결정
│   ├── services/        비즈니스 규칙 (상태 전이, 재고, 알림, 외부 API)
│   ├── models/          Prisma 접근 계층 (tx 를 인자로 받아 트랜잭션 재사용)
│   ├── middlewares/     auth · error · logger
│   ├── validators/      zod 스키마 (요청 본문/쿼리)
│   ├── utils/           ApiError · asyncHandler · logger · constants
│   ├── types/           express.d.ts (에디터 자동완성용)
│   ├── app.js           Express 조립 (listen 없음 → 테스트에서 재사용)
│   └── server.js        listen + graceful shutdown
├── tests/
│   ├── unit/            주문번호·상태전이 등 순수 로직
│   └── integration/     실제 앱을 임의 포트에 띄워 HTTP 로 검증
├── logs/                app.log (gitignore)
├── .eslintrc.js
└── jsconfig.json
```

의존 방향은 **routes → controllers → services → models → Prisma** 한 방향입니다.
`process.env` 는 `config/env.js` 에서만 읽고, 그 외에는 `env` 객체를 씁니다.

`npm test` 는 Node 내장 테스트 러너를 쓰므로 추가 설치가 필요 없습니다.
`npm run lint` 는 eslint 를 devDependency 에 추가해 두었으니 `npm install` 후 사용하세요.

### shared — 구매자·판매자 앱이 함께 쓰는 코드

```
shared/
├── api/         client.js(fetch 래퍼) · auth · order · product · notification api
├── auth/        AuthProvider (로그인 상태 · 카카오/개발 로그인 · isSeller 계산)
├── components/  StatusBadge · StatusTimeline (주문 상태 표시)
├── lib/         format(가격·날짜) · order.constants(상태 라벨)
└── styles/      base.css (두 앱 공통 디자인 토큰 · 레이아웃 · 컴포넌트 스타일)
```

`web-buyer`, `web-seller` 는 vite `resolve.alias` 로 `@shared` 를 이 폴더에 매핑해서 사용합니다
(`import { won } from '@shared/lib/format.js'`). 모든 HTTP 호출은 `shared/api/client.js` 한 곳을 지나갑니다.

### web-buyer — 구매자 전용 앱 (기능 단위 구성)

```
web-buyer/src/
├── app/                 App(라우트 표) · Layout · ProtectedRoute
├── features/
│   ├── auth/            LoginPage (카카오/개발 로그인, role=BUYER 고정)
│   ├── home/            HomePage
│   ├── orders/          MyOrdersPage · NewOrderPage · OrderDetailPage
│   └── addresses/       address.api
├── lib/postcode.js      다음 우편번호 팝업 (구매자만 사용)
├── styles/app.css       @shared/styles/base.css import
└── main.jsx
```

라우트: `/`(홈) · `/login` · `/order`(주문) · `/orders`, `/orders/:id`(주문 내역)

### web-seller — 판매자(농장 운영자) 전용 앱 (기능 단위 구성)

```
web-seller/src/
├── app/                 App(라우트 표) · Layout · ProtectedRoute(seller 아니면 접근 차단)
├── features/
│   ├── auth/            LoginPage (카카오/개발 로그인, role=SELLER 고정)
│   ├── orders/          SellerOrdersPage · SellerDeliveryPage
│   └── products/        SellerProductsPage + product.api
├── styles/app.css       @shared/styles/base.css import + 강조색만 초록으로 재정의
└── main.jsx
```

라우트: `/`(들어온 주문) · `/login` · `/orders/:id`(주문 상세) · `/products`(판매 품목)

두 앱은 개발 서버 포트도 분리되어 있습니다 (`web-buyer` 5173, `web-seller` 5174), 둘 다 `/api` 를 같은 서버로 프록시합니다.

---

## ERD

```
User ──1:N── Address            User(SELLER) ──1:N── Product
 │                                                     │
 ├─ BuyerOrders  ─┐                                    │
 └─ SellerOrders ─┴──► Order ──1:N── OrderItem ────────┘
                        │
                        ├──1:N── OrderStatusLog   (상태 변경 이력)
                        └── 배송지 스냅샷 필드     (주소가 바뀌어도 이력 보존)

User ──1:N── DeviceToken (FCM)   User ──1:N── Notification (알림 이력)
```

핵심 설계 포인트

- **배송지 스냅샷**: `Order` 가 `Address` 를 참조만 하는 게 아니라 주문 시점의 주소·좌표를 복사해 둡니다. 구매자가 나중에 주소를 수정/삭제해도 과거 배송 기록이 깨지지 않습니다.
- **좌표 캐시**: 지오코딩 결과를 `Address.lat/lng` 에 저장해 같은 주소를 두 번 조회하지 않습니다.
- **한 주문 = 한 판매자**: 여러 판매자 상품을 한 주문에 담지 못하게 막아 배송 주체를 명확히 합니다.
- **역할 구분**: `role` 하나로 구매자/판매자를 나누고, 라우팅(`ProtectedRoute seller`)과 API(`requireRole`) 양쪽에서 검사합니다.
- **무통장입금**: 결제 게이트웨이 없이 판매자 계좌(`User.bankName/bankAccount/bankHolder`)로 직접 이체받는 방식입니다. 주문마다 `depositorName`(입금자명)을 받아두고, 판매자가 `paymentConfirmedAt` 을 찍어야만(= 입금 확인) `PENDING → ACCEPTED` 전이가 허용됩니다.

---

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/auth/kakao` | 카카오 access_token 검증 후 로그인/가입 |
| POST | `/api/auth/dev-login` | 개발용 로그인 (`ALLOW_DEV_LOGIN=true`) |
| GET | `/api/auth/me` | 내 정보 |
| POST | `/api/auth/device-token` | FCM 토큰 등록 |
| PATCH | `/api/auth/me/bank` | 판매자 입금 계좌 등록/수정 (SELLER 전용) |
| GET/POST/DELETE | `/api/addresses` | 배송지 목록/추가(지오코딩)/삭제 |
| GET | `/api/products` | 판매 중 상품 (공개, 판매자 계좌 정보 포함) |
| GET/POST/PATCH/DELETE | `/api/products/mine`, `/api/products/:id` | 판매자 품목 관리 |
| POST | `/api/orders` | 주문 생성 (`depositorName` 필수) |
| GET | `/api/orders?as=buyer\|seller` | 주문 목록 |
| PATCH | `/api/orders/:id/confirm-payment` | 판매자 입금 확인 (SELLER 전용, PENDING 주문만) |
| PATCH | `/api/orders/:id/status` | 접수/배송시작/완료/취소 (ACCEPTED 전이는 입금 확인 후에만 가능) |
| GET/POST | `/api/notifications`, `/api/notifications/read` | 알림함 |

---

## TMAP — 주소 지오코딩

배송 경로/지도 기능은 제거됐고, TMAP은 이제 주소 저장 시 좌표를 구하는 **지오코딩 용도로만** 남아 있습니다
(`server/src/services/tmap.service.js` 의 `geocode()`, 배송지 추가(`/api/addresses`)·주문 생성(`/api/orders`) 시점에 호출됨).

1. **결과 캐시 7일** — 같은 주소는 재호출하지 않습니다.
2. **일일 상한** — `TMAP_DAILY_LIMIT`(기본 500) 초과 시 429 로 차단합니다.

`TMAP_APP_KEY` 가 없으면 지오코딩은 조용히 생략되고(좌표 없이) 주문/배송지 저장은 그대로 진행됩니다.

---

## 알림 (Firebase)

지금은 `server/src/services/notification.service.js` 가 알림을 **DB(`Notification`)에 기록 + 콘솔 출력**만 합니다.
실제 푸시를 붙이려면:

```bash
cd server && npm i firebase-admin
```

`.env` 에 `FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY` 를 넣고
`notification.service.js` 의 `sendPush()` 안 TODO 를 `admin.messaging().sendEachForMulticast(...)` 로 교체하면 됩니다.
호출부(주문 생성, 상태 변경)는 그대로 두면 되도록 분리해 두었습니다.

푸시를 붙이기 전까지는 프론트가 15~20초 폴링으로 상태를 갱신합니다
(`web-buyer/src/features/orders/OrderDetailPage.jsx`, `web-seller/src/features/orders/SellerOrdersPage.jsx` 의 `setInterval`).

---

## PostgreSQL(AWS RDS) 전환

```prisma
// server/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
DATABASE_URL="postgresql://user:pw@xxx.rds.amazonaws.com:5432/apple?schema=public"
npx prisma migrate dev --name init
```

SQLite 에 없는 enum 을 쓰고 싶다면 `role`/`status` String 컬럼을 Prisma `enum` 으로 바꾸면 됩니다. 값은 이미 `server/src/utils/constants.js` 에 상수로 모아두었습니다.

---

## 화면 구성

**구매자 앱 (web-buyer, :5173)**

| 경로 | 화면 |
|---|---|
| `/` | 홍보 첫 화면 (사진·문구·판매 중인 사과) |
| `/login` | 카카오 로그인 / 개발용 로그인 |
| `/order` | 품목 선택 → 주소 입력 → 판매자 계좌 확인 + 입금자명 입력 → 주문 전송 |
| `/orders`, `/orders/:id` | 주문 내역 / 입금 확인 상태 / 배송 진행 타임라인 |

**판매자(농장 운영자) 앱 (web-seller, :5174)** — 자기 주문만 조회됩니다 (`sellerId` 필터 + `requireRole`)

| 경로 | 화면 |
|---|---|
| `/login` | 카카오 로그인 / 개발용 로그인 (SELLER 계정만 통과) |
| `/` | 상태별 탭(접수 대기/접수/배송 중/완료). 접수 대기 주문은 입금자명 확인 → **입금 확인** → **주문 접수** 순서로만 진행 가능 |
| `/orders/:id` | 주문 상세(배송지·품목) + 배송 완료 처리 |
| `/products` | 판매 품목 추가/가격·재고 수정/판매 중지 |
| `/settings/bank` | 입금받을 계좌(은행명/계좌번호/예금주) 등록 — 구매자 주문 화면에 그대로 노출됨 |

---

## 다음 작업 후보

- [ ] Firebase FCM 실연동 (웹 푸시 + PWA 알림 권한)
- [ ] 카카오 개발자 콘솔 앱 등록 → `VITE_KAKAO_JS_KEY`, `KAKAO_REST_API_KEY`
- [ ] 상품 이미지 업로드 (S3 presigned URL)
- [ ] 결제 연동
- [ ] 판매자 매출 통계
- [ ] PostgreSQL/RDS 전환 + 배포 (서버: ECS/EB, 웹: `web-buyer`/`web-seller` 를 각각 S3+CloudFront 또는 서로 다른 서브도메인으로 배포)
