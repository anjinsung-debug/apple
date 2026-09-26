import { del, get, post } from '@shared/api/client.js';

export const listAddresses = () => get('/addresses');
export const createAddress = (payload) => post('/addresses', payload);
export const deleteAddress = (id) => del(`/addresses/${id}`);
