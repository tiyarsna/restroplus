import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, activeModal: null, theme: 'dark' },
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload },
    openModal: (state, action) => { state.activeModal = action.payload },
    closeModal: (state) => { state.activeModal = null }
  }
})

export const { toggleSidebar, setSidebarOpen, openModal, closeModal } = uiSlice.actions
export default uiSlice.reducer
