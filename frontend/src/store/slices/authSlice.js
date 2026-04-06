// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../utils/api'

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('rp_token', data.token)
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error || 'Login failed') }
})

export const register = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', formData)
    localStorage.setItem('rp_token', data.token)
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error || 'Registration failed') }
})

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.error) }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, restaurant: null, token: localStorage.getItem('rp_token'), loading: false, error: null, isAuthenticated: false },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('rp_token')
      state.user = null; state.restaurant = null; state.token = null; state.isAuthenticated = false
    },
    clearError: (state) => { state.error = null }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.isAuthenticated = true; state.user = action.payload.user; state.restaurant = action.payload.restaurant; state.token = action.payload.token })
      .addCase(login.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null })
      .addCase(register.fulfilled, (state, action) => { state.loading = false; state.isAuthenticated = true; state.user = action.payload.user; state.restaurant = action.payload.restaurant; state.token = action.payload.token })
      .addCase(register.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(loadUser.fulfilled, (state, action) => { state.isAuthenticated = true; state.user = action.payload.user; state.restaurant = action.payload.restaurant })
      .addCase(loadUser.rejected, (state) => { state.isAuthenticated = false; state.user = null; localStorage.removeItem('rp_token') })
  }
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
