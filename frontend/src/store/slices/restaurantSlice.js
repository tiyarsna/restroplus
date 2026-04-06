// restaurantSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchRestaurant = createAsyncThunk('restaurant/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/restaurants/me')
    return data.restaurant
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const updateSettings = createAsyncThunk('restaurant/updateSettings', async (settings, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/restaurants/settings', { settings })
    return data.restaurant
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

const restaurantSlice = createSlice({
  name: 'restaurant',
  initialState: { data: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRestaurant.fulfilled, (state, action) => { state.data = action.payload })
      .addCase(updateSettings.fulfilled, (state, action) => { state.data = action.payload })
  }
})

export default restaurantSlice.reducer
