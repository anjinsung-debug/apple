import { del, get, patch, post } from './client.js';

/** 구매자용 목록은 로그인 없이도 볼 수 있다 */
export const listProducts = () => get('/products', { auth: false });

export const listMyProducts = () => get('/products/mine');
export const createProduct = (payload) => post('/products', payload);
export const updateProduct = (id, payload) => patch(`/products/${id}`, payload);
export const deleteProduct = (id) => del(`/products/${id}`);
