const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  ownerName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  location: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  gstNumber: { type: String, default: null },
  logo: { type: String, default: null },
  cuisine: [{ type: String }],
  settings: {
    gstEnabled: { type: Boolean, default: true },
    gstRate: { type: Number, default: 5 },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '23:00' },
    savebiteEnabled: { type: Boolean, default: false },
    autoSavebiteDiscount: { type: Boolean, default: true }
  },
  subscription: {
    plan: { type: String, enum: ['FREE', 'BASIC', 'PRO'], default: 'FREE' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  isActive: { type: Boolean, default: true },
  totalRevenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
