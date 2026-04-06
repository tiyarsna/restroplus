// routes/waste.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createWasteLog, getWasteLogs } = require('../controllers/operationsController');
router.use(protect);
router.get('/', getWasteLogs);
router.post('/', createWasteLog);
module.exports = router;
