const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const staff = await User.find({
      restaurantId: req.user.restaurantId,
      role: { $in: ['Manager', 'Waiter'] }
    }).select('-password');
    res.json({ success: true, staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use.' });
    const staff = await User.create({
      name, email, phone, password,
      role: role || 'Waiter',
      restaurantId: req.user.restaurantId
    });
    res.status(201).json({ success: true, staff: staff.toJSON() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      updateData, { new: true }
    ).select('-password');
    res.json({ success: true, staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { isActive: false }
    );
    res.json({ success: true, message: 'Staff deactivated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
