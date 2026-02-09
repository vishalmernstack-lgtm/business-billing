import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  loading: false,
  notifications: [],
  theme: 'light',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      })
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      )
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    },
    resetUI: (state) => {
      // Reset UI state to initial values on logout
      state.sidebarOpen = true
      state.loading = false
      state.notifications = []
      // Keep theme preference
    },
  },
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setTheme,
  resetUI,
} = uiSlice.actions

export default uiSlice.reducer

// Selectors
export const selectUI = (state) => state.ui
export const selectSidebarOpen = (state) => state.ui.sidebarOpen
export const selectLoading = (state) => state.ui.loading
export const selectNotifications = (state) => state.ui.notifications
export const selectTheme = (state) => state.ui.theme