const express = require('express');
const {
  getStockItems,
  getLowStockItems,
  getStockItemById,
  createStockItem,
  updateStockItem,
  deleteStockItem,
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createStockItemSchema, updateStockItemSchema } = require('../validations/stockValidation');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER', 'CASHIER'));

router.get('/', getStockItems);
router.get('/low-stock', getLowStockItems);
router.get('/:id', getStockItemById);
router.post('/', authorize('ADMIN', 'MANAGER'), validate(createStockItemSchema), createStockItem);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateStockItemSchema), updateStockItem);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteStockItem);

module.exports = router;
