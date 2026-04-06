const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('🔧 Starting RestroPulse...');
console.log('🗄️ MongoDB URI:', process.env.MONGODB_URI ? '✅ Found' : '❌ MISSING');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? '✅ Found' : '❌ MISSING');

// DB connection
const connectDB = require('./config/database');
connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Socket init (safe)
try {
  const { initSocket } = require('./socket/socketManager');
  if (typeof initSocket === 'function') {
    initSocket(server);
    console.log('🔌 Socket.IO initialized');
  } else {
    console.warn('⚠️ initSocket is not a function');
  }
} catch (e) {
  console.warn('⚠️ Socket.IO init failed:', e.message);
}

// ================= MIDDLEWARE =================

// Security
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    skip: () => process.env.NODE_ENV === 'development'
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('dev'));

// ================= ROUTES =================

app.use('/api/auth', require('./routes/auth'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/waste', require('./routes/waste'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/savebite', require('./routes/savebite'));

// ================= HEALTH =================

app.get('/health', (req, res) =>
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString()
  })
);

app.get('/', (req, res) =>
  res.json({ message: 'RestroPulse API running' })
);

// ================= ERROR HANDLING =================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `Not found: ${req.method} ${req.path}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error Stack:', err.stack || err.message);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n=====================================');
  console.log('🚀 RestroPulse running on port', PORT);
  console.log('🌐 http://localhost:' + PORT + '/health');
  console.log('=====================================\n');
});

module.exports = { app, server };