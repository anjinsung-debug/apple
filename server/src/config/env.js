import 'dotenv/config';
import { z } from 'zod';

/** "true"/"false" 문자열을 boolean 으로 */
const boolish = (fallback) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? fallback : v === 'true'));

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v ? v : ''));

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default(''),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL 이 필요합니다.'),

  JWT_SECRET: z.string().min(1, 'JWT_SECRET 이 필요합니다.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ALLOW_DEV_LOGIN: boolish(false),

  KAKAO_REST_API_KEY: optionalString,
  KAKAO_CLIENT_SECRET: optionalString,

  TMAP_APP_KEY: optionalString,
  TMAP_DAILY_LIMIT: z.coerce.number().int().positive().default(500),

  FIREBASE_PROJECT_ID: optionalString,
  FIREBASE_CLIENT_EMAIL: optionalString,
  FIREBASE_PRIVATE_KEY: optionalString,

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('logs'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  console.error(`환경변수 설정이 올바르지 않습니다.\n${lines.join('\n')}\n(.env.example 을 참고하세요)`);
  process.exit(1);
}

const raw = parsed.data;

/** 앱 전체에서 process.env 대신 이 객체만 사용한다. */
export const env = {
  ...raw,

  isDev: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  isProd: raw.NODE_ENV === 'production',

  /** CORS 허용 오리진 목록 (비어 있으면 전체 허용) */
  corsOrigins: raw.CORS_ORIGIN.split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  /** 외부 연동 활성화 여부 */
  hasKakao: Boolean(raw.KAKAO_REST_API_KEY),
  hasTmap: Boolean(raw.TMAP_APP_KEY),
  hasFirebase: Boolean(raw.FIREBASE_PROJECT_ID),
};
