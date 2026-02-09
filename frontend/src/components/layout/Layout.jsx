import React from 'react'
import { Outlet } from 'react-router-dom'
import { Box, useMediaQuery, useTheme } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'

import { selectSidebarOpen, setSidebarOpen } from '../../store/slices/uiSlice'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const sidebarOpen = useSelector(selectSidebarOpen)
  const dispatch = useDispatch()

  const handleSidebarToggle = () => {
    dispatch(setSidebarOpen(!sidebarOpen))
  }

  const handleSidebarClose = () => {
    dispatch(setSidebarOpen(false))
  }

  const sidebarWidth = 280

  return (
    <Box sx={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      <Header 
        onMenuClick={handleSidebarToggle}
        sidebarOpen={sidebarOpen}
        isMobile={isMobile}
      />
      
      <Sidebar
        open={sidebarOpen}
        onClose={handleSidebarClose}
        width={sidebarWidth}
        isMobile={isMobile}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: '100%', // Always full width - no margins!
          p: { xs: 2, sm: 3 },
          mt: 8, // Account for header height
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.grey[50],
          overflow: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout