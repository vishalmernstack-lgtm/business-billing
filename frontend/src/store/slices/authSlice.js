import { createSlice } from '@reduxjs/toolkit'

// Helper functions for localStorage
const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  } catch (error) {
    console.error('Error parsing stored user:', error)
    localStorage.removeItem('user')
    return null
  }
}

const storeUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user))
  } catch (error) {
    console.error('Error storing user:', error)
  }
}

const removeStoredUser = () => {
  localStorage.removeItem('user')
}

const initialState = {
  user: getStoredUser(), // Load user from localStorage on app start
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.error = null
      
      // Persist tokens and user data
      localStorage.setItem('token', action.payload.accessToken)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
      storeUser(action.payload.user)
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.refreshToken = null
      state.error = action.payload
      
      // Clear tokens and user data
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      removeStoredUser()
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.refreshToken = null
      state.error = null
      
      // Clear all localStorage data
      localStorage.clear()
      
      // Clear all sessionStorage data
      sessionStorage.clear()
      
      // Clear specific auth-related items (redundant but explicit)
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      removeStoredUser()
      
      // Clear any other potential cached data
      try {
        // Clear any cached form data or temporary data
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key))
      } catch (error) {
        console.error('Error clearing localStorage:', error)
      }
    },
    clearError: (state) => {
      state.error = null
    },
    updateProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      storeUser(state.user) // Store updated user data
    },
    updateUserProfile: (state, action) => {
      state.user = action.payload
      storeUser(action.payload)
    },
    refreshTokenSuccess: (state, action) => {
      state.token = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      if (action.payload.user) {
        state.user = action.payload.user
        storeUser(action.payload.user)
      }
      
      // Update tokens
      localStorage.setItem('token', action.payload.accessToken)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
    },
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  updateProfile,
  updateUserProfile,
  refreshTokenSuccess,
} = authSlice.actions

export default authSlice.reducer

// Selectors
export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error