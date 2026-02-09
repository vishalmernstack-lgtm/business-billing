import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  TrendingUp,
  People,
  Receipt,
  AttachMoney,
  Business,
  Assessment,
  Inventory,
  ShoppingCart,
  Category,
  TrendingDown,
} from '@mui/icons-material'

import { useGetDashboardQuery, useGetItemsQuery, useGetBillsQuery } from '../../store/api/apiSlice'

const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography color="textSecondary" gutterBottom variant="overline">
            {title}
          </Typography>
          <Typography variant="h4" component="div" gutterBottom>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.main`,
            borderRadius: '50%',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.cloneElement(icon, { sx: { color: 'white', fontSize: 32 } })}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const AdminDashboardPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const { data, isLoading, error } = useGetDashboardQuery()
  const { data: itemsData } = useGetItemsQuery()
  const { data: billsData } = useGetBillsQuery({
    page: 1,
    limit: 1000,
  })

  // Calculate item sales from bills
  const itemSalesData = React.useMemo(() => {
    if (!billsData?.data?.bills) return {}
    
    const sales = {}
    billsData.data.bills.forEach(bill => {
      if (bill.items) {
        bill.items.forEach(item => {
          const itemName = item.itemName
          if (!sales[itemName]) {
            sales[itemName] = {
              totalQuantitySold: 0,
              totalRevenue: 0,
              totalOrders: 0
            }
          }
          sales[itemName].totalQuantitySold += item.quantity
          sales[itemName].totalRevenue += item.totalPrice
          sales[itemName].totalOrders += 1
        })
      }
    })
    
    return sales
  }, [billsData])

  // Process items with sales data
  const processedItems = React.useMemo(() => {
    if (!itemsData?.data) return []
    
    return itemsData.data.map(item => {
      const salesData = itemSalesData[item.name] || {
        totalQuantitySold: 0,
        totalRevenue: 0,
        totalOrders: 0
      }
      
      // Simple Due Stock calculation: Current Stock - Qty Sold = Remaining Stock
      const currentStock = item.quantity
      const totalSold = salesData.totalQuantitySold
      const dueStock = Math.max(0, currentStock - totalSold) // Remaining stock after sales
      
      return {
        ...item,
        ...salesData,
        dueStock,
        stockStatus: currentStock === 0 ? 'Out of Stock' : 
                    currentStock <= 5 ? 'Low' : 
                    currentStock <= 20 ? 'Medium' : 'High'
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue) // Sort by revenue descending
  }, [itemsData, itemSalesData])

  // Calculate inventory statistics
  const inventoryStats = React.useMemo(() => {
    const totalItems = processedItems.length
    const totalStock = processedItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalRevenue = processedItems.reduce((sum, item) => sum + item.totalRevenue, 0)
    const lowStockItems = processedItems.filter(item => item.stockStatus === 'Low').length
    const outOfStockItems = processedItems.filter(item => item.quantity === 0).length
    
    return {
      totalItems,
      totalStock,
      totalRevenue,
      lowStockItems,
      outOfStockItems
    }
  }, [processedItems])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'High': return 'success'
      case 'Medium': return 'warning'
      case 'Low': return 'error'
      default: return 'default'
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data. Please try again.
      </Alert>
    )
  }

  const dashboardData = data?.data || {}
  const { overview = {}, userSales = [], recentBills = [] } = dashboardData

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive overview of your business performance
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Paid Amount"
            value={`₹${(overview.paidAmount || 0).toLocaleString()}`}
            icon={<AttachMoney />}
            color="success"
            subtitle="From paid bills"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Amount"
            value={`₹${(overview.pendingAmount || 0).toLocaleString()}`}
            icon={<AttachMoney />}
            color="warning"
            subtitle="Awaiting payment"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bills"
            value={overview.totalBills || 0}
            icon={<Receipt />}
            color="primary"
            subtitle="Bills created"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={overview.totalUsers || 0}
            icon={<People />}
            color="info"
            subtitle="Registered users"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left Column - User Performance and Item Sales */}
        <Grid item xs={12} lg={8}>
          {/* User Performance */}
          <Paper sx={{ p: 3, height: 'fit-content', mb: 0 }}>
            <Typography variant="h6" gutterBottom>
              User Performance
            </Typography>
            
            {userSales.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Phone Number</TableCell>
                      <TableCell align="right">Bills Created</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                      <TableCell align="right">Total Receive Amount</TableCell>
                      <TableCell align="right">Total Pending Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userSales.map((user, index) => (
                      <TableRow key={user.userId} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                              {user.userName.charAt(0)}
                            </Avatar>
                            <Typography variant="subtitle2">
                              {user.userName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {user.userPhone}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {user.billCount}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            ₹{user.totalSales.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            ₹{user.totalReceiveAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="warning.main">
                            ₹{user.totalPendingAmount.toLocaleString()}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No users found
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Item Sales & Stock Overview - directly below with no gap */}
          <Paper sx={{ p: 3, height: 'fit-content', mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Item Sales & Stock Overview
            </Typography>
            
            {processedItems.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="right">Current Stock</TableCell>
                      <TableCell align="right">Due Stock</TableCell>
                      <TableCell>Stock Status</TableCell>
                      <TableCell align="right">Qty Sold</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedItems.slice(0, 10).map((item) => {
                      return (
                        <TableRow 
                          key={item._id} 
                          hover
                          sx={{
                            bgcolor: item.quantity === 0 ? 'error.light' : 
                                   item.stockStatus === 'Low' ? 'warning.light' : 'inherit'
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ShoppingCart sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="subtitle2" fontWeight="bold">
                                {item.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="bold"
                              color={item.quantity === 0 ? 'error.main' : 'text.primary'}
                            >
                              {item.quantity}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="bold"
                              color={item.dueStock < item.quantity * 0.2 ? 'warning.main' : 'success.main'}
                              title={`Current Stock: ${item.quantity}, Sold: ${item.totalQuantitySold}, Remaining: ${item.dueStock}`}
                            >
                              {item.dueStock}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              remaining
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.stockStatus} 
                              color={item.quantity === 0 ? 'error' : getStockStatusColor(item.stockStatus)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="primary">
                              {item.totalQuantitySold}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                              {formatCurrency(item.totalRevenue)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Inventory sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No inventory data available yet
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Recent Bills */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Recent Bills
            </Typography>
            
            {recentBills.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recentBills.slice(0, 8).map((bill) => {
                  const isPaid = bill.status === 'Paid'
                  const paymentStatus = isPaid ? 'Paid' : 'Unpaid'
                  const billDate = new Date(bill.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                  
                  return (
                    <Box
                      key={bill._id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        minHeight: '60px',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        background: isPaid 
                          ? 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)' 
                          : 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          background: isPaid 
                            ? 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)' 
                            : 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
                        },
                        transition: 'all 0.3s ease-in-out'
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                          {bill.billNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            {bill.clientDetails?.clientName || 'Unknown Client'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            by {bill.createdBy?.firstName} {bill.createdBy?.lastName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                            {billDate}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right', ml: 2 }}>
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
                          ₹{bill.totalAmount.toLocaleString()}
                        </Typography>
                        <Chip
                          label={paymentStatus}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 'bold',
                            border: '1px solid rgba(255,255,255,0.3)'
                          }}
                        />
                      </Box>
                    </Box>
                  )
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Receipt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No recent bills
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default AdminDashboardPage