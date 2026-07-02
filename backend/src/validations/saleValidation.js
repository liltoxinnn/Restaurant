const { z } = require('zod');

const saleItemSchema = z.object({
  menuItemId: z.coerce.number().int().positive('menuItemId is required'),
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
});

const createSaleSchema = z.object({
  discount: z.coerce.number().nonnegative().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'MOBILE', 'ONLINE']).optional(),
  saleDate: z.coerce.date().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one sale item is required'),
});

module.exports = { createSaleSchema };
