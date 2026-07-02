const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');
const parseDateOrUndefined = require('../utils/parseDate');

const expenseInclude = {
  creator: { select: { id: true, username: true } },
};

// @desc    Get all expenses
// @route   GET /api/expenses
// @access  Private/Admin,Manager
const getExpenses = asyncHandler(async (req, res) => {
  const { category, month, from, to } = req.query;

  const where = {};
  if (category) where.category = category;
  const gte = parseDateOrUndefined(from);
  const lte = parseDateOrUndefined(to);
  if (gte || lte) {
    where.expenseDate = {};
    if (gte) where.expenseDate.gte = gte;
    if (lte) where.expenseDate.lte = lte;
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, monthNum] = month.split('-').map(Number);
    if (monthNum >= 1 && monthNum <= 12) {
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 1);
      where.expenseDate = { gte: start, lt: end };
    }
  }

  const expenses = await prisma.expense.findMany({
    where,
    include: expenseInclude,
    orderBy: { expenseDate: 'desc' },
  });

  return success(res, { message: 'Expenses fetched successfully', data: expenses });
});

// @desc    Get a single expense
// @route   GET /api/expenses/:id
// @access  Private/Admin,Manager
const getExpenseById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const expense = await prisma.expense.findUnique({ where: { id }, include: expenseInclude });

  if (!expense) {
    throw new AppError('Expense not found', 404);
  }

  return success(res, { message: 'Expense fetched successfully', data: expense });
});

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private/Admin,Manager
const createExpense = asyncHandler(async (req, res) => {
  const { name, category, amount, paymentMethod, expenseDate, description } = req.body;
  const expense = await prisma.expense.create({
    data: {
      name,
      category,
      amount,
      paymentMethod,
      expenseDate,
      description,
      createdBy: req.user.id,
    },
    include: expenseInclude,
  });

  return success(res, {
    message: 'Expense created successfully',
    data: expense,
    statusCode: 201,
  });
});

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private/Admin,Manager
const updateExpense = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name, category, amount, paymentMethod, expenseDate, description } = req.body;

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Expense not found', 404);
  }

  const expense = await prisma.expense.update({
    where: { id },
    data: { name, category, amount, paymentMethod, expenseDate, description },
    include: expenseInclude,
  });

  return success(res, { message: 'Expense updated successfully', data: expense });
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin,Manager
const deleteExpense = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Expense not found', 404);
  }

  await prisma.expense.delete({ where: { id } });

  return success(res, { message: 'Expense deleted successfully', data: null });
});

module.exports = { getExpenses, getExpenseById, createExpense, updateExpense, deleteExpense };
