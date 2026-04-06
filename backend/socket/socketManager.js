const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // ✅ Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id);

      if (!user) return next(new Error('User not found'));

      socket.user = user;

      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    console.log(`🔌 Socket connected: ${user.name} (${user.role})`);

    // ✅ Join restaurant room
    if (user.restaurantId) {
      const room = `restaurant:${user.restaurantId}`;
      socket.join(room);
      console.log(`📍 Joined room: ${room}`);
    }

    // ✅ SuperAdmin room
    if (user.role === 'SuperAdmin') {
      socket.join('superadmin');
    }

    // ✅ Kitchen events
    socket.on('kitchen:accept', (data) => {
      io.to(`restaurant:${user.restaurantId}`).emit('order:kitchen_accepted', data);
    });

    socket.on('kitchen:ready', (data) => {
      io.to(`restaurant:${user.restaurantId}`).emit('order:ready', data);
    });

    // ✅ Table events
    socket.on('table:call_waiter', (data) => {
      io.to(`restaurant:${user.restaurantId}`).emit('table:waiter_called', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${user.name}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };