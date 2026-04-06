const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const server = http.createServer(app);

// ================= DATABASE =================
try {
  const connectDB = require('./config/database');
  connectDB();
  console.log('🗄️ Database connected');
} catch (err) {
  console.error('❌ DB connection failed:', err.message);
}

// ================= SOCKET =================
try {
  const { initSocket } = require('./socket/socketManager');
  if (typeof initSocket === 'function') {
    initSocket(server);
    console.log('🔌 Socket initialized');
  }
} catch (err) {
  console.warn('⚠️ Socket init skipped:', err.message);
}

// ================= SECURITY =================
app.use(helmet({ contentSecurityPolicy: false }));

// ================= CORS =================
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://restroplus.vercel.app',
  'https://restroplus-l1q80opou-tiyarsnas-projects.vercel.app'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow tools like Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Handle preflight requests explicitly
app.options('*', cors());

// ================= RATE LIMIT =================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500
  })
);

// ================= BODY PARSER =================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ================= LOGGER =================
app.use(morgan('dev'));

// ================= ROUTES =================
try {
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
} catch (err) {
  console.error('❌ Route loading error:', err.message);
}

// ================= HEALTH =================
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.get('/', (req, res) => {
  res.send('RestroPulse API running 🚀');
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Server error' });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server };