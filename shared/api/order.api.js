import { get, patch, post } from './client.js';

export const createOrder = (payload) => post('/orders', payload);

/** params: { as: 'buyer' | 'seller', status } */
export const listOrders = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/orders${qs ? `?${qs}` : ''}`);
};

export const getOrder = (id) => get(`/orders/${id}`);

export const updateOrderStatus = (id, status, memo) =>
  patch(`/orders/${id}/status`, { status, memo });

export const confirmOrderPayment = (id) => patch(`/orders/${id}/confirm-payment`);
