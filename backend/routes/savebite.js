const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createLeftoverSale, getActiveLeftoverSales, getAllLeftoverSales } = require('../controllers/operationsController');

router.get('/all', getAllLeftoverSales); // public - for customer module
router.use(protect);
router.get('/', getActiveLeftoverSales);
router.post('/', authorize('RestaurantAdmin', 'Manager'), createLeftoverSale);

module.exports = router;
