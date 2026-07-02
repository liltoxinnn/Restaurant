import api from './axios';

export const getDashboard = () => api.get('/reports/dashboard').then((res) => res.data);
export const getDailySales = (params) =>
  api.get('/reports/sales/daily', { params }).then((res) => res.data);
export const getMonthlySales = (params) =>
  api.get('/reports/sales/monthly', { params }).then((res) => res.data);
export const getMonthlyExpenses = (params) =>
  api.get('/reports/expenses/monthly', { params }).then((res) => res.data);
export const getMonthlyProfit = (params) =>
  api.get('/reports/profit/monthly', { params }).then((res) => res.data);
export const getStockReport = () => api.get('/reports/stock').then((res) => res.data);
export const getEmployeePaymentsReport = (params) =>
  api.get('/reports/employees/payments', { params }).then((res) => res.data);
export const getTopSellingItems = (params) =>
  api.get('/reports/top-selling-items', { params }).then((res) => res.data);
