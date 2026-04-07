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
          io.to(`restaurant:${restaurantId}`).emit('order:updated', order);
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

    res.status(201).json(order);

  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
