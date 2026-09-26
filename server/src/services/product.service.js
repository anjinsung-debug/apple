import { productModel } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';

/** 판매자 본인 상품인지 확인 */
async function findOwnProduct(sellerId, id, { withItems = false } = {}) {
  const product = withItems
    ? await productModel.findByIdWithItems(id)
    : await productModel.findById(id);

  if (!product || product.sellerId !== sellerId) throw ApiError.notFound('상품을 찾을 수 없습니다.');
  return product;
}

export const productService = {
  listActive() {
    return productModel.listActive();
  },

  listMine(sellerId) {
    return productModel.listBySeller(sellerId);
  },

  create(sellerId, input) {
    return productModel.create({ ...input, sellerId });
  },

  async update(sellerId, id, input) {
    await findOwnProduct(sellerId, id);
    return productModel.update(id, input);
  },

  /** 주문 이력이 있는 상품은 삭제 대신 판매 중지 처리 */
  async remove(sellerId, id) {
    const product = await findOwnProduct(sellerId, id, { withItems: true });

    if (product.items.length > 0) {
      const deactivated = await productModel.update(id, { isActive: false });
      return { product: deactivated, deactivatedInstead: true };
    }

    await productModel.deleteById(id);
    return { ok: true };
  },
};
