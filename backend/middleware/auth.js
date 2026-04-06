const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ================= PROTECT =================
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token
    if (!token) {
      return res.status(401).json({ error: 'Not authorized. No token provided.' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id).select('-password');

    // ❗ FIX: remove isActive check OR ensure field exists
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('❌ AUTH ERROR:', error.message);
    return res.status(401).json({ error: 'Not authorized. Invalid token.' });
  }
};

// ================= AUTHORIZE =================
const authorize = (...roles) => {
  return (req, res, next) => {
    // normalize role (lowercase)
    const userRole = req.user.role?.toLowerCase();

    if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
      return res.status(403).json({
        error: `Role '${req.user.role}' is not authorized`
      });
    }

    next();
  };
};

// ================= TENANT ACCESS =================
const tenantAccess = (req, res, next) => {
  // ❗ FIX: correct role check
  if (req.user.role?.toLowerCase() === 'superadmin') {
    return next();
  }

  const restaurantId =
    req.params.restaurantId ||
    req.body.restaurantId ||
    req.query.restaurantId;

  if (
    restaurantId &&
    req.user.restaurantId &&
    restaurantId !== req.user.restaurantId.toString()
  ) {
    return res.status(403).json({
      error: 'Access denied to this restaurant.'
    });
  }

  // auto attach restaurantId
  if (!req.query.restaurantId && req.user.restaurantId) {
    req.query.restaurantId = req.user.restaurantId;
  }

  next();
};

// ================= TOKEN =================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

module.exports = {
  protect,
  authorize,
  tenantAccess,
  generateToken
};