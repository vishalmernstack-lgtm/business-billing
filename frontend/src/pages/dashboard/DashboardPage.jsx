import React from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Avatar,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material'
import {
  People,
  Receipt,
  TrendingUp,
  AttachMoney,
  Add,
  Visibility,
  TrendingDown,
  Assessment,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { selectUser } from '../../store/slices/authSlice'
import { useGetClientsQuery, useGetBillsQuery } from '../../store/api/apiSlice'

const StatCard = ({ title, value, icon, color = 'primary', subtitle, trend, onClick }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4],
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography color="textSecondary" gutterBottom variant="overline" fontSize="0.75rem">
              {title}
            </Typography>
            <Typography variant={isMobile ? "h5" : "h4"} component="div" gutterBottom fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                )}
                <Typography 
                  variant="caption" 
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  fontWeight="bold"
                >
                  {Math.abs(trend)}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.main`,
              borderRadius: '50%',
              p: isMobile ? 1.5 : 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { color: 'white', fontSize: isMobile ? 24 : 32 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

const QuickActionCard = ({ title, description, icon, color, onClick }) => (
  <Card 
    sx={{ 
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 4,
      },
    }}
    onClick={onClick}
  >
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Box
        sx={{
          backgroundColor: `${color}.main`,
          borderRadius: '50%',
          p: 2,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
        }}
      >
        {React.cloneElement(icon, { sx: { color: 'white', fontSize: 32 } })}
      </Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
)

const DashboardPage = () => {
  const user = useSelector(selectUser)
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useGetClientsQuery({
    page: 1,
    limit: 1000,
  })
  
  const { data: billsData, isLoading: billsLoading, error: billsError } = useGetBillsQuery({
    page: 1,
    limit: 1000,
  })

  const isLoading = clientsLoading || billsLoading
  const hasError = clientsError || billsError

  // Calculate statistics
  const totalClients = clientsData?.data?.pagination?.total || 0
  const totalBills = billsData?.data?.pagination?.total || 0
  const bills = billsData?.data?.bills || []
  const totalSales = bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
  const paidBills = bills.filter(bill => bill.status === 'Paid').length
  const pendingBills = bills.filter(bill => bill.status === 'Sent').length
  const draftBills = bills.filter(bill => bill.status === 'Draft').length

  // Recent activity
  const recentBills = bills.slice(0, 5)
  const recentClients = clientsData?.data?.clients?.slice(0, 3) || []

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (hasError) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load dashboard data. Please try again.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your business today
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Clients"
            value={totalClients}
            icon={<People />}
            color="primary"
            subtitle={`${recentClients.length} added recently`}
            trend={12}
            onClick={() => navigate('/clients')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Bills"
            value={totalBills}
            icon={<Receipt />}
            color="secondary"
            subtitle={`${draftBills} drafts pending`}
            trend={8}
            onClick={() => navigate('/bills')}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${totalSales.toLocaleString()}`}
            icon={<AttachMoney />}
            color="success"
            subtitle={`₹${paidBills > 0 ? Math.round(totalSales / totalBills).toLocaleString() : 0} avg per bill`}
            trend={15}
          />
        </Grid>
        
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Paid Bills"
            value={paidBills}
            icon={<TrendingUp />}
            color="info"
            subtitle={`${pendingBills} pending payment`}
            trend={5}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="Add Client"
                description="Register a new client"
                icon={<People />}
                color="primary"
                onClick={() => navigate('/clients/new')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="Create Bill"
                description="Generate a new invoice"
                icon={<Receipt />}
                color="secondary"
                onClick={() => navigate('/bills/new')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="View Reports"
                description="Analyze your performance"
                icon={<Assessment />}
                color="success"
                onClick={() => navigate('/reports')}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <QuickActionCard
                title="Manage Clients"
                description="View all your clients"
                icon={<Visibility />}
                color="info"
                onClick={() => navigate('/clients')}
              />
            </Grid>
          </Grid>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                Recent Bills
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/bills')}
              >
                View All
              </Button>
            </Box>
            
            {recentBills.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentBills.map((bill) => (
                  <Box
                    key={bill._id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => navigate(`/bills/${bill._id}`)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Receipt />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {bill.billNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {bill.client?.clientName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(bill.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold">
                        ₹{bill.totalAmount.toLocaleString()}
                      </Typography>
                      <Chip
                        label={bill.status}
                        size="small"
                        color={
                          bill.status === 'Paid' ? 'success' :
                          bill.status === 'Sent' ? 'warning' : 'default'
                        }
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  No bills created yet
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/bills/new')}
                >
                  Create Your First Bill
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Business Insights */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Business Insights
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Payment Status Distribution */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Payment Status
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Paid</Typography>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {paidBills} ({totalBills > 0 ? Math.round((paidBills / totalBills) * 100) : 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={totalBills > 0 ? (paidBills / totalBills) * 100 : 0}
                    color="success"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Pending</Typography>
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      {pendingBills} ({totalBills > 0 ? Math.round((pendingBills / totalBills) * 100) : 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={totalBills > 0 ? (pendingBills / totalBills) * 100 : 0}
                    color="warning"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Draft</Typography>
                    <Typography variant="body2" fontWeight="bold" color="info.main">
                      {draftBills} ({totalBills > 0 ? Math.round((draftBills / totalBills) * 100) : 0}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={totalBills > 0 ? (draftBills / totalBills) * 100 : 0}
                    color="info"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Box>

              {/* Recent Clients */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Recent Clients
                </Typography>
                {recentClients.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {recentClients.map((client) => (
                      <Box
                        key={client._id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1,
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        onClick={() => navigate(`/clients/${client._id}/edit`)}
                      >
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                          {client.clientName.charAt(0)}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {client.clientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {client.phoneNumber || 'No phone'}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No clients added yet
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage