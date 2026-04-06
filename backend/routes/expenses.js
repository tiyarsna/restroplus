const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createExpense, getExpenses } = require('../controllers/operationsController');
router.use(protect);
router.get('/', getExpenses);
router.post('/', createExpense);
module.exports = router;
