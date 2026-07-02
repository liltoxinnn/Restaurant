const express = require('express');
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createPurchaseSchema,
  updatePurchaseSchema,
} = require('../validations/purchaseValidation');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER'));

router.get('/', getPurchases);
router.get('/:id', getPurchaseById);
router.post('/', validate(createPurchaseSchema), createPurchase);
router.put('/:id', validate(updatePurchaseSchema), updatePurchase);
router.delete('/:id', deletePurchase);

module.exports = router;
