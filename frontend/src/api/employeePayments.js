import api from './axios';

export const getEmployeePayments = (params) =>
  api.get('/employee-payments', { params }).then((res) => res.data);
export const getEmployeePayment = (id) =>
  api.get(`/employee-payments/${id}`).then((res) => res.data);
export const createEmployeePayment = (data) =>
  api.post('/employee-payments', data).then((res) => res.data);
export const updateEmployeePayment = (id, data) =>
  api.put(`/employee-payments/${id}`, data).then((res) => res.data);
export const deleteEmployeePayment = (id) =>
  api.delete(`/employee-payments/${id}`).then((res) => res.data);
