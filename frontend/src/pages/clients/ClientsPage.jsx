import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  Avatar,
  Divider,
  LinearProgress,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Add,
  Search,
  Phone,
  Person,
  LocationOn,
  Receipt,
  Edit,
  Visibility,
  CreditCard,
  Badge,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import { useGetClientsQuery, useGetBillsQuery } from '../../store/api/apiSlice'

const ClientCard = ({ client, bills }) => {
  const navigate = useNavigate()
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success'
      case 'Sent': return 'warning'
      case 'Partial': return 'info'
      case 'Draft': return 'default'
      default: return 'default'
    }
  }

  const totalAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
  const paidAmount = bills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0)
  const pendingAmount = totalAmount - paidAmount
  const paymentRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {/* Client Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            src={client.documents?.photo ? `${import.meta.env.VITE_API_URL.replace('/api', '')}/${client.documents.photo}` : undefined}
            sx={{ bgcolor: 'primary.main', mr: 2, width: 56, height: 56 }}
          >
            {!client.documents?.photo && client.clientName.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {client.clientName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip 
                label={client.gender} 
                size="small" 
                color="primary" 
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
              {client.documents?.aadhaarCard && (
                <Tooltip title="Aadhaar Card Available">
                  <Badge sx={{ fontSize: 16, color: 'success.main' }} />
                </Tooltip>
              )}
              {client.documents?.panCard && (
                <Tooltip title="PAN Card Available">
                  <CreditCard sx={{ fontSize: 16, color: 'info.main' }} />
                </Tooltip>
              )}
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color={paymentRate > 80 ? 'success.main' : paymentRate > 50 ? 'warning.main' : 'error.main'}>
              {paymentRate.toFixed(1)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Payment Rate
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Client Information */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="body2" fontWeight="500">{client.phoneNumber}</Typography>
          </Box>
          
          {client.alternatePhone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">{client.alternatePhone}</Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <LocationOn sx={{ fontSize: 18, color: 'error.main', mt: 0.2 }} />
            <Box>
              <Typography variant="body2" fontWeight="500">{client.village}</Typography>
              {(client.district || client.state) && (
                <Typography variant="caption" color="text.secondary">
                  {[client.district, client.state].filter(Boolean).join(', ')}
                </Typography>
              )}
            </Box>
          </Box>

          {client.occupation && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2">{client.occupation}</Typography>
            </Box>
          )}
        </Box>
        
        {/* Billing Statistics */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
            Billing Summary
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'primary.light', borderRadius: 1 }}>
                <Typography variant="h6" color="primary.contrastText" fontWeight="bold">
                  {bills.length}
                </Typography>
                <Typography variant="caption" color="primary.contrastText">
                  Total Bills
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="h6" color="success.contrastText" fontWeight="bold">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" color="success.contrastText">
                  Total Amount
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'success.main', borderRadius: 1 }}>
                <Typography variant="body1" color="success.contrastText" fontWeight="bold">
                  ₹{paidAmount.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" color="success.contrastText">
                  Paid
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'warning.main', borderRadius: 1 }}>
                <Typography variant="body1" color="warning.contrastText" fontWeight="bold">
                  ₹{pendingAmount.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="caption" color="warning.contrastText">
                  Pending
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          {/* Payment Rate Progress */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight="500">
                Payment Progress
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                {paymentRate.toFixed(1)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={paymentRate}
              color={paymentRate > 80 ? 'success' : paymentRate > 50 ? 'warning' : 'error'}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        </Box>
        
        {/* Recent Bills */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="primary" fontWeight="bold">
            Recent Bills
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 150, overflowY: 'auto' }}>
            {bills.slice(0, 4).map((bill) => (
              <Box
                key={bill._id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  bgcolor: 'grey.50',
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: 'grey.200',
                  '&:hover': { 
                    bgcolor: 'grey.100',
                    borderColor: 'primary.main',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s'
                  }
                }}
                onClick={() => navigate(`/bills/${bill._id}/view`)}
              >
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {bill.billNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(bill.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box>
                    <Typography variant="body2" color="primary" fontWeight="bold">
                      ₹{bill.totalAmount.toLocaleString('en-IN')}
                    </Typography>
                    {bill.paidAmount > 0 && (
                      <Typography variant="caption" color="success.main">
                        Paid: ₹{bill.paidAmount.toLocaleString('en-IN')}
                      </Typography>
                    )}
                  </Box>
                  <Chip
                    label={bill.status}
                    size="small"
                    color={getStatusColor(bill.status)}
                    sx={{ height: 22, fontSize: '0.65rem', fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
            ))}
            {bills.length > 4 && (
              <Typography 
                variant="caption" 
                color="primary" 
                sx={{ 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                +{bills.length - 4} more bills
              </Typography>
            )}
            {bills.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No bills yet
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
      
      <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          startIcon={<Receipt />}
          onClick={() => navigate(`/bills/new?phone=${client.phoneNumber}&name=${client.clientName}&gender=${client.gender}&village=${client.village}`)}
          color="primary"
          fullWidth
          variant="contained"
        >
          New Bill
        </Button>
        <Tooltip title="View Details">
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/clients/${client._id}`)}
            sx={{ border: '1px solid', borderColor: 'primary.main' }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  )
}

const ClientsPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [search, setSearch] = useState('')
  
  const { data: clientsData, isLoading: clientsLoading, error: clientsError } = useGetClientsQuery({
    page: 1,
    limit: 1000,
    search: search
  })

  const { data: billsData, isLoading: billsLoading } = useGetBillsQuery({
    page: 1,
    limit: 1000,
  })

  // Match clients with their bills
  const clientsWithBills = useMemo(() => {
    if (!clientsData?.data?.clients) return []
    
    const clients = clientsData.data.clients
    const bills = billsData?.data?.bills || []
    
    // Map bills to clients by phone number
    return clients.map(client => {
      const clientBills = bills.filter(bill => 
        bill.clientDetails?.phoneNumber === client.phoneNumber
      )
      
      return {
        client,
        bills: clientBills
      }
    }).sort((a, b) => {
      // Sort by total amount descending
      const totalA = a.bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
      const totalB = b.bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
      return totalB - totalA
    })
  }, [clientsData, billsData])

  const isLoading = clientsLoading || billsLoading

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (clientsError) {
    return (
      <Alert severity="error">
        Failed to load client data. Please try again.
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: 3 
      }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
            Client Details ({clientsWithBills.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View client information and their billing history
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/bills/new')}
          fullWidth={isMobile}
        >
          Create New Bill
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search clients by name, phone, or village..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {clientsWithBills.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No clients found
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {search ? 'Try adjusting your search terms' : 'Create your first bill to get started!'}
          </Typography>
          {!search && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/bills/new')}
              sx={{ mt: 2 }}
            >
              Create Your First Bill
            </Button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {clientsWithBills.map(({ client, bills }) => (
            <Grid item xs={12} md={6} lg={4} key={client._id}>
              <ClientCard
                client={client}
                bills={bills}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default ClientsPage
