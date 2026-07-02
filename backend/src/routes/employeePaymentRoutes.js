const express = require('express');
const {
  getEmployeePayments,
  getEmployeePaymentById,
  createEmployeePayment,
  updateEmployeePayment,
  deleteEmployeePayment,
} = require('../controllers/employeePaymentController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createEmployeePaymentSchema,
  updateEmployeePaymentSchema,
} = require('../validations/employeePaymentValidation');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER'));

router.get('/', getEmployeePayments);
router.get('/:id', getEmployeePaymentById);
router.post('/', validate(createEmployeePaymentSchema), createEmployeePayment);
router.put('/:id', validate(updateEmployeePaymentSchema), updateEmployeePayment);
router.delete('/:id', deleteEmployeePayment);

module.exports = router;
