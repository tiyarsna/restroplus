// routes/tables.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Table } = require('../models/index');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const tables = await Table.find({ restaurantId: req.user.restaurantId })
      .populate('currentOrderId').sort({ tableNumber: 1 });
    res.json({ success: true, tables });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authorize('RestaurantAdmin', 'Manager'), async (req, res) => {
  try {
    const table = await Table.create({ ...req.body, restaurantId: req.user.restaurantId });
    res.status(201).json({ success: true, table });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authorize('RestaurantAdmin', 'Manager'), async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      req.body, { new: true }
    );
    res.json({ success: true, table });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    await Table.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    res.json({ success: true, message: 'Table deleted.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;