const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder } = require('../controllers/orderController');
const Order = require('../models/Order');

// ================= CREATE ORDER =================
router.use(protect);
router.post('/', createOrder);

// ================= GET ALL ORDERS =================
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.restaurantId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= LIVE ORDERS =================
router.get('/live', async (req, res) => {
  try {
    const orders = await Order.find({
      restaurantId: req.user.restaurantId,
      status: { $in: ['pending', 'preparing'] }
    });
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= UPDATE ORDER STATUS =================
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;

    const updated = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= ANALYTICS =================
router.get('/analytics', async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.user.restaurantId });

    const totalRevenue = orders.reduce(
      (sum, o) => sum + (o.totalAmount || 0),
      0
    );

    const totalOrders = orders.length;

    const completedOrders = orders.filter(
      (o) => o.status === 'completed'
    ).length;

    res.json({
      analytics: {},
      totals: {
        totalRevenue,
        totalOrders,
        completedOrders
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
