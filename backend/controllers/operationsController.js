const mongoose = require('mongoose');
const Order = require('../models/Order');
const { Bill, WasteLog, LeftoverSale, Expense, Table } = require('../models/index');
const Restaurant = require('../models/Restaurant');

// ==================== BILLING ====================
const generateBillNumber = () => {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `BILL-${datePart}-${Math.floor(Math.random()*9000)+1000}`;
};

exports.createBill = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found.' });

    const {
      orderId, paymentMethod = 'cash',
      discountType = 'fixed', discountValue = 0,
      gstEnabled, customerName, customerPhone
    } = req.body;

    const order = await Order.findOne({ _id: orderId, restaurantId });
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.isBilled) return res.status(400).json({ error: 'This order has already been billed.' });

    const subtotal = Math.round(order.subtotal * 100) / 100;

    // GST calculation
    const useGst = gstEnabled !== false && restaurant.settings?.gstEnabled !== false;
    const gstRate = useGst ? (restaurant.settings?.gstRate || 5) : 0;
    const gstAmount = Math.round((subtotal * gstRate / 100) * 100) / 100;

    // Discount calculation
    const discVal = Math.max(0, Number(discountValue) || 0);
    let discountAmount = 0;
    if (discVal > 0) {
      if (discountType === 'percentage') {
        discountAmount = Math.round((subtotal * Math.min(discVal, 100) / 100) * 100) / 100;
      } else {
        discountAmount = Math.min(discVal, subtotal); // can't discount more than subtotal
        discountAmount = Math.round(discountAmount * 100) / 100;
      }
    }

    const totalAmount = Math.round((subtotal + gstAmount - discountAmount) * 100) / 100;

    const bill = await Bill.create({
      restaurantId,
      orderId,
      billNumber: generateBillNumber(),
      customerName: customerName || order.customerName || 'Guest',
      customerPhone: customerPhone || order.customerPhone || '',
      tableNumber: order.tableNumber || '',
      items: order.items.map(i => ({
        name: i.name,
        quantity: Number(i.quantity),
        price: Math.round(Number(i.price) * 100) / 100,
        amount: Math.round(Number(i.price) * Number(i.quantity) * 100) / 100
      })),
      subtotal,
      gstRate,
      gstAmount,
      discountType,
      discountValue: discVal,
      discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: 'paid',
      createdBy: req.user._id
    });

    // Update order
    await Order.findByIdAndUpdate(orderId, {
      isBilled: true,
      billedAt: new Date(),
      status: 'completed',
      gstAmount,
      discountType,
      discountValue: discVal,
      discountAmount,
      totalAmount
    });

    // Free the table
    if (order.tableId) {
      const otherActive = await Order.countDocuments({
        tableId: order.tableId,
        _id: { $ne: order._id },
        status: { $in: ['pending','preparing','served'] },
        isBilled: false
      });
      if (otherActive === 0) {
        await Table.findByIdAndUpdate(order.tableId, { status: 'available', currentOrderId: null });
      }
    }

    // Update restaurant totals
    await Restaurant.findByIdAndUpdate(restaurantId, {
      $inc: { totalRevenue: totalAmount, totalOrders: 1 }
    });

    // Populate bill for response
    const populatedBill = await Bill.findById(bill._id);
    res.status(201).json({ success: true, bill: populatedBill });
  } catch (error) {
    console.error('createBill error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBills = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { date, page = 1, limit = 50, startDate, endDate } = req.query;
    const filter = { restaurantId };

    if (date) {
      const s = new Date(date); s.setHours(0,0,0,0);
      const e = new Date(date); e.setHours(23,59,59,999);
      filter.createdAt = { $gte: s, $lte: e };
    } else if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const [bills, total] = await Promise.all([
      Bill.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit)),
      Bill.countDocuments(filter)
    ]);

    // Calculate summary
    const summary = await Bill.aggregate([
      { $match: filter },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalBills: { $sum: 1 }, avgBillAmount: { $avg: '$totalAmount' } } }
    ]);

    res.json({ success: true, bills, total, summary: summary[0] || { totalRevenue: 0, totalBills: 0 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });
    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteBill = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!bill) return res.status(404).json({ error: 'Bill not found.' });

    // Reverse payment totals in restaurant
    await Restaurant.findByIdAndUpdate(restaurantId, {
      $inc: { totalRevenue: -bill.totalAmount, totalOrders: -1 }
    });

    // Revert the order's status to unbilled/served
    if (bill.orderId) {
      await Order.findByIdAndUpdate(bill.orderId, {
        isBilled: false,
        billedAt: null,
        status: 'served',
        gstAmount: 0,
        discountType: 'fixed',
        discountValue: 0,
        discountAmount: 0,
        totalAmount: 0
      });
    }

    try {
      const { getIO } = require('../socket/socketManager');
      const io = getIO();
      if (io) {
        io.to(`restaurant:${restaurantId}`).emit('billing:deleted', { billId: bill._id, orderId: bill.orderId });
      }
    } catch (e) {
      console.warn('Socket emit error', e);
    }

    res.json({ success: true, message: 'Bill deleted and order restored.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== WASTE ====================
exports.createWasteLog = async (req, res) => {
  try {
    const log = await WasteLog.create({
      ...req.body,
      quantity: Number(req.body.quantity),
      estimatedCost: Math.round((Number(req.body.estimatedCost) || 0) * 100) / 100,
      restaurantId: req.user.restaurantId,
      loggedBy: req.user._id
    });
    res.status(201).json({ success: true, log });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getWasteLogs = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { period = '7d', page = 1, limit = 50 } = req.query;
    let startDate = new Date();
    if (period === '1d') startDate.setHours(0,0,0,0);
    else if (period === '7d')  startDate.setDate(startDate.getDate()-7);
    else if (period === '30d') startDate.setDate(startDate.getDate()-30);

    const filter = { restaurantId, date: { $gte: startDate } };

    const [logs, summary, totalCost] = await Promise.all([
      WasteLog.find(filter).sort({ date: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit)),
      WasteLog.aggregate([
        { $match: filter },
        { $group: { _id: '$reason', count: { $sum: 1 }, totalCost: { $sum: '$estimatedCost' }, totalQty: { $sum: '$quantity' } } },
        { $sort: { totalCost: -1 } }
      ]),
      WasteLog.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$estimatedCost' }, qty: { $sum: '$quantity' } } }
      ])
    ]);

    res.json({ success: true, logs, summary, totalCost: totalCost[0]?.total || 0, totalQty: totalCost[0]?.qty || 0 });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteWasteLog = async (req, res) => {
  try {
    await WasteLog.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    res.json({ success: true, message: 'Waste log deleted.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== SAVEBITE ====================
exports.createLeftoverSale = async (req, res) => {
  try {
    const { itemName, originalPrice, expiryTime, quantityAvailable, menuItemId, category, description } = req.body;
    const restaurantId = req.user.restaurantId;

    const origPrice = Math.round(Number(originalPrice) * 100) / 100;
    const expiry = new Date(expiryTime);
    const now = new Date();
    const minutesLeft = (expiry - now) / (1000 * 60);

    let discountPercentage = 30;
    if (minutesLeft <= 10) discountPercentage = 70;
    else if (minutesLeft <= 30) discountPercentage = 50;
    else if (minutesLeft <= 60) discountPercentage = 30;

    const discountedPrice = Math.round(origPrice * (1 - discountPercentage/100) * 100) / 100;

    const sale = await LeftoverSale.create({
      restaurantId, menuItemId, itemName, category,
      originalPrice: origPrice, discountPercentage, discountedPrice,
      quantityAvailable: Number(quantityAvailable),
      expiryTime: expiry, description, isActive: true
    });
    res.status(201).json({ success: true, sale });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getActiveLeftoverSales = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const sales = await LeftoverSale.find({
      restaurantId, isActive: true,
      expiryTime: { $gt: new Date() },
      $expr: { $gt: ['$quantityAvailable', '$quantitySold'] }
    }).sort({ expiryTime: 1 });
    res.json({ success: true, sales });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getAllLeftoverSales = async (req, res) => {
  try {
    const sales = await LeftoverSale.find({
      isActive: true,
      expiryTime: { $gt: new Date() },
      $expr: { $gt: ['$quantityAvailable', '$quantitySold'] }
    }).populate('restaurantId','name location').sort({ expiryTime: 1 });
    res.json({ success: true, sales });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deactivateLeftoverSale = async (req, res) => {
  try {
    const sale = await LeftoverSale.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      { isActive: false }, { new: true }
    );
    res.json({ success: true, sale });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

// ==================== EXPENSES ====================
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      amount: Math.round(Number(req.body.amount) * 100) / 100,
      restaurantId: req.user.restaurantId,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, expense });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      {
        ...req.body,
        ...(req.body.amount && { amount: Math.round(Number(req.body.amount) * 100) / 100 })
      },
      { new: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found.' });
    res.json({ success: true, expense });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getExpenses = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { month, year, category, page = 1, limit = 50 } = req.query;
    const filter = { restaurantId };

    if (month && year) {
      filter.date = { $gte: new Date(year, month-1, 1), $lt: new Date(year, month, 1) };
    }
    if (category && category !== 'all') filter.category = category;

    const [expenses, totalByCategory, totalAmount] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit)),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Expense.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({ success: true, expenses, totalByCategory, totalAmount: totalAmount[0]?.total || 0 });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, restaurantId: req.user.restaurantId });
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};