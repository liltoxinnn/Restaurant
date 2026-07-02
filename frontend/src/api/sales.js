import api from './axios';

export const getSales = (params) => api.get('/sales', { params }).then((res) => res.data);
export const getSale = (id) => api.get(`/sales/${id}`).then((res) => res.data);
export const createSale = (data) => api.post('/sales', data).then((res) => res.data);
export const updatePaymentStatus = (id, isPaid) =>
  api.patch(`/sales/${id}/payment-status`, { isPaid }).then((res) => res.data);
export const deleteSale = (id) => api.delete(`/sales/${id}`).then((res) => res.data);
