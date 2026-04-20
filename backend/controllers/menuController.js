const MenuItem = require('../models/MenuItem');

// @desc Get all menu items for a restaurant
exports.getMenuItems = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId || req.query.restaurantId;
    const { category, isAvailable } = req.query;

    const filter = { restaurantId };
    if (category) filter.category = category;
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const items = await MenuItem.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });

    // Group by category
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ success: true, items, grouped, total: items.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Create menu item
exports.createMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const item = await MenuItem.create({ ...req.body, restaurantId });
    res.status(201).json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Bulk add menu items (from CSV)
exports.bulkAddMenuItems = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const items = req.body.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of items.' });
    }

    const itemsToInsert = items.map(item => ({
      ...item,
      restaurantId,
      price: Number(item.price) || 0,
    }));

    const inserted = await MenuItem.insertMany(itemsToInsert);

    try {
      const { getIO } = require('../socket/socketManager');
      const io = getIO();
      if (io) {
        io.to(`restaurant:${restaurantId}`).emit('menu:bulk_add', inserted);
      }
    } catch (e) {
      console.warn('Socket emit failed:', e.message);
    }

    res.status(201).json({ success: true, count: inserted.length, items: inserted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.user.restaurantId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.user.restaurantId
    });
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });
    res.json({ success: true, message: 'Menu item deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Toggle availability
exports.toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findOne({ _id: req.params.id, restaurantId: req.user.restaurantId });
    if (!item) return res.status(404).json({ error: 'Menu item not found.' });
    item.isAvailable = !item.isAvailable;
    await item.save();
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc Get categories
exports.getCategories = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const categories = await MenuItem.distinct('category', { restaurantId });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
