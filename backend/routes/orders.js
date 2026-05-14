const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createOrder, resetSalesData, updateOrderItemStatus } = require('../controllers/orderController');
const Order = require('../models/Order');

// ================= CREATE ORDER =================
router.use(protect);
router.post('/', createOrder);
router.delete('/reset', resetSalesData);

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

// ================= UPDATE ORDER ITEM STATUS =================
router.patch('/:id/items/:itemId', updateOrderItemStatus);

// ================= ANALYTICS =================
router.get('/analytics', async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const days = parseInt(period) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all orders in the requested timeframe
    const orders = await Order.find({ 
      restaurantId: req.user.restaurantId,
      createdAt: { $gte: startDate }
    });

    // Calculate totals (only count completed or billed orders towards revenue to be safe, but totalAmount historically used here)
    const validOrders = orders.filter(o => o.status === 'completed' || o.isBilled);
    const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const completedOrders = validOrders.length;

    // Daily aggregation for the charts
    const aggregatePipeline = [
      {
        $match: {
          restaurantId: req.user.restaurantId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const analytics = await Order.aggregate(aggregatePipeline);

    res.json({
      analytics, 
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
