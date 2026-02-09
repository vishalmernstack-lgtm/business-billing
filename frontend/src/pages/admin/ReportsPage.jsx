import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Assessment,
  BarChart,
  GetApp,
  AttachMoney,
  TrendingUp,
  Receipt,
} from '@mui/icons-material'

import { useGetReportsQuery, useGetUsersQuery } from '../../store/api/apiSlice'

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

const ReportsPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [selectedUser, setSelectedUser] = useState('')
  
  // Fetch users for dropdown
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({
    page: 1,
    limit: 1000,
  })

  const { data, isLoading, error, refetch } = useGetReportsQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    userId: selectedUser,
  })

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerateReport = () => {
    refetch()
  }

  const handleExportReport = () => {
    // Generate CSV from monthly sales data
    const reportData = data?.data || {}
    const { monthlySales = [] } = reportData
    
    if (monthlySales.length === 0) {
      alert('No data to export')
      return
    }

    // Create CSV content
    const headers = ['Month', 'Bills', 'Revenue', 'Average Bill']
    const rows = monthlySales.map(month => [
      new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      }),
      month.billCount,
      month.totalSales,
      Math.round(month.totalSales / month.billCount)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `monthly_sales_report_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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
        Failed to load reports. Please try again.
      </Alert>
    )
  }

  const reportData = data?.data || {}
  const { monthlySales = [] } = reportData
  const users = usersData?.data?.users || []

  // Calculate totals
  const totalRevenue = monthlySales.reduce((sum, month) => sum + month.totalSales, 0)
  const totalBills = monthlySales.reduce((sum, month) => sum + month.billCount, 0)
  const avgBillValue = totalBills > 0 ? totalRevenue / totalBills : 0

  // Get selected user name
  const selectedUserName = selectedUser 
    ? users.find(u => u._id === selectedUser)?.firstName + ' ' + users.find(u => u._id === selectedUser)?.lastName
    : 'All Users'

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Reports & Analytics
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive business insights and performance analytics
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Report Filters
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by User</InputLabel>
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                label="Filter by User"
              >
                <MenuItem value="">All Users</MenuItem>
                {usersLoading ? (
                  <MenuItem disabled>Loading users...</MenuItem>
                ) : (
                  users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                startIcon={<Assessment />}
                fullWidth={isMobile}
              >
                Generate
              </Button>
              <Button
                variant="outlined"
                onClick={handleExportReport}
                startIcon={<GetApp />}
                fullWidth={isMobile}
                disabled={monthlySales.length === 0}
              >
                Export
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Show selected filters */}
        {(dateRange.startDate || dateRange.endDate || selectedUser) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="bold">
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
              {dateRange.startDate && (
                <Typography variant="body2">
                  <strong>From:</strong> {new Date(dateRange.startDate).toLocaleDateString('en-GB')}
                </Typography>
              )}
              {dateRange.endDate && (
                <Typography variant="body2">
                  <strong>To:</strong> {new Date(dateRange.endDate).toLocaleDateString('en-GB')}
                </Typography>
              )}
              {selectedUser && (
                <Typography variant="body2">
                  <strong>User:</strong> {selectedUserName}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            icon={<AttachMoney />}
            color="success"
            subtitle={dateRange.startDate || dateRange.endDate ? 'For selected period' : 'All time earnings'}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Bills"
            value={totalBills}
            icon={<Receipt />}
            color="primary"
            subtitle={dateRange.startDate || dateRange.endDate ? 'In selected period' : 'Bills generated'}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Average Bill"
            value={`₹${Math.round(avgBillValue).toLocaleString('en-IN')}`}
            icon={<TrendingUp />}
            color="info"
            subtitle="Per bill value"
          />
        </Grid>
      </Grid>

      {/* Monthly Sales Trend */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Monthly Sales Trend
          </Typography>
          {monthlySales.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Showing {monthlySales.length} month{monthlySales.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        
        {monthlySales.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Month</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Bills</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Revenue</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Avg. Bill</TableCell>
                  <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Growth</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlySales.map((month, index) => {
                  const prevMonth = monthlySales[index + 1]
                  const growth = prevMonth 
                    ? ((month.totalSales - prevMonth.totalSales) / prevMonth.totalSales * 100).toFixed(1)
                    : null

                  return (
                    <TableRow 
                      key={index} 
                      hover
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                        '&:hover': { bgcolor: 'primary.light', cursor: 'pointer' }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long' 
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold">
                          {month.billCount}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          ₹{month.totalSales.toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          ₹{Math.round(month.totalSales / month.billCount).toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {growth !== null ? (
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={parseFloat(growth) >= 0 ? 'success.main' : 'error.main'}
                          >
                            {parseFloat(growth) >= 0 ? '+' : ''}{growth}%
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                
                {/* Total Row */}
                <TableRow sx={{ bgcolor: 'primary.light', fontWeight: 'bold' }}>
                  <TableCell>
                    <Typography variant="body1" fontWeight="bold">
                      TOTAL
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="bold">
                      {totalBills}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      ₹{totalRevenue.toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body1" fontWeight="bold">
                      ₹{Math.round(avgBillValue).toLocaleString('en-IN')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <BarChart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No sales data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dateRange.startDate || dateRange.endDate 
                ? 'Try adjusting your date range or user filter' 
                : 'Create your first bill to see sales trends'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default ReportsPage
