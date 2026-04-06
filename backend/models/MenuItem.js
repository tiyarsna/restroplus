const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: null },
  isVeg: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  preparationTime: { type: Number, default: 10 },
  tags: [{ type: String }],
  allergens: [{ type: String }],
  calories: { type: Number },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

menuItemSchema.index({ restaurantId: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
