const path = require('path');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { Bill, Table, Expense, WasteLog, LeftoverSale, Subscription } = require('../models/index');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restropulse';

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Restaurant.deleteMany({}), MenuItem.deleteMany({}),
    Order.deleteMany({}), Bill.deleteMany({}), Table.deleteMany({}),
    Expense.deleteMany({}), WasteLog.deleteMany({}), LeftoverSale.deleteMany({}),
    Subscription.deleteMany({})
  ]);
  console.log('🗑️  Cleared existing data');

  // ===================== SUPERADMIN =====================
  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@restropulse.com',
    password: 'SuperAdmin@123',
    role: 'SuperAdmin',
    phone: '9000000000'
  });
  console.log('👑 SuperAdmin created');

  // ===================== RESTAURANT =====================
  const restaurant = await Restaurant.create({
    name: 'JK Spicy Dosa Cafe',
    ownerName: 'Jayesh Kumar',
    email: 'owner@jkspicydosa.com',
    phone: '9876543210',
    location: {
      address: 'Shop No. 12, Main Market',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001'
    },
    gstNumber: '24ABCDE1234F1Z5',
    cuisine: ['South Indian', 'Dosa', 'Snacks'],
    settings: {
      gstEnabled: true,
      gstRate: 5,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      openTime: '07:00',
      closeTime: '23:00',
      savebiteEnabled: true,
      autoSavebiteDiscount: true
    },
    subscription: { plan: 'PRO', startDate: new Date(), endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }
  });
  console.log('🏪 Restaurant created:', restaurant.name);

  // ===================== USERS =====================
  const adminUser = await User.create({
    name: 'Jayesh Kumar',
    email: 'owner@jkspicydosa.com',
    password: 'Admin@123',
    phone: '9876543210',
    role: 'RestaurantAdmin',
    restaurantId: restaurant._id
  });

  const manager = await User.create({
    name: 'Ravi Patel',
    email: 'manager@jkspicydosa.com',
    password: 'Staff@123',
    phone: '9876543211',
    role: 'Manager',
    restaurantId: restaurant._id
  });

  const waiter1 = await User.create({
    name: 'Amit Shah',
    email: 'amit@jkspicydosa.com',
    password: 'Staff@123',
    phone: '9876543212',
    role: 'Waiter',
    restaurantId: restaurant._id
  });

  const waiter2 = await User.create({
    name: 'Priya Mehta',
    email: 'priya@jkspicydosa.com',
    password: 'Staff@123',
    phone: '9876543213',
    role: 'Waiter',
    restaurantId: restaurant._id
  });
  console.log('👥 Staff created');

  // ===================== TABLES =====================
  const tableData = [
    { tableNumber: 'T1', capacity: 2, floor: 'Ground', position: { x: 1, y: 1 } },
    { tableNumber: 'T2', capacity: 4, floor: 'Ground', position: { x: 2, y: 1 } },
    { tableNumber: 'T3', capacity: 4, floor: 'Ground', position: { x: 3, y: 1 } },
    { tableNumber: 'T4', capacity: 6, floor: 'Ground', position: { x: 1, y: 2 } },
    { tableNumber: 'T5', capacity: 6, floor: 'Ground', position: { x: 2, y: 2 } },
    { tableNumber: 'T6', capacity: 4, floor: 'Ground', position: { x: 3, y: 2 } },
    { tableNumber: 'T7', capacity: 2, floor: 'First', position: { x: 1, y: 1 } },
    { tableNumber: 'T8', capacity: 4, floor: 'First', position: { x: 2, y: 1 } },
    { tableNumber: 'T9', capacity: 4, floor: 'First', position: { x: 3, y: 1 } },
    { tableNumber: 'T10', capacity: 8, floor: 'First', position: { x: 1, y: 2 } },
  ];
  const tables = await Table.insertMany(tableData.map(t => ({ ...t, restaurantId: restaurant._id })));
  console.log('🪑 Tables created');

  // ===================== MENU ITEMS (from real menu images) =====================
  const menuItems = [
    // === PAPER DOSA ===
    { name: 'Sada Paper', category: 'Paper Dosa', price: 60, isVeg: true, preparationTime: 10, description: 'Crispy plain paper dosa', tags: ['bestseller'] },
    { name: 'Cheese Sada Paper', category: 'Paper Dosa', price: 120, isVeg: true, preparationTime: 12, description: 'Paper dosa with Amul cheese', tags: ['cheese'] },
    { name: 'Baby Paper', category: 'Paper Dosa', price: 60, isVeg: true, preparationTime: 8, description: 'Mini paper dosa' },
    { name: 'Cheese Garlic Paper', category: 'Paper Dosa', price: 130, isVeg: true, preparationTime: 12, description: 'Garlic flavored paper dosa with cheese', tags: ['spicy', 'cheese'] },
    { name: 'Schezwan Sada Paper', category: 'Paper Dosa', price: 90, isVeg: true, preparationTime: 10, description: 'Schezwan flavored paper dosa', tags: ['spicy'] },
    { name: 'Cheese Schezwan Sada', category: 'Paper Dosa', price: 130, isVeg: true, preparationTime: 12, description: 'Schezwan paper with Amul cheese', tags: ['spicy', 'cheese'] },
    { name: 'Chocolate Paper', category: 'Paper Dosa', price: 80, isVeg: true, preparationTime: 10, description: 'Sweet chocolate paper dosa', tags: ['sweet', 'kids'] },

    // === NYLON DOSA ===
    { name: 'Jeera Nylon', category: 'Nylon Dosa', price: 90, isVeg: true, preparationTime: 10, description: 'Thin crispy nylon dosa with jeera' },
    { name: 'Nylon Paper', category: 'Nylon Dosa', price: 80, isVeg: true, preparationTime: 10, description: 'Ultra-thin nylon paper dosa', tags: ['bestseller'] },
    { name: 'Cheese Nylon Paper', category: 'Nylon Dosa', price: 130, isVeg: true, preparationTime: 12, description: 'Nylon paper with Amul cheese', tags: ['cheese'] },
    { name: 'Baby Nylon Paper', category: 'Nylon Dosa', price: 80, isVeg: true, preparationTime: 8, description: 'Mini nylon paper dosa' },
    { name: 'Cheese Baby Nylon', category: 'Nylon Dosa', price: 130, isVeg: true, preparationTime: 10, description: 'Mini nylon with cheese', tags: ['cheese'] },
    { name: 'Garlic Nylon', category: 'Nylon Dosa', price: 90, isVeg: true, preparationTime: 10, description: 'Garlic flavored nylon dosa', tags: ['spicy'] },
    { name: 'Cheese Garlic Nylon', category: 'Nylon Dosa', price: 140, isVeg: true, preparationTime: 12, description: 'Garlic nylon with Amul cheese', tags: ['spicy', 'cheese'] },
    { name: 'Schezwan Nylon', category: 'Nylon Dosa', price: 100, isVeg: true, preparationTime: 10, description: 'Spicy schezwan nylon dosa', tags: ['spicy'] },
    { name: 'Cheese Schezwan Nylon', category: 'Nylon Dosa', price: 140, isVeg: true, preparationTime: 12, description: 'Schezwan nylon with cheese', tags: ['spicy', 'cheese'] },
    { name: 'Cheese Chili Garlic Nylon', category: 'Nylon Dosa', price: 150, isVeg: true, preparationTime: 12, description: 'Extra spicy chili garlic nylon', tags: ['spicy', 'cheese', 'bestseller'] },
    { name: 'Limbu Mari Nylon', category: 'Nylon Dosa', price: 90, isVeg: true, preparationTime: 10, description: 'Lemon pepper nylon dosa' },
    { name: 'Cheese Limbu Mari Nylon', category: 'Nylon Dosa', price: 130, isVeg: true, preparationTime: 12, description: 'Lemon pepper nylon with cheese', tags: ['cheese'] },
    { name: 'Mari Nylon', category: 'Nylon Dosa', price: 90, isVeg: true, preparationTime: 10, description: 'Black pepper nylon dosa', tags: ['spicy'] },
    { name: 'Cheese Mari Nylon', category: 'Nylon Dosa', price: 130, isVeg: true, preparationTime: 12, description: 'Black pepper nylon with cheese', tags: ['spicy', 'cheese'] },
    { name: 'Jeera Mari Nylon', category: 'Nylon Dosa', price: 90, isVeg: true, preparationTime: 10, description: 'Jeera black pepper nylon' },
    { name: 'Cheese Jeera Mari Nylon', category: 'Nylon Dosa', price: 130, isVeg: true, preparationTime: 12, description: 'Jeera mari nylon with cheese', tags: ['cheese'] },
    { name: 'Cheese Chocolate Nylon', category: 'Nylon Dosa', price: 130, isVeg: true, preparationTime: 12, description: 'Sweet chocolate nylon dosa', tags: ['sweet', 'cheese'] },

    // === GRAVY ITEMS ===
    { name: 'Mysore', category: 'Gravy Item', price: 140, isVeg: true, preparationTime: 15, description: 'Classic Mysore style dosa with red chutney', tags: ['bestseller'] },
    { name: 'Tawa Mysore', category: 'Gravy Item', price: 180, isVeg: true, preparationTime: 18, description: 'Tawa cooked Mysore style dosa' },
    { name: 'Cheese Mysore', category: 'Gravy Item', price: 200, isVeg: true, preparationTime: 18, description: 'Mysore dosa loaded with Amul cheese', tags: ['cheese'] },
    { name: 'Paneer Surma', category: 'Gravy Item', price: 200, isVeg: true, preparationTime: 20, description: 'Paneer stuffed surma style dosa', tags: ['paneer'] },
    { name: 'Paneer Tukda Mysore', category: 'Gravy Item', price: 200, isVeg: true, preparationTime: 20, description: 'Paneer pieces in Mysore style dosa', tags: ['paneer'] },
    { name: 'Cheese Paneer Surma', category: 'Gravy Item', price: 250, isVeg: true, preparationTime: 22, description: 'Paneer surma with extra cheese', tags: ['paneer', 'cheese'] },
    { name: 'Cheese Paneer Tukda Mysore', category: 'Gravy Item', price: 250, isVeg: true, preparationTime: 22, description: 'Paneer tukda Mysore with cheese', tags: ['paneer', 'cheese'] },
    { name: 'Cheese Surma', category: 'Gravy Item', price: 250, isVeg: true, preparationTime: 20, description: 'Surma style with Amul cheese', tags: ['cheese'] },
    { name: 'Cheese Gotalo', category: 'Gravy Item', price: 280, isVeg: true, preparationTime: 25, description: 'JK special Gotalo style with cheese', tags: ['chef-special', 'cheese'] },
    { name: 'Cheese Patra', category: 'Gravy Item', price: 300, isVeg: true, preparationTime: 25, description: 'Special patra style dosa with cheese', tags: ['chef-special', 'cheese'] },
    { name: 'JK Special Garlic Fry', category: 'Gravy Item', price: 330, isVeg: true, preparationTime: 30, description: 'Signature garlic fry dosa - JK special', tags: ['bestseller', 'chef-special', 'spicy'] },

    // === FANCY DOSA ===
    { name: 'Masala Dosa', category: 'Fancy Dosa', price: 100, isVeg: true, preparationTime: 15, description: 'Classic masala dosa with potato filling', tags: ['bestseller'] },
    { name: 'Separate Masala Dosa', category: 'Fancy Dosa', price: 120, isVeg: true, preparationTime: 15, description: 'Masala served separately' },
    { name: 'Cheese Masala Dosa', category: 'Fancy Dosa', price: 180, isVeg: true, preparationTime: 18, description: 'Masala dosa with Amul cheese', tags: ['cheese'] },
    { name: 'Palak Dosa', category: 'Fancy Dosa', price: 170, isVeg: true, preparationTime: 18, description: 'Spinach flavored dosa' },
    { name: 'Aloo Paneer Dosa', category: 'Fancy Dosa', price: 170, isVeg: true, preparationTime: 18, description: 'Potato and paneer stuffed dosa', tags: ['paneer'] },
    { name: 'Sweet Corn Dosa', category: 'Fancy Dosa', price: 170, isVeg: true, preparationTime: 15, description: 'Sweet corn flavored dosa', tags: ['sweet', 'kids'] },
    { name: 'Cheese Sweet Corn Dosa', category: 'Fancy Dosa', price: 200, isVeg: true, preparationTime: 18, description: 'Sweet corn dosa with cheese', tags: ['sweet', 'cheese'] },
    { name: 'Palak Paneer Dosa', category: 'Fancy Dosa', price: 190, isVeg: true, preparationTime: 20, description: 'Spinach and paneer stuffed dosa', tags: ['paneer'] },
    { name: 'Cheese Palak Dosa', category: 'Fancy Dosa', price: 200, isVeg: true, preparationTime: 20, description: 'Palak dosa with Amul cheese', tags: ['cheese'] },
    { name: 'Cheese Palak Paneer', category: 'Fancy Dosa', price: 220, isVeg: true, preparationTime: 22, description: 'Palak paneer with extra cheese', tags: ['paneer', 'cheese'] },
    { name: 'Cheese Aloo Palak', category: 'Fancy Dosa', price: 200, isVeg: true, preparationTime: 20, description: 'Aloo palak stuffed with cheese', tags: ['cheese'] },
    { name: 'Paneer Dosa', category: 'Fancy Dosa', price: 200, isVeg: true, preparationTime: 18, description: 'Fresh paneer stuffed dosa', tags: ['paneer', 'bestseller'] },
    { name: 'Cheese Paneer Dosa', category: 'Fancy Dosa', price: 220, isVeg: true, preparationTime: 20, description: 'Paneer dosa with Amul cheese', tags: ['paneer', 'cheese'] },
    { name: 'Jini Dosa', category: 'Fancy Dosa', price: 200, isVeg: true, preparationTime: 20, description: 'Mumbai style jini dosa', tags: ['bestseller', 'spicy'] },
    { name: 'Mix Dosa', category: 'Fancy Dosa', price: 220, isVeg: true, preparationTime: 22, description: 'Mixed filling dosa', tags: ['chef-special'] },
    { name: 'Pizza Dosa', category: 'Fancy Dosa', price: 260, isVeg: true, preparationTime: 25, description: 'Pizza flavored dosa with cheese and toppings', tags: ['cheese', 'bestseller', 'kids'] },

    // === BEVERAGES & EXTRAS ===
    { name: 'Special Salad', category: 'Extras', price: 20, isVeg: true, preparationTime: 5, description: 'Fresh garden salad' },
    { name: 'Cold Drinks', category: 'Extras', price: 20, isVeg: true, preparationTime: 2, description: 'Chilled cold drink' },
    { name: 'Buttermilk', category: 'Extras', price: 20, isVeg: true, preparationTime: 3, description: 'Fresh chilled buttermilk', tags: ['healthy'] },
    { name: 'Water', category: 'Extras', price: 20, isVeg: true, preparationTime: 1, description: 'Packaged water bottle' },
  ];

  const createdItems = await MenuItem.insertMany(
    menuItems.map((item, i) => ({ ...item, restaurantId: restaurant._id, sortOrder: i }))
  );
  console.log(`🍽️  ${createdItems.length} menu items created`);

  // ===================== SAMPLE ORDERS =====================
  const today = new Date();
  const orderStatuses = ['completed', 'completed', 'completed', 'preparing', 'pending', 'served'];

  const sampleOrders = [
    {
      tableNumber: 'T1', customerName: 'Rahul Sharma', customerPhone: '9898989898',
      items: [
        { name: 'JK Special Garlic Fry', price: 330, quantity: 1, category: 'Gravy Item' },
        { name: 'Buttermilk', price: 20, quantity: 2, category: 'Extras' }
      ],
      status: 'completed', subtotal: 370, totalAmount: 388.50, gstAmount: 18.50
    },
    {
      tableNumber: 'T2', customerName: 'Sneha Patel', customerPhone: '9909090909',
      items: [
        { name: 'Cheese Mysore', price: 200, quantity: 2, category: 'Gravy Item' },
        { name: 'Cold Drinks', price: 20, quantity: 2, category: 'Extras' }
      ],
      status: 'completed', subtotal: 440, totalAmount: 462, gstAmount: 22
    },
    {
      tableNumber: 'T3', customerName: 'Mohit Gupta', customerPhone: '9712345678',
      items: [
        { name: 'Pizza Dosa', price: 260, quantity: 1, category: 'Fancy Dosa' },
        { name: 'Cheese Paneer Dosa', price: 220, quantity: 1, category: 'Fancy Dosa' },
        { name: 'Special Salad', price: 20, quantity: 2, category: 'Extras' }
      ],
      status: 'completed', subtotal: 520, totalAmount: 546, gstAmount: 26
    },
    {
      tableNumber: 'T4', customerName: 'Anita Desai', customerPhone: '9823456789',
      items: [
        { name: 'Cheese Chili Garlic Nylon', price: 150, quantity: 2, category: 'Nylon Dosa' },
        { name: 'Jini Dosa', price: 200, quantity: 1, category: 'Fancy Dosa' }
      ],
      status: 'preparing', subtotal: 500, totalAmount: 525, gstAmount: 25
    },
    {
      tableNumber: 'T5', customerName: 'Vivek Joshi', customerPhone: '9845612378',
      items: [
        { name: 'Masala Dosa', price: 100, quantity: 3, category: 'Fancy Dosa' },
        { name: 'Buttermilk', price: 20, quantity: 3, category: 'Extras' }
      ],
      status: 'pending', subtotal: 360, totalAmount: 378, gstAmount: 18
    },
    {
      tableNumber: 'T6', customerName: 'Kiran Shah', customerPhone: '9967890123',
      items: [
        { name: 'Cheese Gotalo', price: 280, quantity: 1, category: 'Gravy Item' },
        { name: 'Cheese Patra', price: 300, quantity: 1, category: 'Gravy Item' }
      ],
      status: 'served', subtotal: 580, totalAmount: 609, gstAmount: 29
    },
  ];

  const createDate = (hoursAgo) => new Date(today.getTime() - hoursAgo * 60 * 60 * 1000);

  const orders = [];
  for (let i = 0; i < sampleOrders.length; i++) {
    const od = sampleOrders[i];
    const orderDate = createDate(i * 2);
    const order = await Order.create({
      restaurantId: restaurant._id,
      orderNumber: `ORD-${today.toISOString().slice(0,10).replace(/-/g,'')}-${1001 + i}`,
      tableNumber: od.tableNumber,
      customerName: od.customerName,
      customerPhone: od.customerPhone,
      items: od.items,
      status: od.status,
      subtotal: od.subtotal,
      gstAmount: od.gstAmount,
      totalAmount: od.totalAmount,
      createdBy: waiter1._id,
      isBilled: od.status === 'completed',
      createdAt: orderDate
    });
    orders.push(order);
  }

  // Bills for completed orders
  for (let i = 0; i < 3; i++) {
    await Bill.create({
      restaurantId: restaurant._id,
      orderId: orders[i]._id,
      billNumber: `BILL-${Date.now()}-${i}`,
      customerName: sampleOrders[i].customerName,
      customerPhone: sampleOrders[i].customerPhone,
      tableNumber: sampleOrders[i].tableNumber,
      items: sampleOrders[i].items.map(it => ({ name: it.name, quantity: it.quantity, price: it.price, amount: it.price * it.quantity })),
      subtotal: sampleOrders[i].subtotal,
      gstRate: 5,
      gstAmount: sampleOrders[i].gstAmount,
      discountAmount: 0,
      totalAmount: sampleOrders[i].totalAmount,
      paymentMethod: ['cash', 'upi', 'card'][i % 3],
      paymentStatus: 'paid',
      createdBy: waiter1._id
    });
  }
  console.log(`📦 ${orders.length} sample orders and bills created`);

  // ===================== EXPENSES =====================
  const expenses = [
    { category: 'ingredients', title: 'Rice & Urad Dal (50kg)', amount: 3200, vendor: 'Ganesh Kirana Store', description: 'Monthly dosa batter ingredients' },
    { category: 'ingredients', title: 'Amul Cheese (10kg)', amount: 4800, vendor: 'Amul Dairy', description: 'Cheese for cheese dosas' },
    { category: 'ingredients', title: 'Fresh Vegetables', amount: 1500, vendor: 'Local Sabzi Market', description: 'Onion, tomato, palak, corn' },
    { category: 'ingredients', title: 'Paneer (5kg)', amount: 1200, vendor: 'Mother Dairy', description: 'Fresh paneer for paneer dosas' },
    { category: 'utilities', title: 'Electricity Bill', amount: 8500, vendor: 'MGVCL', description: 'Monthly electricity - June 2025' },
    { category: 'utilities', title: 'Gas Cylinder (10 units)', amount: 9500, vendor: 'HP Gas', description: 'LPG cylinders for cooking' },
    { category: 'staff', title: 'Staff Salaries - June', amount: 45000, vendor: null, description: '4 staff members monthly salary' },
    { category: 'rent', title: 'Shop Rent - June', amount: 25000, vendor: 'Property Owner', description: 'Monthly shop rent' },
    { category: 'maintenance', title: 'Tawa Cleaning & Maintenance', amount: 800, vendor: 'Kitchen Care Services' },
    { category: 'marketing', title: 'Zomato/Swiggy Commission', amount: 2300, vendor: 'Zomato', description: 'Online platform commission fees' }
  ];

  await Expense.insertMany(expenses.map(e => ({
    ...e,
    restaurantId: restaurant._id,
    date: new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    createdBy: adminUser._id
  })));
  console.log(`💸 ${expenses.length} expenses created`);

  // ===================== WASTE LOGS =====================
  const wasteLogs = [
    { itemName: 'Masala Dosa', category: 'Fancy Dosa', quantity: 3, unit: 'portions', reason: 'unsold', estimatedCost: 300 },
    { itemName: 'Cheese Mysore', category: 'Gravy Item', quantity: 2, unit: 'portions', reason: 'returned', estimatedCost: 400, notes: 'Customer complained about spice level' },
    { itemName: 'Dosa Batter', category: 'Raw Material', quantity: 2, unit: 'kg', reason: 'expired', estimatedCost: 120 },
    { itemName: 'Palak Dosa', category: 'Fancy Dosa', quantity: 4, unit: 'portions', reason: 'unsold', estimatedCost: 680 },
    { itemName: 'Cheese Patra', category: 'Gravy Item', quantity: 1, unit: 'portions', reason: 'overcooked', estimatedCost: 300 },
    { itemName: 'Sweet Corn Dosa', category: 'Fancy Dosa', quantity: 2, unit: 'portions', reason: 'unsold', estimatedCost: 340 },
    { itemName: 'Pizza Dosa', category: 'Fancy Dosa', quantity: 3, unit: 'portions', reason: 'unsold', estimatedCost: 780 },
  ];

  await WasteLog.insertMany(wasteLogs.map((w, i) => ({
    ...w,
    restaurantId: restaurant._id,
    date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000),
    loggedBy: manager._id
  })));
  console.log(`🗑️  ${wasteLogs.length} waste logs created`);

  // ===================== LEFTOVER SALES (SaveBite) =====================
  const expiryTimes = [
    new Date(today.getTime() + 55 * 60 * 1000),  // 55 min → 30% off
    new Date(today.getTime() + 28 * 60 * 1000),  // 28 min → 50% off
    new Date(today.getTime() + 8 * 60 * 1000),   // 8 min → 70% off
    new Date(today.getTime() + 75 * 60 * 1000),  // 75 min → 30% off
  ];

  const leftoverItems = [
    { itemName: 'Masala Dosa', category: 'Fancy Dosa', originalPrice: 100, quantityAvailable: 5, expiryTime: expiryTimes[0], description: '5 freshly made masala dosas available!' },
    { itemName: 'Pizza Dosa', category: 'Fancy Dosa', originalPrice: 260, quantityAvailable: 3, expiryTime: expiryTimes[1], description: 'Special pizza dosa - grab while it lasts!' },
    { itemName: 'Cheese Mysore', category: 'Gravy Item', originalPrice: 200, quantityAvailable: 2, expiryTime: expiryTimes[2], description: 'Last 2 cheese mysore dosas!' },
    { itemName: 'Jini Dosa', category: 'Fancy Dosa', originalPrice: 200, quantityAvailable: 4, expiryTime: expiryTimes[3], description: 'Mumbai-style jini dosa available' },
  ];

  const discountRules = (expiry) => {
    const mins = (expiry - today) / (1000 * 60);
    if (mins <= 10) return 70;
    if (mins <= 30) return 50;
    return 30;
  };

  await LeftoverSale.insertMany(leftoverItems.map(item => {
    const disc = discountRules(item.expiryTime);
    return {
      ...item,
      restaurantId: restaurant._id,
      discountPercentage: disc,
      discountedPrice: item.originalPrice * (1 - disc / 100),
      isActive: true
    };
  }));
  console.log(`🍱 SaveBite leftover sales created`);

  // Update restaurant totals
  await Restaurant.findByIdAndUpdate(restaurant._id, { totalOrders: 6, totalRevenue: 2908.50 });

  console.log('\n✅ ===== SEED COMPLETE =====');
  console.log('🔑 Login Credentials:');
  console.log('   SuperAdmin: superadmin@restropulse.com / SuperAdmin@123');
  console.log('   RestaurantAdmin: owner@jkspicydosa.com / Admin@123');
  console.log('   Manager: manager@jkspicydosa.com / Staff@123');
  console.log('   Waiter: amit@jkspicydosa.com / Staff@123');
  console.log('🍽️  Restaurant: JK Spicy Dosa Cafe');
  console.log(`📋 Menu: ${createdItems.length} items across 5 categories`);
  console.log('===========================\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});