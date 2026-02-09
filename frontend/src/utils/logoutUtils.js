/**
 * Comprehensive logout utility functions
 * Handles clearing all cached data, localStorage, sessionStorage, and Redux state
 */

import { logout } from '../store/slices/authSlice'
import { resetUI } from '../store/slices/uiSlice'
import { apiSlice } from '../store/api/apiSlice'

/**
 * Performs comprehensive logout cleanup
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} navigate - React Router navigate function
 * @param {Object} options - Additional options
 * @param {boolean} options.forceReload - Whether to force page reload after logout
 * @param {string} options.redirectTo - Where to redirect after logout (default: '/login')
 */
export const performComprehensiveLogout = async (dispatch, navigate, options = {}) => {
  const { forceReload = false, redirectTo = '/login' } = options

  try {
    console.log('Starting comprehensive logout cleanup...')

    // 1. Clear RTK Query cache
    dispatch(apiSlice.util.resetApiState())
    console.log('✓ RTK Query cache cleared')

    // 2. Reset UI state
    dispatch(resetUI())
    console.log('✓ UI state reset')

    // 3. Clear auth state and localStorage/sessionStorage
    dispatch(logout())
    console.log('✓ Auth state cleared and localStorage/sessionStorage cleared')

    // 4. Clear browser caches if possible
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('✓ Browser caches cleared')
      }
    } catch (error) {
      console.log('⚠ Cache clearing not supported or failed:', error)
    }

    // 5. Clear IndexedDB data if present
    try {
      if ('indexedDB' in window && indexedDB.databases) {
        const databases = await indexedDB.databases()
        await Promise.all(
          databases.map(db => {
            if (db.name && db.name.includes('billing') || db.name.includes('app')) {
              const deleteReq = indexedDB.deleteDatabase(db.name)
              return new Promise((resolve) => {
                deleteReq.onsuccess = () => {
                  console.log(`✓ IndexedDB ${db.name} cleared`)
                  resolve()
                }
                deleteReq.onerror = () => {
                  console.log(`⚠ Failed to clear IndexedDB ${db.name}`)
                  resolve()
                }
              })
            }
          })
        )
      }
    } catch (error) {
      console.log('⚠ IndexedDB clearing not supported or failed:', error)
    }

    // 6. Clear any remaining application-specific data
    try {
      // Clear any cookies that might be set (if your app uses them)
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      })
      console.log('✓ Cookies cleared')
    } catch (error) {
      console.log('⚠ Cookie clearing failed:', error)
    }

    // 7. Force garbage collection if available (development only)
    if (process.env.NODE_ENV === 'development' && window.gc) {
      window.gc()
      console.log('✓ Garbage collection triggered')
    }

    console.log('✅ Comprehensive logout cleanup completed')

    // 8. Navigate with delay to ensure cleanup completion
    setTimeout(() => {
      if (forceReload) {
        window.location.href = redirectTo
      } else {
        navigate(redirectTo)
      }
    }, 100)

  } catch (error) {
    console.error('❌ Error during logout cleanup:', error)
    // Fallback: still navigate even if cleanup fails
    if (forceReload) {
      window.location.href = redirectTo
    } else {
      navigate(redirectTo)
    }
  }
}

/**
 * Quick logout for emergency situations
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} navigate - React Router navigate function
 */
export const performQuickLogout = (dispatch, navigate) => {
  dispatch(logout())
  localStorage.clear()
  sessionStorage.clear()
  navigate('/login')
}

/**
 * Check if user data is completely cleared
 * @returns {boolean} - True if all user data appears to be cleared
 */
export const isUserDataCleared = () => {
  const hasToken = !!localStorage.getItem('token')
  const hasUser = !!localStorage.getItem('user')
  const hasRefreshToken = !!localStorage.getItem('refreshToken')
  
  return !hasToken && !hasUser && !hasRefreshToken
}