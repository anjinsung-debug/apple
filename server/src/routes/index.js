import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { addressRouter } from './address.routes.js';
import { productRouter } from './product.routes.js';
import { orderRouter } from './order.routes.js';
import { notificationRouter } from './notification.routes.js';

/** /api 아래의 모든 라우트를 한 곳에서 조립한다 */
export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

apiRouter.use('/auth', authRouter);
apiRouter.use('/addresses', addressRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/notifications', notificationRouter);
