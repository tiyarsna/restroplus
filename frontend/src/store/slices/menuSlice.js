import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const fetchMenu = createAsyncThunk('menu/fetchMenu', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/menu')
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const createMenuItem = createAsyncThunk('menu/createMenuItem', async (item, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/menu', item)
    return data.item
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const updateMenuItem = createAsyncThunk('menu/updateMenuItem', async ({ id, ...item }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/menu/${id}`, item)
    return data.item
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const deleteMenuItem = createAsyncThunk('menu/deleteMenuItem', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/menu/${id}`)
    return id
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

export const toggleAvailability = createAsyncThunk('menu/toggleAvailability', async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/menu/${id}/toggle`)
    return data.item
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

const menuSlice = createSlice({
  name: 'menu',
  initialState: { items: [], grouped: {}, categories: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => { state.loading = true })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.items
        state.grouped = action.payload.grouped
        state.categories = Object.keys(action.payload.grouped)
      })
      .addCase(fetchMenu.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(createMenuItem.fulfilled, (state, action) => {
        state.items.push(action.payload)
        if (!state.grouped[action.payload.category]) state.grouped[action.payload.category] = []
        state.grouped[action.payload.category].push(action.payload)
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i._id === action.payload._id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter(i => i._id !== action.payload)
      })
      .addCase(toggleAvailability.fulfilled, (state, action) => {
        const idx = state.items.findIndex(i => i._id === action.payload._id)
        if (idx !== -1) state.items[idx] = action.payload
      })
  }
})

export default menuSlice.reducer
