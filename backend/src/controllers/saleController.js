const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');
const parseDateOrUndefined = require('../utils/parseDate');

const saleInclude = {
  user: { select: { id: true, username: true, email: true } },
  items: {
    include: {
      menuItem: { select: { id: true, name: true, category: true } },
    },
  },
};

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private
const getSales = asyncHandler(async (req, res) => {
  const { paymentMethod, from, to, isPaid } = req.query;

  const where = {};
  if (paymentMethod) where.paymentMethod = paymentMethod;
  if (isPaid !== undefined) where.isPaid = isPaid === 'true';
  const gte = parseDateOrUndefined(from);
  const lte = parseDateOrUndefined(to);
  if (gte || lte) {
    where.saleDate = {};
    if (gte) where.saleDate.gte = gte;
    if (lte) where.saleDate.lte = lte;
  }

  const sales = await prisma.sale.findMany({
    where,
    include: saleInclude,
    orderBy: { saleDate: 'desc' },
  });

  return success(res, { message: 'Sales fetched successfully', data: sales });
});

// @desc    Get a single sale
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const sale = await prisma.sale.findUnique({ where: { id }, include: saleInclude });

  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  return success(res, { message: 'Sale fetched successfully', data: sale });
});

// @desc    Create a sale (validates & decrements ingredient stock)
// @route   POST /api/sales
// @access  Private/Admin,Manager,Cashier
const createSale = asyncHandler(async (req, res) => {
  const { discount, paymentMethod, saleDate, items } = req.body;

  const menuItemIds = [...new Set(items.map((item) => item.menuItemId))];

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    include: { ingredients: { include: { stockItem: true } } },
  });

  // 1. Validate that every requested menu item exists.
  for (const item of items) {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    if (!menuItem) {
      throw new AppError(`Menu item with id ${item.menuItemId} not found`, 404);
    }
    if (!menuItem.isAvailable) {
      throw new AppError(`Menu item "${menuItem.name}" is not currently available`, 400);
    }
  }

  // 2. Aggregate the total quantity required per stock ingredient across all sale items.
  const requiredStock = new Map(); // stockItemId -> { name, unit, required, available }

  for (const item of items) {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);

    for (const ingredient of menuItem.ingredients) {
      const needed = ingredient.quantityUsed * item.quantity;
      const key = ingredient.stockItemId;

      if (!requiredStock.has(key)) {
        requiredStock.set(key, {
          name: ingredient.stockItem.name,
          unit: ingredient.stockItem.unit,
          required: 0,
          available: ingredient.stockItem.quantity,
        });
      }
      requiredStock.get(key).required += needed;
    }
  }

  // 3. Check stock availability before saving anything.
  for (const [, info] of requiredStock) {
    if (info.required > info.available) {
      throw new AppError(
        `Insufficient stock for ingredient "${info.name}". Required: ${info.required} ${info.unit}, Available: ${info.available} ${info.unit}`,
        400
      );
    }
  }

  // 4. Build sale items with prices captured at time of sale.
  const saleItemsData = items.map((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    const unitPrice = menuItem.sellingPrice;
    const totalPrice = Number((unitPrice * item.quantity).toFixed(2));
    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      totalPrice,
    };
  });

  const subtotal = saleItemsData.reduce((sum, item) => sum + item.totalPrice, 0);
  const finalDiscount = discount || 0;
  const totalAmount = Number(Math.max(subtotal - finalDiscount, 0).toFixed(2));

  // 5. Persist the sale, sale items, and stock decrements inside one transaction.
  const sale = await prisma.$transaction(async (tx) => {
    const createdSale = await tx.sale.create({
      data: {
        userId: req.user.id,
        totalAmount,
        discount: finalDiscount,
        paymentMethod: paymentMethod || 'CASH',
        saleDate: saleDate || new Date(),
        items: { create: saleItemsData },
      },
      include: saleInclude,
    });

    for (const [stockItemId, info] of requiredStock) {
      await tx.stockItem.update({
        where: { id: stockItemId },
        data: { quantity: { decrement: info.required } },
      });
    }

    return createdSale;
  });

  return success(res, {
    message: 'Sale created successfully and stock updated',
    data: sale,
    statusCode: 201,
  });
});

// @desc    Mark an order as paid or unpaid
// @route   PATCH /api/sales/:id/payment-status
// @access  Private/Admin,Manager,Cashier
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { isPaid } = req.body;

  const existing = await prisma.sale.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Sale not found', 404);
  }

  const sale = await prisma.sale.update({
    where: { id },
    data: { isPaid },
    include: saleInclude,
  });

  return success(res, {
    message: `Order marked as ${isPaid ? 'paid' : 'unpaid'}`,
    data: sale,
  });
});

// @desc    Delete a sale (restocks the ingredients that were consumed)
// @route   DELETE /api/sales/:id
// @access  Private/Admin,Manager
const deleteSale = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { items: { include: { menuItem: { include: { ingredients: true } } } } },
  });

  if (!sale) {
    throw new AppError('Sale not found', 404);
  }

  await prisma.$transaction(async (tx) => {
    for (const saleItem of sale.items) {
      for (const ingredient of saleItem.menuItem.ingredients) {
        const restoreQty = ingredient.quantityUsed * saleItem.quantity;
        await tx.stockItem.update({
          where: { id: ingredient.stockItemId },
          data: { quantity: { increment: restoreQty } },
        });
      }
    }

    await tx.sale.delete({ where: { id } });
  });

  return success(res, {
    message: 'Sale deleted successfully and stock restored',
    data: null,
  });
});

module.exports = { getSales, getSaleById, createSale, updatePaymentStatus, deleteSale };
