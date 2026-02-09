import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Button,
} from '@mui/material'
import {
  ArrowBack,
  AttachMoney,
  CalendarToday,
  Category,
  Person,
  Receipt,
  AttachFile,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetExpenseQuery } from '../../store/api/apiSlice'

const ExpenseViewPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { data: expenseData, isLoading, error } = useGetExpenseQuery(id)

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
        {error?.data?.error?.message || 'Failed to load expense details'}
      </Alert>
    )
  }

  const expense = expenseData?.data

  if (!expense) {
    return (
      <Alert severity="error">
        Expense not found
      </Alert>
    )
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success'
      case 'Pending': return 'warning'
      case 'Rejected': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ 
        p: { xs: 2, md: 3 }, 
        mb: 2,
        borderRadius: 0,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/expenses')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant={isMobile ? "h5" : "h4"} sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            Expense Details
          </Typography>
          {expense.status === 'Pending' && (
            <Button
              variant="contained"
              onClick={() => navigate(`/expenses/${id}/edit`)}
              size="small"
            >
              Edit
            </Button>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Main Details */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Receipt />
              Expense Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {expense.title}
                </Typography>
                {expense.description && (
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {expense.description}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Category color="primary" />
                  <Typography variant="body1">
                    <strong>Category:</strong>
                  </Typography>
                </Box>
                <Chip label={expense.category} color="primary" />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AttachMoney color="primary" />
                  <Typography variant="body1">
                    <strong>Amount:</strong>
                  </Typography>
                </Box>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {formatCurrency(expense.amount)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarToday color="primary" />
                  <Typography variant="body1">
                    <strong>Expense Date:</strong>
                  </Typography>
                </Box>
                <Typography variant="body1">
                  {formatDate(expense.expenseDate)}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Receipt color="primary" />
                  <Typography variant="body1">
                    <strong>Status:</strong>
                  </Typography>
                </Box>
                <Chip 
                  label={expense.status} 
                  color={getStatusColor(expense.status)}
                  size="large"
                />
              </Grid>

              {expense.rejectionReason && (
                <Grid item xs={12}>
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                      Rejection Reason:
                    </Typography>
                    <Typography variant="body2">
                      {expense.rejectionReason}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Receipt */}
          {expense.receipt && (
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachFile />
                Receipt
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ textAlign: 'center' }}>
                {expense.receipt.mimetype?.startsWith('image/') ? (
                  <img 
                    src={`/${expense.receipt.path}`} 
                    alt="Receipt" 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px', 
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: theme.shadows[2]
                    }} 
                  />
                ) : (
                  <Box sx={{ py: 4 }}>
                    <AttachFile sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      {expense.receipt.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      PDF Document
                    </Typography>
                    <Button
                      variant="outlined"
                      href={`/${expense.receipt.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Receipt
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person />
              Submitted By
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {expense.userId.firstName} {expense.userId.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {expense.userId.email}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Submitted on:</strong> {formatDate(expense.createdAt)}
              </Typography>
            </Box>

            {expense.approvedBy && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Approved by:</strong> {expense.approvedBy.firstName} {expense.approvedBy.lastName}
                </Typography>
                {expense.approvedDate && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Approved on:</strong> {formatDate(expense.approvedDate)}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>

          {/* Quick Actions */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom color="primary.main">
              Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {expense.status === 'Pending' && (
                <Button
                  variant="contained"
                  onClick={() => navigate(`/expenses/${id}/edit`)}
                  fullWidth
                >
                  Edit Expense
                </Button>
              )}
              
              <Button
                variant="outlined"
                onClick={() => navigate('/expenses')}
                fullWidth
              >
                Back to Expenses
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ExpenseViewPage