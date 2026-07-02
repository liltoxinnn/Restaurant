const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private/Admin,Manager
const getEmployees = asyncHandler(async (req, res) => {
  const { search, status } = req.query;

  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { position: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return success(res, { message: 'Employees fetched successfully', data: employees });
});

// @desc    Get a single employee
// @route   GET /api/employees/:id
// @access  Private/Admin,Manager
const getEmployeeById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { payments: { orderBy: { paymentDate: 'desc' } } },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  return success(res, { message: 'Employee fetched successfully', data: employee });
});

// @desc    Create an employee
// @route   POST /api/employees
// @access  Private/Admin,Manager
const createEmployee = asyncHandler(async (req, res) => {
  const employee = await prisma.employee.create({ data: req.body });

  return success(res, {
    message: 'Employee created successfully',
    data: employee,
    statusCode: 201,
  });
});

// @desc    Update an employee
// @route   PUT /api/employees/:id
// @access  Private/Admin,Manager
const updateEmployee = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Employee not found', 404);
  }

  const employee = await prisma.employee.update({ where: { id }, data: req.body });

  return success(res, { message: 'Employee updated successfully', data: employee });
});

// @desc    Delete an employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin,Manager
const deleteEmployee = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Employee not found', 404);
  }

  await prisma.employee.delete({ where: { id } });

  return success(res, { message: 'Employee deleted successfully', data: null });
});

// @desc    Get all payments for a specific employee
// @route   GET /api/employees/:id/payments
// @access  Private/Admin,Manager
const getEmployeePayments = asyncHandler(async (req, res) => {
  const employeeId = Number(req.params.id);

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const payments = await prisma.employeePayment.findMany({
    where: { employeeId },
    orderBy: { paymentDate: 'desc' },
  });

  return success(res, {
    message: 'Employee payments fetched successfully',
    data: payments,
  });
});

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeePayments,
};
