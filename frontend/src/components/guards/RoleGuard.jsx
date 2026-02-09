import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import { Box, Typography, Paper, CircularProgress } from '@mui/material'
import { Lock } from '@mui/icons-material'
import { selectUser, selectIsAuthenticated } from '../../store/slices/authSlice'
import { useGetProfileQuery } from '../../store/api/apiSlice'

const RoleGuard = ({ allowedRoles, children }) => {
  const user = useSelector(selectUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  
  // Get user profile if authenticated but no user data
  const { isLoading: profileLoading } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated || !!user,
  })

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Try to get user from localStorage as fallback if Redux user is not available
  let currentUser = user
  if (!currentUser && isAuthenticated) {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        currentUser = JSON.parse(storedUser)
      }
    } catch (error) {
      console.error('Error parsing stored user:', error)
    }
  }

  // If authenticated but user data is loading and no stored user, show loading
  if (!currentUser && profileLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // If no user data and not loading, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // Check role permissions
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 400,
          }}
        >
          <Lock
            sx={{
              fontSize: 64,
              color: 'warning.main',
              mb: 2,
            }}
          />
          <Typography variant="h5" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </Typography>
        </Paper>
      </Box>
    )
  }

  return children || <Outlet />
}

export default RoleGuard