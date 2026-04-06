# 🍽️ RestroPulse — Multi-Restaurant SaaS Platform

> Production-ready restaurant management platform with real-time orders, waste tracking, and SaveBite mode.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Redux Toolkit |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Realtime | Socket.IO |
| Auth | JWT (Role-based) |
| Charts | Recharts |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI

# Frontend
cd ../frontend
npm install
```

### 2. Seed Demo Data (JK Spicy Dosa Cafe)

```bash
cd backend
npm run seed
```

This creates:
- 🏪 **JK Spicy Dosa Cafe** restaurant with real menu (55 items)
- 👑 SuperAdmin: `superadmin@restropulse.com` / `SuperAdmin@123`
- 🏪 RestaurantAdmin: `owner@jkspicydosa.com` / `Admin@123`
- 👔 Manager: `manager@jkspicydosa.com` / `Staff@123`
- 🧑‍🍳 Waiter: `amit@jkspicydosa.com` / `Staff@123`
- 📋 55 menu items across 5 categories
- 📦 6 sample orders
- 💸 10 expense entries
- 🗑️ 7 waste logs
- 🍱 4 SaveBite listings

### 3. Run Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2 - Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

---

## 📁 Folder Structure

```
restropulse/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # Login, register, JWT
│   │   ├── menuController.js    # CRUD menu items
│   │   └── operationsController.js  # Billing, waste, savebite, expenses
│   ├── middleware/
│   │   └── auth.js              # JWT + role guards + tenant isolation
│   ├── models/
│   │   ├── User.js              # User (all roles)
│   │   ├── Restaurant.js        # Restaurant + settings
│   │   ├── MenuItem.js          # Menu items
│   │   ├── Order.js             # Orders with items
│   │   └── index.js             # Bill, Table, Expense, WasteLog, LeftoverSale, Subscription
│   ├── routes/
│   │   ├── auth.js
│   │   ├── menu.js
│   │   ├── orders.js
│   │   ├── billing.js
│   │   ├── waste.js
│   │   ├── savebite.js
│   │   ├── expenses.js
│   │   ├── tables.js
│   │   ├── staff.js
│   │   ├── subscriptions.js
│   │   ├── restaurants.js
│   │   └── superadmin.js
│   ├── socket/
│   │   └── socketManager.js     # Socket.IO real-time events
│   ├── seed/
│   │   └── seedData.js          # JK Spicy Dosa Cafe full seed
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Express app entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       ├── RestaurantLayout.jsx   # Sidebar + topbar
    │   │       └── SuperAdminLayout.jsx
    │   ├── pages/
    │   │   ├── auth/
    │   │   │   ├── LoginPage.jsx          # With demo buttons
    │   │   │   └── RegisterPage.jsx
    │   │   ├── restaurant/
    │   │   │   ├── DashboardPage.jsx      # Analytics + live orders
    │   │   │   ├── LiveOrdersPage.jsx     # Socket.IO real-time
    │   │   │   ├── MenuPage.jsx           # Full CRUD
    │   │   │   ├── TablesPage.jsx         # Visual table grid
    │   │   │   ├── BillingPage.jsx        # GST + discount + print
    │   │   │   ├── WastePage.jsx          # Log + analytics
    │   │   │   ├── SaveBitePage.jsx       # Countdown timers
    │   │   │   ├── StaffPage.jsx          # Add/remove staff
    │   │   │   ├── AnalyticsPage.jsx      # P&L charts
    │   │   │   ├── SubscriptionPage.jsx   # Plan comparison
    │   │   │   └── SettingsPage.jsx       # Restaurant config
    │   │   ├── admin/
    │   │   │   ├── SuperDashboard.jsx
    │   │   │   └── ManageRestaurants.jsx
    │   │   └── customer/
    │   │       └── CustomerDealsPage.jsx  # Public SaveBite deals
    │   ├── store/
    │   │   ├── store.js
    │   │   └── slices/
    │   │       ├── authSlice.js
    │   │       ├── menuSlice.js
    │   │       ├── orderSlice.js
    │   │       ├── restaurantSlice.js
    │   │       └── uiSlice.js
    │   ├── utils/
    │   │   ├── api.js             # Axios + auth interceptor
    │   │   ├── socket.js          # Socket.IO client
    │   │   └── helpers.js         # Formatters, constants
    │   ├── styles/
    │   │   └── index.css          # Tailwind + custom classes
    │   ├── App.jsx                # Routes + guards
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🔑 Roles & Permissions

| Role | Access |
|---|---|
| **SuperAdmin** | Platform analytics, all restaurants (no personal data), plan management |
| **RestaurantAdmin** | Full restaurant control: menu, staff, billing, settings, subscription |
| **Manager** | Orders, menu edits, tables, billing, waste |
| **Waiter** | Create orders, update status, generate bill |

---

## 🍽️ JK Spicy Dosa Cafe — Seed Menu

The seed data is extracted from the real JK Spicy Dosa Cafe menu photos:

| Category | Items |
|---|---|
| Paper Dosa | 7 items (₹60 – ₹140) |
| Nylon Dosa | 17 items (₹80 – ₹150) |
| Gravy Item | 11 items (₹140 – ₹330) |
| Fancy Dosa | 16 items (₹100 – ₹260) |
| Extras | 4 items (₹20 each) |

---

## ⚡ Real-Time Events (Socket.IO)

| Event | Direction | Description |
|---|---|---|
| `order:new` | Server → Client | New order created |
| `order:updated` | Server → Client | Status changed |
| `kitchen:accept` | Client → Server | Kitchen accepted order |
| `kitchen:ready` | Client → Server | Order ready to serve |
| `table:call_waiter` | Client → Server | Table needs waiter |

---

## 🍱 SaveBite Discount Logic

```
Time to expiry > 60 min  → 30% discount
Time to expiry 30–60 min → 50% discount
Time to expiry < 10 min  → 70% discount
```

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Deploy /dist to Vercel
# Set VITE_API_URL=https://your-backend.railway.app/api
# Set VITE_SOCKET_URL=https://your-backend.railway.app
```

### Backend → Railway / Render
```bash
# Set environment variables:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_production_secret
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
```

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Whitelist all IPs (0.0.0.0/0) for Render/Railway
3. Copy connection string to MONGODB_URI

---

## 📱 Features by Plan

| Feature | FREE | BASIC | PRO |
|---|---|---|---|
| Menu management | ✅ | ✅ | ✅ |
| Basic billing | ✅ | ✅ | ✅ |
| Max staff | 5 | Unlimited | Unlimited |
| Realtime orders | ❌ | ✅ | ✅ |
| Table management | ❌ | ✅ | ✅ |
| Expense tracking | ❌ | ✅ | ✅ |
| Waste tracking | ❌ | Manual | AI-enhanced |
| Analytics | ❌ | Basic | Advanced |
| SaveBite Mode | ❌ | ❌ | ✅ |
| Multi-branch | ❌ | ❌ | ✅ |

---

Built with ❤️ for RestroPulse — Reducing food waste, one dosa at a time 🍽️
# restroplus
