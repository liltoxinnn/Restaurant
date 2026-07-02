const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');
const clampSearch = require('../utils/clampSearch');

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private/Admin,Manager
const getSuppliers = asyncHandler(async (req, res) => {
  const search = clampSearch(req.query.search);

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const suppliers = await prisma.supplier.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return success(res, { message: 'Suppliers fetched successfully', data: suppliers });
});

// @desc    Get a single supplier
// @route   GET /api/suppliers/:id
// @access  Private/Admin,Manager
const getSupplierById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      stockItems: true,
      purchases: { orderBy: { purchaseDate: 'desc' }, take: 20 },
    },
  });

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  return success(res, { message: 'Supplier fetched successfully', data: supplier });
});

// @desc    Create a supplier
// @route   POST /api/suppliers
// @access  Private/Admin,Manager
const createSupplier = asyncHandler(async (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  const supplier = await prisma.supplier.create({ data: { name, phone, email, address, notes } });

  return success(res, {
    message: 'Supplier created successfully',
    data: supplier,
    statusCode: 201,
  });
});

// @desc    Update a supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin,Manager
const updateSupplier = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name, phone, email, address, notes } = req.body;

  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Supplier not found', 404);
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: { name, phone, email, address, notes },
  });

  return success(res, { message: 'Supplier updated successfully', data: supplier });
});

// @desc    Delete a supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin,Manager
const deleteSupplier = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Supplier not found', 404);
  }

  const purchaseCount = await prisma.purchase.count({ where: { supplierId: id } });
  if (purchaseCount > 0) {
    throw new AppError(
      `Cannot delete "${existing.name}" because it has ${purchaseCount} purchase record(s). Delete those purchases first.`,
      409
    );
  }

  await prisma.supplier.delete({ where: { id } });

  return success(res, { message: 'Supplier deleted successfully', data: null });
});

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
