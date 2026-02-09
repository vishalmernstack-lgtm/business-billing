import React, { useState } from 'react'
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
  useMediaQuery,
  useTheme,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  AttachMoney,
  Receipt,
  CalendarToday,
  Visibility,
  Person,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useGetMySalaryQuery, useGetMySalaryHistoryQuery } from '../../store/api/apiSlice'

const SalaryPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedSalary, setSelectedSalary] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const { data: salariesData, isLoading, error } = useGetMySalaryHistoryQuery({
    page,
    limit: 20,
    status: statusFilter,
  })

  // Also get current salary for overview
  const { data: currentSalaryData } = useGetMySalaryQuery()

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
        {error?.data?.error?.message || 'Failed to load salary information'}
      </Alert>
    )
  }

  const salaries = salariesData?.data?.salaries || []
  
  // If we have current salary but no history, show current salary in the table
  let allSalaries = [...salaries]
  if (currentSalaryData?.data && !salaries.some(s => s._id === currentSalaryData.data._id)) {
    allSalaries = [currentSalaryData.data, ...salaries]
  }
  
  // Sort salaries to show Active ones first, then by date (newest first)
  const sortedSalaries = [...allSalaries].sort((a, b) => {
    // First, sort by status (Active first)
    if (a.status === 'Active' && b.status !== 'Active') return -1
    if (a.status !== 'Active' && b.status === 'Active') return 1
    
    // Then sort by effective date (newest first)
    return new Date(b.effectiveDate) - new Date(a.effectiveDate)
  })

  // Get current active salary for overview cards
  const currentSalary = currentSalaryData?.data || sortedSalaries.find(salary => salary.status === 'Active')

  if (allSalaries.length === 0) {
    return (
      <Paper sx={{ textAlign: 'center', py: 8 }}>
        <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Salary Information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your salary information has not been set up yet. Please contact your administrator.
        </Typography>
      </Paper>
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
      case 'Active': return 'success'
      case 'Inactive': return 'default'
      case 'Pending': return 'warning'
      default: return 'default'
    }
  }

  const calculateTotalAllowances = (allowances) => {
    return (allowances?.hra || 0) + 
           (allowances?.transport || 0) + 
           (allowances?.medical || 0) + 
           (allowances?.other || 0)
  }

  const calculateTotalDeductions = (deductions) => {
    return (deductions?.pf || 0) + 
           (deductions?.tax || 0) + 
           (deductions?.insurance || 0) + 
           (deductions?.other || 0)
  }

  const handleViewDetails = (salary) => {
    setSelectedSalary(salary)
    setDetailsDialogOpen(true)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          My Salary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View your salary history and current salary details
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
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
          <Grid item xs={12} md={6}>
            <Button
              variant="outlined"
              onClick={() => {
                setStatusFilter('')
              }}
              fullWidth
              size="small"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Salary Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Status</TableCell>
              <TableCell>Basic Salary</TableCell>
              <TableCell>Net Salary</TableCell>
              <TableCell>Effective Date</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedSalaries.map((salary, index) => (
              <TableRow 
                key={salary._id} 
                hover
                sx={{
                  bgcolor: salary.status === 'Active' ? 'success.light' : 'inherit',
                  '&:hover': {
                    bgcolor: salary.status === 'Active' ? 'success.main' : 'action.hover',
                  }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={salary.status === 'Active' ? 'Current Salary' : salary.status} 
                      color={getStatusColor(salary.status)}
                      size="small"
                      variant={salary.status === 'Active' ? 'filled' : 'outlined'}
                    />
                    {index === 0 && salary.status === 'Active' && (
                      <Chip 
                        label="Latest" 
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold" color="primary">
                    {formatCurrency(salary.basicSalary)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold" color="secondary.main">
                    {formatCurrency(salary.netSalary)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {formatDate(salary.effectiveDate)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {salary.createdBy ? 
                        `${salary.createdBy.firstName} ${salary.createdBy.lastName}` : 
                        'System'
                      }
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton 
                    size="small" 
                    onClick={() => handleViewDetails(salary)} 
                    color="primary"
                  >
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Salary Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">
              Salary Details
            </Typography>
            {selectedSalary && (
              <Chip 
                label={selectedSalary.status === 'Active' ? 'Current Salary' : selectedSalary.status} 
                color={getStatusColor(selectedSalary.status)}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSalary && (
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Salary Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Basic Salary</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(selectedSalary.basicSalary)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">Net Salary</Typography>
                      <Typography variant="h6" color="secondary">
                        {formatCurrency(selectedSalary.netSalary)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Additional Information */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Effective Date</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedSalary.effectiveDate)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Created By</Typography>
                      <Typography variant="body1">
                        {selectedSalary.createdBy ? 
                          `${selectedSalary.createdBy.firstName} ${selectedSalary.createdBy.lastName}` : 
                          'System'
                        }
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Created On</Typography>
                      <Typography variant="body1">
                        {formatDate(selectedSalary.createdAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={selectedSalary.status === 'Active' ? 'Current Salary' : selectedSalary.status} 
                        color={getStatusColor(selectedSalary.status)}
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SalaryPage