const { z } = require('zod');

const createStockItemSchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.coerce.number().nonnegative().optional(),
  unit: z.string().min(1, 'Unit is required'),
  buyingPrice: z.coerce.number().nonnegative().optional(),
  minimumQuantity: z.coerce.number().nonnegative().optional(),
  expirationDate: z.coerce.date().optional().nullable(),
  supplierId: z.coerce.number().int().positive().optional().nullable(),
});

const updateStockItemSchema = createStockItemSchema.partial();

module.exports = { createStockItemSchema, updateStockItemSchema };
