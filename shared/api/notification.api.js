import { get, post } from './client.js';

export const listNotifications = () => get('/notifications');
export const readNotifications = () => post('/notifications/read');
