const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const employeeRoutes = require('./employeeRoutes');
const employeePaymentRoutes = require('./employeePaymentRoutes');
const supplierRoutes = require('./supplierRoutes');
const stockRoutes = require('./stockRoutes');
const purchaseRoutes = require('./purchaseRoutes');
const menuRoutes = require('./menuRoutes');
const saleRoutes = require('./saleRoutes');
const expenseRoutes = require('./expenseRoutes');
const reportRoutes = require('./reportRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Restaurant Management System API',
    data: { version: '1.0.0' },
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/employees', employeeRoutes);
router.use('/employee-payments', employeePaymentRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/stock', stockRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/menu', menuRoutes);
router.use('/sales', saleRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
