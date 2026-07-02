import api from './axios';

export const getPurchases = (params) => api.get('/purchases', { params }).then((res) => res.data);
export const getPurchase = (id) => api.get(`/purchases/${id}`).then((res) => res.data);
export const createPurchase = (data) => api.post('/purchases', data).then((res) => res.data);
export const updatePurchase = (id, data) => api.put(`/purchases/${id}`, data).then((res) => res.data);
export const deletePurchase = (id) => api.delete(`/purchases/${id}`).then((res) => res.data);
