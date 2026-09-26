import { addressService } from '../services/address.service.js';
import { addressIdSchema, createAddressSchema } from '../validators/address.validator.js';

export const addressController = {
  /** GET /api/addresses — 내 배송지 목록 */
  async list(req, res) {
    res.json({ addresses: await addressService.list(req.user.id) });
  },

  /** POST /api/addresses — 우편번호 검색 결과 저장 + 지오코딩 */
  async create(req, res) {
    const input = createAddressSchema.parse(req.body);
    res.status(201).json({ address: await addressService.create(req.user.id, input) });
  },

  /** DELETE /api/addresses/:id */
  async remove(req, res) {
    const id = addressIdSchema.parse(req.params.id);
    res.json(await addressService.remove(req.user.id, id));
  },
};
