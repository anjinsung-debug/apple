// requireAuth 가 채워 넣는 req.user 를 에디터가 인식하도록 하는 앰비언트 타입.
// (런타임에는 영향이 없고, jsconfig.json 을 통해 자동완성에만 사용됩니다.)
import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /** requireAuth 통과 시에만 채워진다 */
      user: User;
    }
  }
}

export {};
