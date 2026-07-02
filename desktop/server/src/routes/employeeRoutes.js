const express = require('express');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeePayments,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
} = require('../validations/employeeValidation');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER'));

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.get('/:id/payments', getEmployeePayments);
router.post('/', validate(createEmployeeSchema), createEmployee);
router.put('/:id', validate(updateEmployeeSchema), updateEmployee);
router.delete('/:id', deleteEmployee);

module.exports = router;
