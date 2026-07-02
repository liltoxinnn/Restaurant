const express = require('express');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createSupplierSchema,
  updateSupplierSchema,
} = require('../validations/supplierValidation');

const router = express.Router();

router.use(protect, authorize('ADMIN', 'MANAGER'));

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', validate(createSupplierSchema), createSupplier);
router.put('/:id', validate(updateSupplierSchema), updateSupplier);
router.delete('/:id', deleteSupplier);

module.exports = router;
