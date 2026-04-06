const express = require('express')
const router = express.Router()

const { protect, authorize } = require('../middleware/auth')
const Restaurant = require('../models/Restaurant')
const User = require('../models/User')
const bcrypt = require('bcryptjs')

// 🔐 Protect all routes
router.use(protect)


// ==============================
// 🏪 GET MY RESTAURANT
// ==============================
router.get('/me', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.user.restaurantId)

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    res.json({ success: true, restaurant })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})


// ==============================
// ⚙️ UPDATE RESTAURANT SETTINGS
// ==============================
router.put('/settings', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.user.restaurantId,
      {
        name: req.body.name,
        email: req.body.email,
        settings: req.body.settings
      },
      { new: true }
    )

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' })
    }

    res.json({ success: true, restaurant })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})


// ==============================
// 👤 UPDATE OWNER PROFILE
// ==============================
router.put('/profile', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    const { name, email } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (name) user.name = name
    if (email) user.email = email

    await user.save()

    res.json({ success: true, user })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})


// ==============================
// 🔐 CHANGE PASSWORD
// ==============================
router.put('/change-password', authorize('RestaurantAdmin'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password incorrect' })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router