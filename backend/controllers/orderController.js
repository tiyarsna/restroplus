const Order = require('../models/Order');

// Simple helpers
const calcOrderTotals = (items) => {
  const subtotal = Math.round(items.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
  return { subtotal, totalAmount: subtotal, gstAmount: 0, discountAmount: 0 };
};

const generateOrderNumber = () => {
  const now = new Date();
  const prefix = 'ORD';
  const yearMonth = now.toISOString().slice(0, 7).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${yearMonth}-${random}`;
};

const getIO = () => {
  try {
    const { io } = require('../socket/socketManager');
    return io;
  } catch {
    return null;
  }
};

// Create new order (with merge logic)
exports.createOrder = async (req, res) => {
  try {
    console.log("Create Order - Incoming Body:", req.body);
    console.log("req.user:", req.user?._id, req.user?.restaurantId);

    if (!req.user?.restaurantId) {
      return res.status(400).json({ error: 'restaurantId not found. Please select a restaurant.' });
    }

    const { 
      tableId, tableNumber, customerName, customerPhone, notes, 
      orderType = 'dine-in', items 
    } = req.body;

    const restaurantId = req.user.restaurantId;

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must have at least one item.' });
    }

    // Validate and clean items
    const cleanItems = items.map(item => ({
      menuItemId: item.menuItemId,
      name: String(item.name),
      price: Math.round(Number(item.price) * 100) / 100,
      quantity: Number(item.quantity),
      notes: item.notes || '',
      category: item.category || ''
    }));

    const { subtotal } = calcOrderTotals(cleanItems);

    // Check if table has existing active (non-billed) order
    let existingOrder = null;
    if (tableId) {
      existingOrder = await Order.findOne({
        restaurantId,
        tableId,
        status: { $in: ['pending','preparing','served'] },
        isBilled: false
      });
    }

    let order;
    if (existingOrder) {
      // MERGE items into existing order
      const mergedItems = [...existingOrder.items.map(i => i.toObject())];
      for (const newItem of cleanItems) {
        const idx = mergedItems.findIndex(i =>
          i.menuItemId?.toString() === newItem.menuItemId?.toString() && 
          i.notes === newItem.notes
        );
        if (idx >= 0) {
          mergedItems[idx].quantity += newItem.quantity;
        } else {
          mergedItems.push(newItem);
        }
      }
      const newSubtotal = Math.round(mergedItems.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
      order = await Order.findByIdAndUpdate(
        existingOrder._id, 
        {
          items: mergedItems,
          subtotal: newSubtotal,
          totalAmount: newSubtotal,
          ...(notes && { notes: existingOrder.notes ? `${existingOrder.notes}\n${notes}` : notes }),
          ...(customerName && { customerName }),
          ...(customerPhone && { customerPhone })
        }, 
        { new: true }
      );

      try {
        const io = getIO();
        if (io) {
          io.to(`restaurant:${restaurantId}`).emit('order:update', order);
          io.to(`restaurant:${restaurantId}`).emit('order:items_added', { 
            orderId: order._id, 
            addedItems: cleanItems 
          });
        }
      } catch(e) {
        console.warn('Socket emit failed:', e.message);
      }

      return res.json({ order, merged: true });
    }

    // Create new order
    order = await Order.create({
      restaurantId,
      orderNumber: generateOrderNumber(),
      tableId: tableId || null,
      tableNumber: tableNumber || null,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      items: cleanItems,
      notes: notes || null,
      orderType,
      subtotal,
      totalAmount: subtotal,
      gstAmount: 0,
      discountAmount: 0,
      createdBy: req.user._id,
      status: 'pending',
      isBilled: false
    });

    // Socket notification
    try {
      const io = getIO();
      if (io) {
        io.to(`restaurant:${restaurantId}`).emit('order:new', order);
      }
    } catch(e) {
      console.warn('Socket emit failed:', e.message);
    }

    res.status(201).json({ order, merged: false });

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Reset all sales data for the restaurant
exports.resetSalesData = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { confirmation } = req.body;

    if (confirmation !== 'RESET') {
      return res.status(400).json({ error: 'Invalid confirmation string' });
    }

    const { Bill } = require('../models/index');
    const Restaurant = require('../models/Restaurant');
    const Order = require('../models/Order');

    // Delete all orders and bills for this restaurant
    await Order.deleteMany({ restaurantId });
    await Bill.deleteMany({ restaurantId });

    // Reset restaurant revenues
    await Restaurant.findByIdAndUpdate(restaurantId, {
      totalRevenue: 0,
      totalOrders: 0
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`restaurant:${restaurantId}`).emit('sales:reset');
      }
    } catch(e) {
      console.warn('Socket emit failed:', e.message);
    }

    res.json({ success: true, message: 'All sales data has been successfully reset.' });
  } catch (err) {
    console.error("RESET SALES DATA ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// Update an individual order item's status
exports.updateOrderItemStatus = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { status } = req.body;
    const restaurantId = req.user.restaurantId;

    if (!['pending', 'ready', 'parcel', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid item status' });
    }

    const order = await Order.findOne({ _id: id, restaurantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item not found in order' });

    item.status = status;

    // Recalculate totals
    let newSubtotal = 0;
    order.items.forEach(i => {
      if (i.status !== 'cancelled') {
        newSubtotal += (i.price * i.quantity);
      }
    });

    order.subtotal = Math.round(newSubtotal * 100) / 100;

    // For totalAmount, we might just set it to subtotal minus any order-level discounts + gst.
    // If the order has complex discount/gst logic already applied, we can approximate:
    // Actually, usually totalAmount is calculated at billing. Before billing, it's just subtotal - discount + gst.
    // Let's re-calculate it simply:
    let discountAmount = order.discountAmount || 0;
    if (order.discountType === 'percentage') {
      discountAmount = (order.subtotal * (order.discountValue || 0)) / 100;
    } else if (order.discountType === 'fixed') {
      discountAmount = order.discountValue || 0;
    }
    discountAmount = Math.round(discountAmount * 100) / 100;
    
    // Gst is also recalculated at billing typically, but let's just do subtotal - discount for now
    // If gstAmount is present, it will be added.
    order.totalAmount = Math.max(0, order.subtotal - discountAmount + (order.gstAmount || 0));
    order.totalAmount = Math.round(order.totalAmount * 100) / 100;

    // Check if all items are resolved
    const allResolved = order.items.every(i => ['ready', 'parcel', 'cancelled'].includes(i.status));
    
    // Automatically transition to 'served' or similar logic if needed, but let's keep it simple: 
    // frontend handles showing "Complete & Bill". But we can automatically mark order as 'served' if all items are handled and it was 'pending'/'preparing'.
    if (allResolved && ['pending', 'preparing'].includes(order.status)) {
      order.status = 'served';
    } else if (!allResolved && order.status === 'served') {
      order.status = 'preparing'; // Revert if an item becomes pending again
    }

    await order.save();

    try {
      const io = getIO();
      if (io) {
        io.to(`restaurant:${restaurantId}`).emit('order:update', order);
      }
    } catch(e) {
      console.warn('Socket emit failed:', e.message);
    }

    res.json(order);
  } catch (err) {
    console.error("UPDATE ITEM STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
