import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Divider,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Logout,
  Person,
  Dashboard,
  Notifications,
} from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { selectUser } from '../../store/slices/authSlice'
import { useLogout } from '../../hooks/useLogout'

const Header = ({ onMenuClick, sidebarOpen, isMobile }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const user = useSelector(selectUser)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { logout: performLogout } = useLogout()
  const theme = useTheme()

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    await performLogout({
      forceReload: false, // Set to true if you want to force page reload
      redirectTo: '/login'
    })
    setLogoutDialogOpen(false)
    handleMenuClose()
  }

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
    handleMenuClose()
  }

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false)
  }

  const handleProfile = () => {
    navigate('/profile')
    handleMenuClose()
  }

  const handleDashboard = () => {
    navigate(user?.role === 'Admin' ? '/admin/dashboard' : '/bills')
    handleMenuClose()
  }

  const isMenuOpen = Boolean(anchorEl)

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: '100%', // Always full width
        transition: theme.transitions.create(['background-color'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography 
          variant={isMobile ? "h6" : "h6"} 
          noWrap 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          {isMobile ? 'Billing' : 'Business Billing Software'}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications - Hidden on mobile */}
          {!isMobile && (
            <IconButton
              size="large"
              color="inherit"
              aria-label="notifications"
            >
              <Notifications />
            </IconButton>
          )}

          {/* User Info - Hidden on mobile */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box sx={{ textAlign: 'right', mr: 1 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="inherit" sx={{ opacity: 0.8 }}>
                  {user?.role}
                </Typography>
              </Box>
            </Box>
          )}
          
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar 
              sx={{ 
                width: { xs: 32, sm: 36 }, 
                height: { xs: 32, sm: 36 }, 
                bgcolor: 'secondary.main',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={isMenuOpen}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 200,
            }
          }}
        >
          <MenuItem disabled sx={{ opacity: 1 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ 
                  display: 'block',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.7rem'
                }}
              >
                {user?.role}
              </Typography>
            </Box>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleDashboard}>
            <Dashboard sx={{ mr: 2 }} />
            {user?.role === 'Admin' ? 'Admin Dashboard' : 'Bills Management'}
          </MenuItem>
          
          <MenuItem onClick={handleProfile}>
            <Person sx={{ mr: 2 }} />
            Profile
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleLogoutClick} sx={{ color: 'error.main' }}>
            <Logout sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">
          Confirm Logout
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            Are you sure you want to logout? This will clear all your cached data and you'll need to login again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained" autoFocus>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  )
}

export default Header