const prisma = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { success, AppError } = require('../utils/apiResponse');

const menuItemInclude = {
  ingredients: {
    include: {
      stockItem: { select: { id: true, name: true, unit: true, quantity: true } },
    },
  },
};

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Private
const getMenuItems = asyncHandler(async (req, res) => {
  const { search, category, isAvailable } = req.query;

  const where = {};
  if (category) where.category = category;
  if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const menuItems = await prisma.menuItem.findMany({
    where,
    include: menuItemInclude,
    orderBy: { name: 'asc' },
  });

  return success(res, { message: 'Menu items fetched successfully', data: menuItems });
});

// @desc    Get a single menu item
// @route   GET /api/menu/:id
// @access  Private
const getMenuItemById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const menuItem = await prisma.menuItem.findUnique({
    where: { id },
    include: menuItemInclude,
  });

  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  return success(res, { message: 'Menu item fetched successfully', data: menuItem });
});

// @desc    Create a menu item
// @route   POST /api/menu
// @access  Private/Admin,Manager
const createMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await prisma.menuItem.create({
    data: req.body,
    include: menuItemInclude,
  });

  return success(res, {
    message: 'Menu item created successfully',
    data: menuItem,
    statusCode: 201,
  });
});

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin,Manager
const updateMenuItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Menu item not found', 404);
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: req.body,
    include: menuItemInclude,
  });

  return success(res, { message: 'Menu item updated successfully', data: menuItem });
});

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin,Manager
const deleteMenuItem = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);

  const existing = await prisma.menuItem.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Menu item not found', 404);
  }

  await prisma.menuItem.delete({ where: { id } });

  return success(res, { message: 'Menu item deleted successfully', data: null });
});

// @desc    Add an ingredient to a menu item
// @route   POST /api/menu/:id/ingredients
// @access  Private/Admin,Manager
const addIngredient = asyncHandler(async (req, res) => {
  const menuItemId = Number(req.params.id);
  const { stockItemId, quantityUsed, unit } = req.body;

  const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
  if (!menuItem) {
    throw new AppError('Menu item not found', 404);
  }

  const stockItem = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
  if (!stockItem) {
    throw new AppError('Stock item not found', 404);
  }

  const existingIngredient = await prisma.menuItemIngredient.findUnique({
    where: { menuItemId_stockItemId: { menuItemId, stockItemId } },
  });
  if (existingIngredient) {
    throw new AppError('This ingredient is already linked to the menu item', 409);
  }

  const ingredient = await prisma.menuItemIngredient.create({
    data: { menuItemId, stockItemId, quantityUsed, unit },
    include: { stockItem: { select: { id: true, name: true, unit: true } } },
  });

  return success(res, {
    message: 'Ingredient added to menu item successfully',
    data: ingredient,
    statusCode: 201,
  });
});

// @desc    Update a menu item ingredient
// @route   PUT /api/menu/:id/ingredients/:ingredientId
// @access  Private/Admin,Manager
const updateIngredient = asyncHandler(async (req, res) => {
  const menuItemId = Number(req.params.id);
  const ingredientId = Number(req.params.ingredientId);

  const existing = await prisma.menuItemIngredient.findFirst({
    where: { id: ingredientId, menuItemId },
  });
  if (!existing) {
    throw new AppError('Ingredient not found for this menu item', 404);
  }

  if (req.body.stockItemId) {
    const stockItem = await prisma.stockItem.findUnique({ where: { id: req.body.stockItemId } });
    if (!stockItem) {
      throw new AppError('Stock item not found', 404);
    }
  }

  const ingredient = await prisma.menuItemIngredient.update({
    where: { id: ingredientId },
    data: req.body,
    include: { stockItem: { select: { id: true, name: true, unit: true } } },
  });

  return success(res, { message: 'Ingredient updated successfully', data: ingredient });
});

// @desc    Remove an ingredient from a menu item
// @route   DELETE /api/menu/:id/ingredients/:ingredientId
// @access  Private/Admin,Manager
const deleteIngredient = asyncHandler(async (req, res) => {
  const menuItemId = Number(req.params.id);
  const ingredientId = Number(req.params.ingredientId);

  const existing = await prisma.menuItemIngredient.findFirst({
    where: { id: ingredientId, menuItemId },
  });
  if (!existing) {
    throw new AppError('Ingredient not found for this menu item', 404);
  }

  await prisma.menuItemIngredient.delete({ where: { id: ingredientId } });

  return success(res, { message: 'Ingredient removed successfully', data: null });
});

module.exports = {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addIngredient,
  updateIngredient,
  deleteIngredient,
};
