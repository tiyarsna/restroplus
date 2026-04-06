// routes/subscriptions.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Subscription } = require('../models/index');
const Restaurant = require('../models/Restaurant');

const PLAN_FEATURES = {
  FREE: { price: 0, features: ['Basic menu management', 'Basic billing', 'Max 5 staff', 'Single branch'] },
  BASIC: { price: 999, features: ['Realtime orders', 'Unlimited staff', 'Table management', 'Expense tracking', 'Basic analytics', 'Waste tracking'] },
  PRO: { price: 2499, features: ['Advanced analytics', 'AI waste insights', 'SaveBite Mode', 'Multi-branch', 'Priority support', 'All BASIC features'] }
};

router.use(protect);

router.get('/plans', (req, res) => {
  res.json({ success: true, plans: PLAN_FEATURES });
});

router.get('/current', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId);
    res.json({ success: true, subscription: restaurant.subscription, plans: PLAN_FEATURES });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/upgrade', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    const { plan, billingCycle, paymentMethod, transactionId } = req.body;
    if (!PLAN_FEATURES[plan]) return res.status(400).json({ error: 'Invalid plan.' });
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));
    await Restaurant.findByIdAndUpdate(req.user.restaurantId, { 'subscription.plan': plan, 'subscription.endDate': endDate });
    const sub = await Subscription.create({
      restaurantId: req.user.restaurantId, plan,
      price: PLAN_FEATURES[plan].price * (billingCycle === 'yearly' ? 10 : 1),
      billingCycle, endDate, paymentMethod, transactionId,
      features: PLAN_FEATURES[plan].features
    });
    res.json({ success: true, subscription: sub });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
