import { productService } from '../services/product.service.js';
import {
  createProductSchema,
  productIdSchema,
  updateProductSchema,
} from '../validators/product.validator.js';

export const productController = {
  /** GET /api/products — 판매 중 상품 (공개) */
  async listActive(_req, res) {
    res.json({ products: await productService.listActive() });
  },

  /** GET /api/products/mine — 판매자 자신의 품목 */
  async listMine(req, res) {
    res.json({ products: await productService.listMine(req.user.id) });
  },

  /** POST /api/products — 판매 품목 등록 */
  async create(req, res) {
    const input = createProductSchema.parse(req.body);
    res.status(201).json({ product: await productService.create(req.user.id, input) });
  },

  /** PATCH /api/products/:id — 가격/재고/판매여부 수정 */
  async update(req, res) {
    const id = productIdSchema.parse(req.params.id);
    const input = updateProductSchema.parse(req.body);
    res.json({ product: await productService.update(req.user.id, id, input) });
  },

  /** DELETE /api/products/:id — 주문 이력이 있으면 판매 중지로 대체 */
  async remove(req, res) {
    const id = productIdSchema.parse(req.params.id);
    res.json(await productService.remove(req.user.id, id));
  },
};
