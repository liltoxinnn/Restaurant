const { z } = require('zod');

const createMenuItemSchema = z.object({
  name: z.string().min(2, 'Menu item name is required'),
  category: z.string().min(1, 'Category is required'),
  sellingPrice: z.coerce.number().nonnegative('Selling price must be a positive number'),
  costPrice: z.coerce.number().nonnegative().optional(),
  description: z.string().optional().nullable(),
  isAvailable: z.coerce.boolean().optional(),
});

const updateMenuItemSchema = createMenuItemSchema.partial();

const addIngredientSchema = z.object({
  stockItemId: z.coerce.number().int().positive('stockItemId is required'),
  quantityUsed: z.coerce.number().positive('quantityUsed must be greater than 0'),
  unit: z.string().min(1, 'Unit is required'),
});

const updateIngredientSchema = addIngredientSchema.partial();

module.exports = {
  createMenuItemSchema,
  updateMenuItemSchema,
  addIngredientSchema,
  updateIngredientSchema,
};
