import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const threshold = LEVELS[env.LOG_LEVEL] ?? LEVELS.info;

const logDir = path.resolve(process.cwd(), env.LOG_DIR);
let fileStream = null;

/** logs/ 는 gitignore 대상. 테스트 환경에서는 파일을 만들지 않는다. */
function getStream() {
  if (env.isTest) return null;
  if (fileStream) return fileStream;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fileStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });
  } catch {
    fileStream = null; // 파일 로깅 실패는 무시하고 콘솔만 사용
  }
  return fileStream;
}

function write(level, args) {
  if (LEVELS[level] > threshold) return;

  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${args
    .map((a) => (typeof a === 'string' ? a : formatValue(a)))
    .join(' ')}`;

  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
  getStream()?.write(`${stripAnsi(line)}\n`); // 파일에는 morgan 의 색상코드를 남기지 않는다
}

// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

function stripAnsi(text) {
  return text.replace(ANSI_PATTERN, '');
}

function formatValue(value) {
  if (value instanceof Error) return value.stack ?? value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const logger = {
  error: (...args) => write('error', args),
  warn: (...args) => write('warn', args),
  info: (...args) => write('info', args),
  debug: (...args) => write('debug', args),

  /** morgan 이 사용할 스트림 */
  stream: { write: (message) => write('info', [message.trim()]) },
};
