import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,    
  ListItemText,
  Toolbar,
  Divider,
  Box,
  Typography,
} from '@mui/material'
import {
  Dashboard,
  People,
  Receipt,
  AdminPanelSettings,
  Group,
  Assessment,
  Business,
  AttachMoney,
  AccountBalance,
  Person,
  Logout,
  Settings,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { selectUser } from '../../store/slices/authSlice'
import { useLogout } from '../../hooks/useLogout'

const Sidebar = ({ open, onClose, width, isMobile }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useSelector(selectUser)
  const { logout: performLogout } = useLogout()

  // Get current user with localStorage fallback
  let currentUser = user
  if (!currentUser) {
    try {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        currentUser = JSON.parse(storedUser)
      }
    } catch (error) {
      console.error('Error parsing stored user:', error)
    }
  }

  // User menu items (for regular users only)
  const userMenuItems = [
    { text: 'Bills Management', icon: <Receipt />, path: '/bills' },
    // { text: 'Client Details', icon: <People />, path: '/clients' },
    // { text: 'My Salary', icon: <AccountBalance />, path: '/salary' },
    // { text: 'My Expenses', icon: <AttachMoney />, path: '/expenses' },
    { text: 'My Profile', icon: <Person />, path: '/profile' },
  ]

  // Admin menu items (for admin users only)
  const adminMenuItems = [
    { text: 'Admin Dashboard', icon: <AdminPanelSettings />, path: '/admin/dashboard' },
    { text: 'Bills Management', icon: <Receipt />, path: '/bills' },
    { text: 'All Users', icon: <Group />, path: '/admin/users' },
    { text: 'All Clients', icon: <Business />, path: '/admin/clients' },
    { text: 'Item Management', icon: <Receipt />, path: '/admin/items' },
    { text: 'Reports', icon: <Assessment />, path: '/admin/reports' },
    { text: 'Company Settings', icon: <Settings />, path: '/admin/settings' },
    { text: 'My Profile', icon: <Person />, path: '/profile' },
  ]

  const handleNavigation = (path) => {
    navigate(path)
    // Always close sidebar when navigating, regardless of screen size
    onClose()
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout? This will clear all your cached data.')) {
      await performLogout({
        forceReload: false,
        redirectTo: '/login'
      })
      // Always close sidebar after logout
      onClose()
    }
  }

  const isActive = (path) => location.pathname === path

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Billing System
        </Typography>
      </Toolbar>
      
      <Divider />
      
      {/* Show different menus based on user role */}
      {currentUser?.role === 'Admin' ? (
        // Admin Panel - Only admin menus
        <>
          <Box sx={{ p: 2 }}>
            <Typography variant="overline" color="primary.main" fontWeight="bold">
              Admin Panel
            </Typography>
          </Box>
          <List>
            {adminMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      ) : (
        // User Panel - Only user menus
        <>
          
          <List>
            {userMenuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      {/* Logout Section - Always at bottom */}
      <Box sx={{ position: 'absolute', bottom: 0, width: '100%' }}>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                color: 'error.main',
                '&:hover': {
                  backgroundColor: 'error.light',
                  color: 'white',
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <Logout />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Box>
  )

  return (
    <Drawer
      variant="temporary" // Always overlay for clean responsive behavior
      open={open}
      onClose={onClose}
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          zIndex: (theme) => theme.zIndex.appBar - 1,
          mt: 8, // Account for header height
        },
      }}
      ModalProps={{
        keepMounted: true,
      }}
    >
      {drawer}
    </Drawer>
  )
}

export default Sidebar