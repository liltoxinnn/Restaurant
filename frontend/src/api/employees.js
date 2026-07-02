import api from './axios';

export const getEmployees = (params) => api.get('/employees', { params }).then((res) => res.data);
export const getEmployee = (id) => api.get(`/employees/${id}`).then((res) => res.data);
export const createEmployee = (data) => api.post('/employees', data).then((res) => res.data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data).then((res) => res.data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`).then((res) => res.data);
export const getEmployeePayments = (id) => api.get(`/employees/${id}/payments`).then((res) => res.data);
