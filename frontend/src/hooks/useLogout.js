import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { performComprehensiveLogout, performQuickLogout } from '../utils/logoutUtils'

/**
 * Custom hook for logout functionality
 * Provides consistent logout behavior across the application
 */
export const useLogout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  /**
   * Performs comprehensive logout with full cleanup
   * @param {Object} options - Logout options
   * @param {boolean} options.forceReload - Whether to force page reload
   * @param {string} options.redirectTo - Where to redirect after logout
   */
  const logout = async (options = {}) => {
    await performComprehensiveLogout(dispatch, navigate, options)
  }

  /**
   * Performs quick logout for emergency situations
   */
  const quickLogout = () => {
    performQuickLogout(dispatch, navigate)
  }

  return {
    logout,
    quickLogout
  }
}

export default useLogout