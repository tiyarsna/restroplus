import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import menuReducer from './slices/menuSlice'
import orderReducer from './slices/orderSlice'
import restaurantReducer from './slices/restaurantSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menu: menuReducer,
    orders: orderReducer,
    restaurant: restaurantReducer,
    ui: uiReducer
  }
})
