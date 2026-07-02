import api from './axios';

export const getMenuItems = (params) => api.get('/menu', { params }).then((res) => res.data);
export const getMenuItem = (id) => api.get(`/menu/${id}`).then((res) => res.data);
export const createMenuItem = (data) => api.post('/menu', data).then((res) => res.data);
export const updateMenuItem = (id, data) => api.put(`/menu/${id}`, data).then((res) => res.data);
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`).then((res) => res.data);
export const addIngredient = (menuItemId, data) =>
  api.post(`/menu/${menuItemId}/ingredients`, data).then((res) => res.data);
export const updateIngredient = (menuItemId, ingredientId, data) =>
  api.put(`/menu/${menuItemId}/ingredients/${ingredientId}`, data).then((res) => res.data);
export const deleteIngredient = (menuItemId, ingredientId) =>
  api.delete(`/menu/${menuItemId}/ingredients/${ingredientId}`).then((res) => res.data);
