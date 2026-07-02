const express = require('express');
const {
  getDashboard,
  getDailySalesReport,
  getMonthlySalesReport,
  getMonthlyExpensesReport,
  getMonthlyProfitReport,
  getStockReport,
  getEmployeePaymentsReport,
  getTopSellingItemsReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER'));

router.get('/dashboard', getDashboard);
router.get('/sales/daily', getDailySalesReport);
router.get('/sales/monthly', getMonthlySalesReport);
router.get('/expenses/monthly', getMonthlyExpensesReport);
router.get('/profit/monthly', getMonthlyProfitReport);
router.get('/stock', getStockReport);
router.get('/employees/payments', getEmployeePaymentsReport);
router.get('/top-selling-items', getTopSellingItemsReport);

module.exports = router;
