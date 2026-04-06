const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMenuItems, createMenuItem, updateMenuItem,
  deleteMenuItem, toggleAvailability, getCategories
} = require('../controllers/menuController');

router.use(protect);
router.get('/', getMenuItems);
router.get('/categories', getCategories);
router.post('/', authorize('RestaurantAdmin', 'Manager'), createMenuItem);
router.put('/:id', authorize('RestaurantAdmin', 'Manager'), updateMenuItem);
router.delete('/:id', authorize('RestaurantAdmin'), deleteMenuItem);
router.patch('/:id/toggle', authorize('RestaurantAdmin', 'Manager'), toggleAvailability);

module.exports = router;
