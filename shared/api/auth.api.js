import { get, patch, post } from './client.js';

export const kakaoLogin = (payload) => post('/auth/kakao', payload, { auth: false });
export const devLogin = (payload) => post('/auth/dev-login', payload, { auth: false });
export const fetchMe = () => get('/auth/me');
export const registerDeviceToken = (token) => post('/auth/device-token', { token });
export const updateBank = (payload) => patch('/auth/me/bank', payload);
