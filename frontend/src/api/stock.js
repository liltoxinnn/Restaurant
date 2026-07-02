import api from './axios';

export const getStockItems = (params) => api.get('/stock', { params }).then((res) => res.data);
export const getLowStockItems = () => api.get('/stock/low-stock').then((res) => res.data);
export const getStockItem = (id) => api.get(`/stock/${id}`).then((res) => res.data);
export const createStockItem = (data) => api.post('/stock', data).then((res) => res.data);
export const updateStockItem = (id, data) => api.put(`/stock/${id}`, data).then((res) => res.data);
export const deleteStockItem = (id) => api.delete(`/stock/${id}`).then((res) => res.data);
