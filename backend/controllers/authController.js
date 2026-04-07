const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const { Table } = require('../models/index');
const { generateToken } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { restaurantName, ownerName, email, phone, password, address, city, state, pincode, gstNumber } = req.body;
    if (!restaurantName || !ownerName || !email || !phone || !password)
      return res.status(400).json({ error: 'Please fill all required fields.' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'Email already registered. Please login.' });

    const restaurant = await Restaurant.create({
      name: restaurantName, ownerName, email: email.toLowerCase(), phone,
      location: { address, city, state, pincode }, gstNumber: gstNumber || null,
      subscription: { plan: 'FREE' }
    });

    await Table.insertMany(Array.from({ length: 5 }, (_, i) => ({
      restaurantId: restaurant._id, tableNumber: `T${i + 1}`, capacity: 4, floor: 'Ground'
    })));

    const user = await User.create({ name: ownerName, email: email.toLowerCase(), phone, password, role: 'RestaurantAdmin', restaurantId: restaurant._id });
    res.status(201).json({ success: true, token: generateToken(user), user: user.toJSON(), restaurant });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Please provide email and password.' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ error: 'No account found with this email.' });
    if (!(await user.comparePassword(password))) return res.status(401).json({ error: 'Incorrect password.' });
    if (!user.isActive) return res.status(401).json({ error: 'Account deactivated. Contact admin.' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    let restaurant = null;
    if (user.restaurantId) restaurant = await Restaurant.findById(user.restaurantId);

    res.json({ success: true, token: generateToken(user), user: user.toJSON(), restaurant });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    let restaurant = null;
    if (user.restaurantId) restaurant = await Restaurant.findById(user.restaurantId);
    res.json({ success: true, user, restaurant });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    if (!(await user.comparePassword(currentPassword)))
      return res.status(400).json({ error: 'Current password is incorrect.' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};