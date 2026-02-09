import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useMediaQuery,
  useTheme,
  Fab,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Assessment,
  Receipt,
  FilterList,
  Visibility,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { 
  useGetExpensesQuery, 
  useDeleteExpenseMutation,
  useGetExpenseStatsQuery 
} from '../../store/api/apiSlice'

const ExpensesPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState(null)

  const { data: expensesData, isLoading, error } = useGetExpensesQuery({
    page,
    limit: 20,
    status: statusFilter,
    category: categoryFilter,
  })

  const { data: statsData } = useGetExpenseStatsQuery()

  const [deleteExpense] = useDeleteExpenseMutation()

  const handleDelete = async () => {
    if (!expenseToDelete) return
    
    try {
      await deleteExpense(expenseToDelete.id).unwrap()
      toast.success('Expense deleted successfully')
      setDeleteDialogOpen(false)
      setExpenseToDelete(null)
    } catch (error) {
      toast.error('Failed to delete expense')
    }
  }

  const handleEdit = (id) => {
    navigate(`/expenses/${id}/edit`)
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
            My Expenses
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage your expense claims
          </Typography>
        </Box>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/expenses/new')}
            size="large"
          >
            Add New Expense
          </Button>
        )}
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
            <Typography variant="h4" color="success.main">
              {formatCurrency(stats.approvedAmount || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Approved
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main">
              {formatCurrency(stats.pendingAmount || 0)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setCategoryFilter('')
              }}
              fullWidth
              size="small"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No expenses found
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {search || statusFilter || categoryFilter ? 
              'Try adjusting your filters' : 
              'Add your first expense to get started!'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/expenses/new')}
            sx={{ mt: 2 }}
          >
            Add Your First Expense
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
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
                      <IconButton size="small" onClick={() => handleEdit(expense._id)} color="primary">
                        <Edit />
                      </IconButton>
                    )}
                    {expense.status === 'Pending' && (
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => {
                          setExpenseToDelete({ id: expense._id, title: expense.title })
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add expense"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => navigate('/expenses/new')}
        >
          <Add />
        </Fab>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the expense "{expenseToDelete?.title}"? 
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

export default ExpensesPage