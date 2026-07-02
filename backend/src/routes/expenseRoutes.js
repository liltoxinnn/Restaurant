const express = require('express');
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createExpenseSchema, updateExpenseSchema } = require('../validations/expenseValidation');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER'));

router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.post('/', validate(createExpenseSchema), createExpense);
router.put('/:id', validate(updateExpenseSchema), updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
