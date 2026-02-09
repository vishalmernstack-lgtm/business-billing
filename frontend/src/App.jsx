import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Box, CircularProgress, Typography } from '@mui/material'

import { selectIsAuthenticated, selectUser } from './store/slices/authSlice'
import { useGetProfileQuery } from './store/api/apiSlice'
import { loginSuccess } from './store/slices/authSlice'

// Components
import Layout from './components/layout/Layout'
import AuthGuard from './components/guards/AuthGuard'
import RoleGuard from './components/guards/RoleGuard'
import ErrorBoundary from './components/common/ErrorBoundary'

// Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ClientsPage from './pages/clients/ClientsPage'
import ClientFormPage from './pages/clients/ClientFormPage'
import BillsPage from './pages/bills/BillsPage'
import BillFormPage from './pages/bills/BillFormPage'
import BillViewPage from './pages/bills/BillViewPage'
import SalaryPage from './pages/salary/SalaryPage'
import ExpensesPage from './pages/expenses/ExpensesPage'
import ExpenseFormPage from './pages/expenses/ExpenseFormPage'
import ExpenseViewPage from './pages/expenses/ExpenseViewPage'
import ProfilePage from './pages/profile/ProfilePage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import UsersPage from './pages/admin/UsersPage'
import AdminClientsPage from './pages/admin/AdminClientsPage'
import ItemManagementPage from './pages/admin/ItemManagementPage'
import ReportsPage from './pages/admin/ReportsPage'
import CompanySettingsPage from './pages/admin/CompanySettingsPage'

function App() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const user = useSelector(selectUser)

  // Get current user with localStorage fallback for immediate access
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

  // Get user profile if authenticated but no user data in Redux
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated || !!user,
  })

  // Determine if we're still loading user data (only if no stored user available)
  const isLoadingUser = isAuthenticated && !currentUser && profileLoading

  useEffect(() => {
    if (profileData?.data && !user) {
      dispatch(loginSuccess({
        user: profileData.data,
        accessToken: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken'),
      }))
    }
  }, [profileData, user, dispatch])

  // Helper function to get default route based on user role
  const getDefaultRoute = () => {
    if (!currentUser) {
      return '/bills' // Final fallback
    }
    return currentUser.role === 'Admin' ? '/admin/dashboard' : '/bills'
  }

  // Show loading while user data is being fetched
  if (isLoadingUser) {
    return (
      <ErrorBoundary>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: 'grey.50'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        </Box>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRoute()} replace />
              ) : <LoginPage />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? (
                <Navigate to={getDefaultRoute()} replace />
              ) : <RegisterPage />
            } 
          />

          {/* Protected routes */}
          <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<Navigate to={getDefaultRoute()} replace />} />
            
            {/* User routes */}
            <Route path="bills" element={<BillsPage />} />
            <Route path="bills/new" element={<BillFormPage />} />
            <Route path="bills/:id" element={<BillViewPage />} />
            <Route path="bills/:id/edit" element={<BillFormPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/new" element={<ClientFormPage />} />
            <Route path="clients/:id/edit" element={<ClientFormPage />} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="expenses/new" element={<ExpenseFormPage />} />
            <Route path="expenses/:id" element={<ExpenseViewPage />} />
            <Route path="expenses/:id/edit" element={<ExpenseFormPage />} />
            <Route path="profile" element={<ProfilePage />} />

            {/* Admin routes */}
            <Route path="admin" element={<RoleGuard allowedRoles={['Admin']} />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="clients" element={<AdminClientsPage />} />
              <Route path="items" element={<ItemManagementPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<CompanySettingsPage />} />
            </Route>
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </Box>
    </ErrorBoundary>
  )
}

export default App