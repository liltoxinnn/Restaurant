const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');

const purchaseInclude = {
  supplier: { select: { id: true, name: true, phone: true, email: true } },
  items: {
    include: {
      stockItem: { select: { id: true, name: true, unit: true } },
    },
  },
};

// @desc    Get all purchases
// @route   GET /api/purchases
// @access  Private/Admin,Manager
const getPurchases = asyncHandler(async (req, res) => {
  const { supplierId, paymentStatus } = req.query;

  const where = {};
  if (supplierId) where.supplierId = Number(supplierId);
  if (paymentStatus) where.paymentStatus = paymentStatus;

  const purchases = await prisma.purchase.findMany({
    where,
    include: purchaseInclude,
    orderBy: { purchaseDate: 'desc' },
  });

  return success(res, { message: 'Purchases fetched successfully', data: purchases });
});

// @desc    Get a single purchase
// @route   GET /api/purchases/:id
// @access  Private/Admin,Manager
const getPurchaseById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: purchaseInclude,
  });

  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }

  return success(res, { message: 'Purchase fetched successfully', data: purchase });
});

// @desc    Create a purchase (increases stock quantity for every item)
// @route   POST /api/purchases
// @access  Private/Admin,Manager
const createPurchase = asyncHandler(async (req, res) => {
  const { supplierId, paymentStatus, purchaseDate, items } = req.body;

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  const stockItemIds = items.map((item) => item.stockItemId);
  const stockItems = await prisma.stockItem.findMany({
    where: { id: { in: stockItemIds } },
  });

  for (const item of items) {
    const stockItem = stockItems.find((s) => s.id === item.stockItemId);
    if (!stockItem) {
      throw new AppError(`Stock item with id ${item.stockItemId} not found`, 404);
    }
  }

  const itemsWithTotals = items.map((item) => ({
    ...item,
    totalPrice: Number((item.quantity * item.unitPrice).toFixed(2)),
  }));

  const totalAmount = Number(
    itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2)
  );

  const purchase = await prisma.$transaction(async (tx) => {
    const createdPurchase = await tx.purchase.create({
      data: {
        supplierId,
        totalAmount,
        paymentStatus: paymentStatus || 'UNPAID',
        purchaseDate: purchaseDate || new Date(),
        items: {
          create: itemsWithTotals.map((item) => ({
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: purchaseInclude,
    });

    // Increase stock quantity for every purchased item.
    for (const item of itemsWithTotals) {
      await tx.stockItem.update({
        where: { id: item.stockItemId },
        data: {
          quantity: { increment: item.quantity },
          buyingPrice: item.unitPrice,
        },
      });
    }

    return createdPurchase;
  });

  return success(res, {
    message: 'Purchase created successfully and stock updated',
    data: purchase,
    statusCode: 201,
  });
});

// @desc    Update a purchase (metadata only - supplier, payment status, date)
// @route   PUT /api/purchases/:id
// @access  Private/Admin,Manager
const updatePurchase = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.purchase.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Purchase not found', 404);
  }

  if (req.body.supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: req.body.supplierId } });
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
  }

  const purchase = await prisma.purchase.update({
    where: { id },
    data: req.body,
    include: purchaseInclude,
  });

  return success(res, { message: 'Purchase updated successfully', data: purchase });
});

// @desc    Delete a purchase (reverts the stock increment)
// @route   DELETE /api/purchases/:id
// @access  Private/Admin,Manager
const deletePurchase = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.purchase.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!existing) {
    throw new AppError('Purchase not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      await tx.stockItem.update({
        where: { id: item.stockItemId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    await tx.purchase.delete({ where: { id } });
  });

  return success(res, {
    message: 'Purchase deleted successfully and stock reverted',
    data: null,
  });
});

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
};
