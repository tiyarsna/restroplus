const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { createBill, getBills, deleteBill } = require('../controllers/operationsController');

router.use(protect);
router.get('/', getBills);
router.post('/', createBill);
router.delete('/:id', deleteBill);

module.exports = router;
