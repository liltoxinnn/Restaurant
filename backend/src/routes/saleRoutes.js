const express = require('express');
const {
  getSales,
  getSaleById,
  createSale,
  updatePaymentStatus,
  deleteSale,
} = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createSaleSchema, updatePaymentStatusSchema } = require('../validations/saleValidation');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER', 'CASHIER'));

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', validate(createSaleSchema), createSale);
router.patch('/:id/payment-status', validate(updatePaymentStatusSchema), updatePaymentStatus);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteSale);

module.exports = router;
