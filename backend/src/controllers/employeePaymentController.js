const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');

// @desc    Get all employee payments
// @route   GET /api/employee-payments
// @access  Private/Admin,Manager
const getEmployeePayments = asyncHandler(async (req, res) => {
  const { employeeId, month, paymentType } = req.query;

  const where = {};
  if (employeeId) where.employeeId = Number(employeeId);
  if (month) where.month = month;
  if (paymentType) where.paymentType = paymentType;

  const payments = await prisma.employeePayment.findMany({
    where,
    include: { employee: { select: { id: true, fullName: true, position: true } } },
    orderBy: { paymentDate: 'desc' },
  });

  return success(res, {
    message: 'Employee payments fetched successfully',
    data: payments,
  });
});

// @desc    Get a single employee payment
// @route   GET /api/employee-payments/:id
// @access  Private/Admin,Manager
const getEmployeePaymentById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const payment = await prisma.employeePayment.findUnique({
    where: { id },
    include: { employee: { select: { id: true, fullName: true, position: true } } },
  });

  if (!payment) {
    throw new AppError('Employee payment not found', 404);
  }

  return success(res, { message: 'Employee payment fetched successfully', data: payment });
});

// @desc    Create an employee payment
// @route   POST /api/employee-payments
// @access  Private/Admin,Manager
const createEmployeePayment = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const payment = await prisma.employeePayment.create({
    data: req.body,
    include: { employee: { select: { id: true, fullName: true, position: true } } },
  });

  return success(res, {
    message: 'Employee payment created successfully',
    data: payment,
    statusCode: 201,
  });
});

// @desc    Update an employee payment
// @route   PUT /api/employee-payments/:id
// @access  Private/Admin,Manager
const updateEmployeePayment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.employeePayment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Employee payment not found', 404);
  }

  if (req.body.employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: req.body.employeeId } });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }
  }

  const payment = await prisma.employeePayment.update({
    where: { id },
    data: req.body,
    include: { employee: { select: { id: true, fullName: true, position: true } } },
  });

  return success(res, { message: 'Employee payment updated successfully', data: payment });
});

// @desc    Delete an employee payment
// @route   DELETE /api/employee-payments/:id
// @access  Private/Admin,Manager
const deleteEmployeePayment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.employeePayment.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Employee payment not found', 404);
  }

  await prisma.employeePayment.delete({ where: { id } });

  return success(res, { message: 'Employee payment deleted successfully', data: null });
});

module.exports = {
  getEmployeePayments,
  getEmployeePaymentById,
  createEmployeePayment,
  updateEmployeePayment,
  deleteEmployeePayment,
};
