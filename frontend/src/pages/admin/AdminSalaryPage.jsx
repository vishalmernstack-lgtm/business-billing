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
  Add,
  Edit,
  Delete,
  Search,
  AttachMoney,
  Person,
  TrendingUp,
  Visibility,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { 
  useGetSalariesQuery, 
  useDeleteSalaryMutation,
  useGetUsersQuery 
} from '../../store/api/apiSlice'

const AdminSalaryPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [page, setPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [salaryToDelete, setSalaryToDelete] = useState(null)

  const { data: salariesData, isLoading, error } = useGetSalariesQuery({
    page,
    limit: 20,
    status: statusFilter,
    userId: userFilter,
  })

  const { data: usersData } = useGetUsersQuery({ limit: 100 })

  const [deleteSalary] = useDeleteSalaryMutation()

  const handleDelete = async () => {
    if (!salaryToDelete) return
    
    try {
      await deleteSalary(salaryToDelete.id).unwrap()
      toast.success('Salary deleted successfully')
      setDeleteDialogOpen(false)
      setSalaryToDelete(null)
    } catch (error) {
      toast.error('Failed to delete salary')
    }
  }

  const handleEdit = (id) => {
    navigate(`/admin/salaries/${id}/edit`)
  }

  const handleView = (id) => {
    navigate(`/admin/salaries/${id}`)
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
        Failed to load salaries. Please try again.
      </Alert>
    )
  }

  const salaries = salariesData?.data?.salaries || []
  const users = usersData?.data?.users || []

  // Calculate statistics
  const totalSalaries = salaries.length
  const activeSalaries = salaries.filter(s => s.status === 'Active').length
  const totalPayroll = salaries
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + s.netSalary, 0)

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
            Salary Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage employee salaries and payroll
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/admin/salaries/new')}
          size="large"
        >
          Add New Salary
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary">
              {totalSalaries}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Salaries
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main">
              {activeSalaries}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Salaries
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="secondary.main">
              {formatCurrency(totalPayroll)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monthly Payroll
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
              placeholder="Search by employee name..."
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
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setUserFilter('')
              }}
              fullWidth
              size="small"
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Salaries Table */}
      {salaries.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No salaries found
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {search || statusFilter || userFilter ? 
              'Try adjusting your filters' : 
              'Add the first salary to get started!'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/admin/salaries/new')}
            sx={{ mt: 2 }}
          >
            Add First Salary
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Basic Salary</TableCell>
                <TableCell>Gross Salary</TableCell>
                <TableCell>Net Salary</TableCell>
                <TableCell>Effective Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {salaries.map((salary) => (
                <TableRow key={salary._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {salary.userId.firstName} {salary.userId.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {salary.userId.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {formatCurrency(salary.basicSalary)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold" color="success.main">
                      {formatCurrency(salary.grossSalary)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                      {formatCurrency(salary.netSalary)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {formatDate(salary.effectiveDate)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={salary.status} 
                      color={salary.status === 'Active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleView(salary._id)} color="primary">
                      <Visibility />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEdit(salary._id)} color="primary">
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => {
                        setSalaryToDelete({ 
                          id: salary._id, 
                          employee: `${salary.userId.firstName} ${salary.userId.lastName}` 
                        })
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Salary</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the salary for "{salaryToDelete?.employee}"? 
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

export default AdminSalaryPage