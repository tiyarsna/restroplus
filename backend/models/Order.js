const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  notes: { type: String },
  category: { type: String },
  status: { type: String, enum: ['pending', 'ready', 'parcel', 'cancelled'], default: 'pending' }
});

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },
    orderNumber: { type: String, required: true },

    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    tableNumber: { type: String },

    customerName: { type: String },
    customerPhone: { type: String },

    items: { type: [orderItemSchema], required: true },

    status: {
      type: String,
      enum: ['draft', 'pending', 'preparing', 'served', 'completed', 'cancelled'],
      default: 'pending'
    },

    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'savebite'],
      default: 'dine-in'
    },

    subtotal: { type: Number, required: true },
    gstAmount: { type: Number, default: 0 },

    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    discountValue: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },

    totalAmount: { type: Number, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    notes: { type: String },
    isBilled: { type: Boolean, default: false },
    billedAt: { type: Date }
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, createdAt: -1 });

// ✅ Prevent overwrite error
module.exports =
  mongoose.models.Order || mongoose.model('Order', orderSchema);