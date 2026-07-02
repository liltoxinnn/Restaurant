const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');
const clampSearch = require('../utils/clampSearch');

// @desc    Get all stock items
// @route   GET /api/stock
// @access  Private/Admin,Manager,Cashier
const getStockItems = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const search = clampSearch(req.query.search);

  const where = {};
  if (category) where.category = category;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const stockItems = await prisma.stockItem.findMany({
    where,
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  });

  return success(res, { message: 'Stock items fetched successfully', data: stockItems });
});

// @desc    Get stock items at or below minimum quantity
// @route   GET /api/stock/low-stock
// @access  Private/Admin,Manager,Cashier
const getLowStockItems = asyncHandler(async (req, res) => {
  const stockItems = await prisma.stockItem.findMany({
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { quantity: 'asc' },
  });

  const lowStock = stockItems.filter((item) => item.quantity <= item.minimumQuantity);

  return success(res, {
    message: 'Low stock items fetched successfully',
    data: lowStock,
  });
});

// @desc    Get a single stock item
// @route   GET /api/stock/:id
// @access  Private/Admin,Manager,Cashier
const getStockItemById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const stockItem = await prisma.stockItem.findUnique({
    where: { id },
    include: { supplier: true },
  });

  if (!stockItem) {
    throw new AppError('Stock item not found', 404);
  }

  return success(res, { message: 'Stock item fetched successfully', data: stockItem });
});

// @desc    Create a stock item
// @route   POST /api/stock
// @access  Private/Admin,Manager
const createStockItem = asyncHandler(async (req, res) => {
  const { name, category, quantity, unit, buyingPrice, minimumQuantity, expirationDate, supplierId } =
    req.body;

  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
  }

  const stockItem = await prisma.stockItem.create({
    data: { name, category, quantity, unit, buyingPrice, minimumQuantity, expirationDate, supplierId },
    include: { supplier: { select: { id: true, name: true } } },
  });

  return success(res, {
    message: 'Stock item created successfully',
    data: stockItem,
    statusCode: 201,
  });
});

// @desc    Update a stock item
// @route   PUT /api/stock/:id
// @access  Private/Admin,Manager
const updateStockItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { name, category, quantity, unit, buyingPrice, minimumQuantity, expirationDate, supplierId } =
    req.body;

  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Stock item not found', 404);
  }

  if (supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
  }

  const stockItem = await prisma.stockItem.update({
    where: { id },
    data: { name, category, quantity, unit, buyingPrice, minimumQuantity, expirationDate, supplierId },
    include: { supplier: { select: { id: true, name: true } } },
  });

  return success(res, { message: 'Stock item updated successfully', data: stockItem });
});

// @desc    Delete a stock item
// @route   DELETE /api/stock/:id
// @access  Private/Admin,Manager
const deleteStockItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.stockItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Stock item not found', 404);
  }

  await prisma.stockItem.delete({ where: { id } });

  return success(res, { message: 'Stock item deleted successfully', data: null });
});

module.exports = {
  getStockItems,
  getLowStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
};
