import { orderService } from '../services/order.service.js';
import {
  createOrderSchema,
  listOrderQuerySchema,
  orderIdSchema,
  updateStatusSchema,
} from '../validators/order.validator.js';

export const orderController = {
  /** POST /api/orders — 구매자 주문 생성 */
  async create(req, res) {
    const input = createOrderSchema.parse(req.body);
    res.status(201).json({ order: await orderService.create(req.user, input) });
  },

  /** GET /api/orders?as=buyer|seller&status=... */
  async list(req, res) {
    const query = listOrderQuerySchema.parse(req.query);
    res.json(await orderService.list(req.user, query));
  },

  /** GET /api/orders/:id */
  async detail(req, res) {
    const id = orderIdSchema.parse(req.params.id);
    res.json({ order: await orderService.getAccessible(req.user, id) });
  },

  /** PATCH /api/orders/:id/status — 접수/배송시작/완료/취소 */
  async updateStatus(req, res) {
    const id = orderIdSchema.parse(req.params.id);
    const input = updateStatusSchema.parse(req.body);
    res.json({ order: await orderService.changeStatus(req.user, id, input) });
  },

  /** PATCH /api/orders/:id/confirm-payment — 판매자 입금 확인 */
  async confirmPayment(req, res) {
    const id = orderIdSchema.parse(req.params.id);
    res.json({ order: await orderService.confirmPayment(req.user, id) });
  },
};
