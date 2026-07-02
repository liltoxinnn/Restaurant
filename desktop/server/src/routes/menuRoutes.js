const express = require('express');
const {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addIngredient,
  updateIngredient,
  deleteIngredient,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createMenuItemSchema,
  updateMenuItemSchema,
  addIngredientSchema,
  updateIngredientSchema,
} = require('../validations/menuValidation');

const router = express.Router();

router.use(protect);

router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);

router.post('/', authorize('ADMIN', 'MANAGER'), validate(createMenuItemSchema), createMenuItem);
router.put('/:id', authorize('ADMIN', 'MANAGER'), validate(updateMenuItemSchema), updateMenuItem);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteMenuItem);

router.post(
  '/:id/ingredients',
  authorize('ADMIN', 'MANAGER'),
  validate(addIngredientSchema),
  addIngredient
);
router.put(
  '/:id/ingredients/:ingredientId',
  authorize('ADMIN', 'MANAGER'),
  validate(updateIngredientSchema),
  updateIngredient
);
router.delete(
  '/:id/ingredients/:ingredientId',
  authorize('ADMIN', 'MANAGER'),
  deleteIngredient
);

module.exports = router;
