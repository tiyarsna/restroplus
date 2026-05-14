import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

// ================= FETCH ALL ORDERS =================
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/orders', { params })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message)
    }
  }
)

// ================= FETCH LIVE ORDERS =================
export const fetchLiveOrders = createAsyncThunk(
  'orders/fetchLiveOrders',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/orders/live')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message)
    }
  }
)

// ================= CREATE ORDER =================
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/orders', orderData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message)
    }
  }
)

// ================= UPDATE ORDER STATUS =================
export const updateOrderStatus = createAsyncThunk(
  'orders/updateOrderStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/orders/${id}`, { status })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message)
    }
  }
)

// ================= UPDATE ORDER ITEM STATUS =================
export const updateOrderItemStatus = createAsyncThunk(
  'orders/updateOrderItemStatus',
  async ({ orderId, itemId, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/orders/${orderId}/items/${itemId}`, { status })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message)
    }
  }
)

// ================= FETCH ANALYTICS =================
export const fetchAnalytics = createAsyncThunk(
  'orders/fetchAnalytics',
  async (period = '7d', { rejectWithValue }) => {
    try {
      const { data } = await api.get('/orders/analytics', {
        params: { period }
      })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || err.message)
    }
  }
)

// ================= SLICE =================
const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    liveOrders: [],
    analytics: {},
    totals: {},
    loading: false,
    liveLoading: false,
    error: null,
    total: 0
  },
  reducers: {
    addLiveOrder: (state, action) => {
      const exists = state.liveOrders.find(
        o => o._id === action.payload._id
      )
      if (!exists) state.liveOrders.unshift(action.payload)
    },

    updateLiveOrder: (state, action) => {
      const idx = state.liveOrders.findIndex(
        o => o._id === action.payload._id
      )

      if (idx !== -1) {
        if (['completed', 'cancelled'].includes(action.payload.status)) {
          state.liveOrders.splice(idx, 1)
        } else {
          state.liveOrders[idx] = action.payload
        }
      }

      const oidx = state.orders.findIndex(
        o => o._id === action.payload._id
      )
      if (oidx !== -1) state.orders[oidx] = action.payload
    }
  },

  extraReducers: (builder) => {
    builder
      // FETCH ORDERS
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false
        state.orders = action.payload
        state.total = action.payload?.length || 0
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // LIVE ORDERS
      .addCase(fetchLiveOrders.pending, (state) => {
        state.liveLoading = true
      })
      .addCase(fetchLiveOrders.fulfilled, (state, action) => {
        state.liveLoading = false
        state.liveOrders = action.payload
      })
      .addCase(fetchLiveOrders.rejected, (state, action) => {
        state.liveLoading = false
        state.error = action.payload
      })

      // CREATE ORDER
      .addCase(createOrder.fulfilled, (state, action) => {
        const payload = action.payload || {};
        const newOrder = payload.order ? payload.order : payload; // Handle { order, merged } OR just order
        
        if (payload.merged) {
          const idx = state.liveOrders.findIndex(o => o._id === newOrder._id)
          if (idx !== -1) state.liveOrders[idx] = newOrder
        } else {
          state.liveOrders.unshift(newOrder)
        }
      })

      // UPDATE STATUS
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const idx = state.liveOrders.findIndex(
          o => o._id === action.payload._id
        )

        if (idx !== -1) {
          if (['completed', 'cancelled'].includes(action.payload.status)) {
            state.liveOrders.splice(idx, 1)
          } else {
            state.liveOrders[idx] = action.payload
          }
        }
      })

      // UPDATE ITEM STATUS
      .addCase(updateOrderItemStatus.fulfilled, (state, action) => {
        const idx = state.liveOrders.findIndex(
          o => o._id === action.payload._id
        )
        if (idx !== -1) {
          state.liveOrders[idx] = action.payload
        }
      })

      // ANALYTICS
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload.analytics || {}
        state.totals = action.payload.totals || {}
      })
  }
})

export const { addLiveOrder, updateLiveOrder } = orderSlice.actions
export default orderSlice.reducer