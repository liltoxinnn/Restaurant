const { z } = require('zod');

const purchaseItemSchema = z.object({
  stockItemId: z.coerce.number().int().positive('stockItemId is required'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().nonnegative('Unit price must be a positive number'),
});

const createPurchaseSchema = z.object({
  supplierId: z.coerce.number().int().positive('supplierId is required'),
  paymentStatus: z.enum(['PAID', 'UNPAID', 'PARTIAL']).optional(),
  purchaseDate: z.coerce.date().optional(),
  items: z.array(purchaseItemSchema).min(1, 'At least one purchase item is required'),
});

const updatePurchaseSchema = z.object({
  supplierId: z.coerce.number().int().positive().optional(),
  paymentStatus: z.enum(['PAID', 'UNPAID', 'PARTIAL']).optional(),
  purchaseDate: z.coerce.date().optional(),
});

module.exports = { createPurchaseSchema, updatePurchaseSchema };
