const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Order = require('../models/Order');
const { WasteLog, LeftoverSale, Bill } = require('../models/index');

// 🔐 Only SuperAdmin
router.use(protect, authorize('SuperAdmin'));


// ==============================
// ✅ GET ALL RESTAURANTS
// ==============================
router.get('/restaurants', async (req, res) => {
  try {
    const { page = 1, limit = 20, plan, search } = req.query;

    const filter = {};
    if (plan) filter['subscription.plan'] = plan;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const restaurants = await Restaurant.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((page - 1) * limit)
      .select('name email subscription createdAt');

    const total = await Restaurant.countDocuments(filter);

    res.json({ success: true, restaurants, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ==============================
// 🔥 DELETE RESTAURANT (NEW)
// ==============================
router.delete('/restaurants/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // 🔥 DELETE RELATED DATA (IMPORTANT)
    await Promise.all([
      User.deleteMany({ restaurant: id }),
      Order.deleteMany({ restaurant: id }),
      WasteLog.deleteMany({ restaurant: id }),
      LeftoverSale.deleteMany({ restaurant: id }),
      Bill.deleteMany({ restaurant: id }),
    ]);

    await Restaurant.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Restaurant and related data deleted successfully'
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ==============================
// 📊 PLATFORM ANALYTICS
// ==============================
router.get('/analytics', async (req, res) => {
  try {
    const [
      totalRestaurants,
      planBreakdown,
      totalRevenue,
      recentOrders,
      wasteStats
    ] = await Promise.all([
      Restaurant.countDocuments(),

      Restaurant.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
      ]),

      Bill.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),

      Order.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }),

      WasteLog.aggregate([
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$estimatedCost' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalRestaurants,
        planBreakdown,
        platformRevenue: totalRevenue[0]?.total || 0,
        recentOrders,
        wasteStats: wasteStats[0] || {}
      }
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ==============================
// 💳 UPDATE SUBSCRIPTION
// ==============================
router.patch('/restaurants/:id/subscription', async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { subscription: req.body },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json({ success: true, restaurant });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;