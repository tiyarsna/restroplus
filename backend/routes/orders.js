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
    const filter = { restaurantId: req.user.restaurantId };
    if (req.query.status) {
      filter.status = { $in: req.query.status.split(',') };
    }
    const orders = await Order.find(filter).sort({ createdAt: -1 });
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
      status: { $in: ['pending', 'preparing', 'served'] },
      isBilled: false
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

    try {
      const { getIO } = require('../socket/socketManager');
      const io = getIO();
      if (io) {
        io.to(`restaurant:${req.user.restaurantId}`).emit('order:update', updated);
      }
    } catch (e) {
      console.warn('Socket emit failed:', e.message);
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
