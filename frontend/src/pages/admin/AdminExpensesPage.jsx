import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  MenuItem,
} from '@mui/material'
import {
  Search,
  AttachMoney,
  Person,
  TrendingUp,
  Visibility,
  CheckCircle,
  Cancel,
  Delete,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { 
  useGetExpensesQuery, 
  useUpdateExpenseStatusMutation,
  useDeleteExpenseMutation,
  useGetExpenseStatsQuery,
  useGetUsersQuery 
} from '../../store/api/apiSlice'

const AdminExpensesPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [page, setPage] = useState(1)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: expensesData, isLoading, error } = useGetExpensesQuery({
    page,
    limit: 20,
    status: statusFilter,
    category: categoryFilter,
    userId: userFilter,
  })

  const { data: statsData } = useGetExpenseStatsQuery()
  const { data: usersData } = useGetUsersQuery({ limit: 100 })

  const [updateExpenseStatus] = useUpdateExpenseStatusMutation()
  const [deleteExpense] = useDeleteExpenseMutation()

  const handleApprove = async () => {
    if (!selectedExpense) return
    
    try {
      await updateExpenseStatus({ 
        id: selectedExpense._id, 
        status: 'Approved' 
      }).unwrap()
      toast.success('Expense approved successfully')
      setApprovalDialogOpen(false)
      setSelectedExpense(null)
    } catch (error) {
      toast.error('Failed to approve expense')
    }
  }

  const handleReject = async () => {
    if (!selectedExpense || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    
    try {
      await updateExpenseStatus({ 
        id: selectedExpense._id, 
        status: 'Rejected',
        rejectionReason: rejectionReason.trim()
      }).unwrap()
      toast.success('Expense rejected successfully')
      setRejectionDialogOpen(false)
      setSelectedExpense(null)
      setRejectionReason('')
    } catch (error) {
      toast.error('Failed to reject expense')
    }
  }

  const handleDelete = async () => {
    if (!selectedExpense) return
    
    try {
      await deleteExpense(selectedExpense._id).unwrap()
      toast.success('Expense deleted successfully')
      setDeleteDialogOpen(false)
      setSelectedExpense(null)
    } catch (error) {
      toast.error('Failed to delete expense')
    }
  }

  const handleView = (id) => {
    navigate(`/expenses/${id}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success'
      case 'Pending': return 'warning'
      case 'Rejected': return 'error'
      default: return 'default'
    }
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

  const categories = [
    'Travel', 'Food', 'Office Supplies', 'Equipment', 'Software',
    'Marketing', 'Training', 'Utilities', 'Rent', 'Maintenance', 'Other'
  ]

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
        Failed to load expenses. Please try again.
      </Alert>
    )
  }

  const expenses = expensesData?.data?.expenses || []
  const users = usersData?.data?.users || []
  const stats = statsData?.data?.summary || {}

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3 
      }}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            Expense Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and manage employee expense claims
          </Typography>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary">
              {stats.totalExpenses || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Expenses
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main">
              {stats.pendingCount || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Approval
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main">
              {formatCurrency(stats.approvedAmount || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved Amount
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="secondary.main">
              {formatCurrency(stats.totalAmount || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Amount
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Employee"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Employees</MenuItem>
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setCategoryFilter('')
                setUserFilter('')
              }}
              fullWidth
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No expenses found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {search || statusFilter || categoryFilter || userFilter ? 
              'Try adjusting your filters' : 
              'No expense claims submitted yet'
            }
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {expense.userId.firstName} {expense.userId.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {expense.userId.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {expense.title}
                    </Typography>
                    {expense.description && (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {expense.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={expense.category} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                      {formatCurrency(expense.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatDate(expense.expenseDate)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={expense.status} 
                      color={getStatusColor(expense.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleView(expense._id)} color="primary">
                      <Visibility />
                    </IconButton>
                    {expense.status === 'Pending' && (
                      <>
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => {
                            setSelectedExpense(expense)
                            setApprovalDialogOpen(true)
                          }}
                        >
                          <CheckCircle />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => {
                            setSelectedExpense(expense)
                            setRejectionDialogOpen(true)
                          }}
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        setSelectedExpense(expense)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onClose={() => setApprovalDialogOpen(false)}>
        <DialogTitle>Approve Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve the expense "{selectedExpense?.title}" 
            for {formatCurrency(selectedExpense?.amount || 0)}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onClose={() => setRejectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Expense</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Please provide a reason for rejecting the expense "{selectedExpense?.title}":
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained">
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the expense "{selectedExpense?.title}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminExpensesPage