const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/operationsController');

router.use(protect);

router.get('/', getExpenses);
router.post('/', createExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
