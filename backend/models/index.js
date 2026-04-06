const mongoose = require('mongoose');

// Bill Model
const billSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  billNumber: { type: String, required: true },
  customerName: { type: String },
  customerPhone: { type: String },
  tableNumber: { type: String },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    amount: Number
  }],
  subtotal: { type: Number, required: true },
  gstRate: { type: Number, default: 5 },
  gstAmount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'] },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'other'], default: 'cash' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'partial'], default: 'paid' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Table Model
const tableSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  tableNumber: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  status: { type: String, enum: ['available', 'occupied', 'reserved', 'cleaning'], default: 'available' },
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  floor: { type: String, default: 'Ground' },
  position: { x: Number, y: Number }
}, { timestamps: true });

// Expense Model
const expenseSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  category: {
    type: String,
    enum: ['ingredients', 'utilities', 'staff', 'equipment', 'maintenance', 'marketing', 'rent', 'other'],
    required: true
  },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String },
  vendor: { type: String },
  receipt: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// WasteLog Model
const wasteLogSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  itemName: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'portions' },
  reason: {
    type: String,
    enum: ['overcooked', 'unsold', 'returned', 'expired', 'damaged', 'other'],
    required: true
  },
  estimatedCost: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
  notes: { type: String },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// LeftoverSale Model
const leftoverSaleSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  itemName: { type: String, required: true },
  category: { type: String },
  originalPrice: { type: Number, required: true },
  discountPercentage: { type: Number, required: true },
  discountedPrice: { type: Number, required: true },
  quantityAvailable: { type: Number, required: true },
  quantitySold: { type: Number, default: 0 },
  expiryTime: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  image: { type: String },
  description: { type: String }
}, { timestamps: true });

// Subscription Model
const subscriptionSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  plan: { type: String, enum: ['FREE', 'BASIC', 'PRO'], required: true },
  price: { type: Number, default: 0 },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  features: [{ type: String }],
  paymentMethod: { type: String },
  transactionId: { type: String }
}, { timestamps: true });

module.exports = {
  Bill: mongoose.model('Bill', billSchema),
  Table: mongoose.model('Table', tableSchema),
  Expense: mongoose.model('Expense', expenseSchema),
  WasteLog: mongoose.model('WasteLog', wasteLogSchema),
  LeftoverSale: mongoose.model('LeftoverSale', leftoverSaleSchema),
  Subscription: mongoose.model('Subscription', subscriptionSchema)
};
