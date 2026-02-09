import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
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
  Card,
  CardContent,
  Grid,
  MenuItem,
  Pagination,
  useMediaQuery,
  useTheme,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
} from '@mui/material'
import {
  Search,
  Edit,
  Block,
  CheckCircle,
  Person,
  AdminPanelSettings,
  FilterList,
  AttachMoney,
  AccountBalance,
  Add,
  Visibility,
  Delete,
  CurrencyRupee,
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import { 
  useGetUsersQuery, 
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useGetSalariesQuery,
  useCreateSalaryMutation,
  useUpdateSalaryMutation,
  useDeleteSalaryMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useUpdateExpenseStatusMutation,
  useDeleteExpenseMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useCheckEmailAvailabilityQuery,
  useCheckPhoneAvailabilityQuery,
} from '../../store/api/apiSlice'

const UsersPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to first page when searching
    }, 500)
    return () => clearTimeout(timer)
  }, [search])
  const [editDialog, setEditDialog] = useState({ open: false, user: null })
  const [manageDialog, setManageDialog] = useState({ open: false, user: null, tab: 0 })
  const [salaryDialog, setSalaryDialog] = useState({ open: false, user: null, salary: null })
  const [salaryForm, setSalaryForm] = useState({
    amount: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Active'
  })
  const [expenseDialog, setExpenseDialog] = useState({ open: false, user: null })
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
  })
  const [userDialog, setUserDialog] = useState({ open: false, user: null })
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'User',
    isActive: true
  })
  const [userFormErrors, setUserFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: ''
  })
  
  const { data, isLoading, error } = useGetUsersQuery({
    page,
    limit: 10,
    role,
    isActive,
    search: debouncedSearch,
  })
  
  const [updateUserRole] = useUpdateUserRoleMutation()
  const [updateUserStatus] = useUpdateUserStatusMutation()
  const [createSalary] = useCreateSalaryMutation()
  const [updateSalary] = useUpdateSalaryMutation()
  const [deleteSalary] = useDeleteSalaryMutation()
  const [createExpense] = useCreateExpenseMutation()
  const [updateExpenseStatus] = useUpdateExpenseStatusMutation()
  const [deleteExpense] = useDeleteExpenseMutation()
  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole({ id: userId, role: newRole }).unwrap()
      toast.success('User role updated successfully')
      setEditDialog({ open: false, user: null })
    } catch (error) {
      toast.error('Failed to update user role')
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await updateUserStatus({ id: userId, isActive: !currentStatus }).unwrap()
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleManageUser = (user) => {
    setManageDialog({ open: true, user, tab: 0 })
  }

  const handleCreateSalary = async () => {
    try {
      const salaryData = {
        userId: manageDialog.user._id,
        basicSalary: parseFloat(salaryForm.amount),
        allowances: { hra: 0, transport: 0, medical: 0, other: 0 },
        deductions: { pf: 0, tax: 0, insurance: 0, other: 0 },
        effectiveDate: salaryForm.effectiveDate,
        status: salaryForm.status,
      }

      if (salaryDialog.salary) {
        await updateSalary({ id: salaryDialog.salary._id, ...salaryData }).unwrap()
        toast.success('Salary updated successfully')
      } else {
        await createSalary(salaryData).unwrap()
        toast.success('Salary created successfully')
      }
      
      setSalaryDialog({ open: false, user: null, salary: null })
      resetSalaryForm()
    } catch (error) {
      toast.error('Failed to save salary')
    }
  }

  const handleCreateExpense = async () => {
    try {
      const expenseData = {
        userId: expenseDialog.user._id,
        title: expenseForm.description, // Use description as title
        description: expenseForm.description,
        category: 'Other', // Default category
        amount: parseFloat(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
        status: 'Approved', // Admin-created expenses are auto-approved
      }

      await createExpense(expenseData).unwrap()
      toast.success('Expense created successfully')
      
      setExpenseDialog({ open: false, user: null })
      resetExpenseForm()
    } catch (error) {
      toast.error('Failed to create expense')
    }
  }

  const handleDeleteSalary = async (salaryId) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      try {
        await deleteSalary(salaryId).unwrap()
        toast.success('Salary deleted successfully')
      } catch (error) {
        toast.error('Failed to delete salary')
      }
    }
  }

  const handleExpenseAction = async (expenseId, action, rejectionReason = '') => {
    try {
      await updateExpenseStatus({ id: expenseId, status: action, rejectionReason }).unwrap()
      toast.success(`Expense ${action.toLowerCase()} successfully`)
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} expense`)
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(expenseId).unwrap()
        toast.success('Expense deleted successfully')
      } catch (error) {
        toast.error('Failed to delete expense')
      }
    }
  }

  const resetSalaryForm = () => {
    setSalaryForm({
      amount: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    })
  }

  const handleCreateUser = async () => {
    // Validate form first
    if (!validateUserForm()) {
      return
    }

    try {
      if (userDialog.user) {
        // Update existing user
        const updateData = { ...userForm };
        console.log('Original form data:', {
          ...updateData,
          password: updateData.password ? `[${updateData.password.length} chars]: "${updateData.password}"` : '[EMPTY]'
        });
        
        if (!updateData.password || updateData.password.trim() === '') {
          console.log('Password is empty, removing from update data');
          delete updateData.password; // Don't update password if empty
        } else {
          console.log('Password provided, will update:', updateData.password);
        }
        
        console.log('Final update data being sent:', {
          ...updateData,
          password: updateData.password ? '[PROVIDED]' : '[NOT PROVIDED]'
        });
        
        await updateUser({ id: userDialog.user._id, ...updateData }).unwrap();
        toast.success('User updated successfully');
      } else {
        // Create new user
        console.log('Creating new user with data:', {
          ...userForm,
          password: userForm.password ? '[PROVIDED]' : '[EMPTY]'
        });
        await createUser(userForm).unwrap();
        toast.success('User created successfully');
      }
      
      setUserDialog({ open: false, user: null });
      resetUserForm();
    } catch (error) {
      console.error('User operation error:', error);
      
      // Handle specific error messages from backend
      const errorMessage = error?.data?.error?.message || error?.message || 'An error occurred';
      
      // Check for specific validation errors and set field errors
      if (errorMessage.includes('email already exists')) {
        setUserFormErrors(prev => ({
          ...prev,
          email: 'This email is already registered'
        }));
      } else if (errorMessage.includes('phone number already exists')) {
        setUserFormErrors(prev => ({
          ...prev,
          phoneNumber: 'This phone number is already registered'
        }));
      } else {
        toast.error(errorMessage);
      }
    }
  }

  const resetUserForm = () => {
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      role: 'User',
      isActive: true
    })
    setUserFormErrors({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: ''
    })
  }

  const validateUserForm = () => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: ''
    }

    console.log('Validating user form:', {
      ...userForm,
      password: userForm.password ? `[${userForm.password.length} chars]` : '[EMPTY]'
    });

    // Required field validation
    if (!userForm.firstName.trim()) {
      errors.firstName = 'First name is required'
    }
    if (!userForm.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }
    if (!userForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(userForm.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    // Password validation
    if (!userDialog.user && !userForm.password.trim()) {
      errors.password = 'Password is required for new users'
      console.log('Password required for new user but not provided');
    } else if (userForm.password && userForm.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
      console.log('Password too short:', userForm.password.length);
    } else if (userForm.password) {
      console.log('Password validation passed:', userForm.password.length, 'characters');
    }
    
    if (userForm.phoneNumber && !/^[0-9]{10}$/.test(userForm.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid 10-digit phone number'
    }

    console.log('Validation errors:', errors);
    setUserFormErrors(errors)
    const isValid = !Object.values(errors).some(error => error !== '');
    console.log('Form is valid:', isValid);
    return isValid;
  }

  const resetExpenseForm = () => {
    setExpenseForm({
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
    })
  }

  const openSalaryDialog = (user, salary = null) => {
    if (salary) {
      setSalaryForm({
        amount: salary.basicSalary.toString(),
        effectiveDate: salary.effectiveDate.split('T')[0],
        status: salary.status,
      })
    } else {
      resetSalaryForm()
    }
    setSalaryDialog({ open: true, user, salary })
  }

  const openExpenseDialog = (user) => {
    resetExpenseForm()
    setExpenseDialog({ open: true, user })
  }

  const getRoleColor = (role) => {
    return role === 'Admin' ? 'error' : 'primary'
  }

  const getRoleIcon = (role) => {
    return role === 'Admin' ? <AdminPanelSettings /> : <Person />
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading users...
        </Typography>
      </Box>
    )
  }

  if (error) {
    console.error('Users API Error:', error)
    return (
      <Alert severity="error">
        Failed to load users: {error?.data?.error?.message || error?.message || 'Unknown error'}
        <br />
        <Typography variant="body2" sx={{ mt: 1 }}>
          Please check the console for more details and ensure you're logged in as an admin.
        </Typography>
      </Alert>
    )
  }

  const users = data?.data?.users || []
  const pagination = data?.data?.pagination || {}

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
          <Typography variant="h4" gutterBottom>
            All Users
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage user accounts, roles, and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setUserDialog({ open: true, user: null })}
          sx={{ minWidth: { xs: '100%', md: 'auto' } }}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: search && (
                  <InputAdornment position="end">
                    <Typography variant="caption" color="text.secondary">
                      {debouncedSearch !== search ? 'Searching...' : `${users.length} found`}
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Status"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearch('')
                setRole('')
                setIsActive('')
                setPage(1)
              }}
              fullWidth={isMobile}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Users List */}
      {isMobile ? (
        // Mobile Card View
        <Grid container spacing={2}>
          {users.map((user) => (
            <Grid item xs={12} key={user._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: getRoleColor(user.role) + '.main' }}>
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">
                        {user.firstName} {user.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.phoneNumber || 'No phone number'}
                      </Typography>
                      {user.currentSalary && (
                        <Typography variant="body2" color="success.main" fontWeight="bold">
                          Salary: {formatCurrency(user.currentSalary.basicSalary)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={getRoleIcon(user.role)}
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        color={user.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Bills
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {user.stats?.billCount || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Sales
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        {formatCurrency(user.stats?.totalSales || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Received
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        {formatCurrency(user.stats?.totalReceiveAmount || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="warning.main">
                        {formatCurrency(user.stats?.totalPendingAmount || 0)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={2.4}>
                      <Typography variant="body2" color="text.secondary">
                        Current Salary
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="info.main">
                        {user.currentSalary ? formatCurrency(user.currentSalary.basicSalary) : 'Not set'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Manage User">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CurrencyRupee />}
                        onClick={() => handleManageUser(user)}
                        color="info"
                        sx={{ mr: 1 }}
                      >
                        Manage
                      </Button>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setUserForm({
                          firstName: user.firstName,
                          lastName: user.lastName,
                          email: user.email,
                          phoneNumber: user.phoneNumber || '',
                          password: '',
                          role: user.role,
                          isActive: user.isActive
                        });
                        setUserFormErrors({
                          firstName: '',
                          lastName: '',
                          email: '',
                          phoneNumber: '',
                          password: ''
                        });
                        setUserDialog({ open: true, user });
                      }}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleStatusToggle(user._id, user.isActive)}
                      color={user.isActive ? 'error' : 'success'}
                    >
                      {user.isActive ? <Block /> : <CheckCircle />}
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // Desktop Table View
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Current Active Salary</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Bills Created</TableCell>
                <TableCell align="right">Total Sales</TableCell>
                <TableCell align="right">Total Receive Amount</TableCell>
                <TableCell align="right">Total Pending Amount</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: getRoleColor(user.role) + '.main' }}>
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.phoneNumber || 'Not provided'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {user.currentSalary ? (
                      <Box>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                          {formatCurrency(user.currentSalary.basicSalary)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Since {formatDate(user.currentSalary.effectiveDate)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No salary set
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {user.stats?.billCount || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(user.stats?.totalSales || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(user.stats?.totalReceiveAmount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                      {formatCurrency(user.stats?.totalPendingAmount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(user.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Manage User">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CurrencyRupee />}
                          onClick={() => handleManageUser(user)}
                          color="info"
                          sx={{ mr: 1 }}
                        >
                          Manage User
                        </Button>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setUserForm({
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            phoneNumber: user.phoneNumber || '',
                            password: '',
                            role: user.role,
                            isActive: user.isActive
                          });
                          setUserFormErrors({
                            firstName: '',
                            lastName: '',
                            email: '',
                            phoneNumber: '',
                            password: ''
                          });
                          setUserDialog({ open: true, user });
                        }}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleStatusToggle(user._id, user.isActive)}
                        color={user.isActive ? 'error' : 'success'}
                      >
                        {user.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {users.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No users found
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {search || role || isActive ? 
                  'No users found matching your search criteria. Try adjusting your filters.' : 
                  'There are no users in the system yet. Users will appear here once they register.'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Total users in database: {pagination?.total || 0}
              </Typography>
            </Box>
          )}
        </TableContainer>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pagination.pages}
            page={pagination.current}
            onChange={(event, value) => setPage(value)}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
      )}

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, user: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit User: {editDialog.user?.firstName} {editDialog.user?.lastName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Email: {editDialog.user?.email}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Role
              </Typography>
              <TextField
                fullWidth
                select
                value={editDialog.user?.role || ''}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  user: { ...prev.user, role: e.target.value }
                }))}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={editDialog.user?.isActive || false}
                    onChange={(e) => setEditDialog(prev => ({
                      ...prev,
                      user: { ...prev.user, isActive: e.target.checked }
                    }))}
                  />
                }
                label="Active User"
              />
            </Box>

            {editDialog.user?.stats && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  User Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Clients
                    </Typography>
                    <Typography variant="h6">
                      {editDialog.user.stats.clientCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Bills
                    </Typography>
                    <Typography variant="h6">
                      {editDialog.user.stats.billCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="text.secondary">
                      Sales
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(editDialog.user.stats.totalSales)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, user: null })}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleRoleChange(editDialog.user._id, editDialog.user.role)}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Salary & Expenses Dialog */}
      <ManageUserDialog
        open={manageDialog.open}
        user={manageDialog.user}
        tab={manageDialog.tab}
        onClose={() => setManageDialog({ open: false, user: null, tab: 0 })}
        onTabChange={(newTab) => setManageDialog(prev => ({ ...prev, tab: newTab }))}
        onOpenSalaryDialog={openSalaryDialog}
        onOpenExpenseDialog={openExpenseDialog}
        onDeleteSalary={handleDeleteSalary}
        onExpenseAction={handleExpenseAction}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Salary Dialog */}
      <SalaryDialog
        open={salaryDialog.open}
        user={salaryDialog.user}
        salary={salaryDialog.salary}
        form={salaryForm}
        onFormChange={setSalaryForm}
        onClose={() => {
          setSalaryDialog({ open: false, user: null, salary: null })
          resetSalaryForm()
        }}
        onSave={handleCreateSalary}
      />

      {/* Expense Dialog */}
      <ExpenseDialog
        open={expenseDialog.open}
        user={expenseDialog.user}
        form={expenseForm}
        onFormChange={setExpenseForm}
        onClose={() => {
          setExpenseDialog({ open: false, user: null })
          resetExpenseForm()
        }}
        onSave={handleCreateExpense}
      />

      {/* User Dialog */}
      <UserDialog
        open={userDialog.open}
        user={userDialog.user}
        form={userForm}
        errors={userFormErrors}
        onFormChange={setUserForm}
        onErrorsChange={setUserFormErrors}
        onClose={() => {
          setUserDialog({ open: false, user: null })
          resetUserForm()
        }}
        onSave={handleCreateUser}
      />
    </Box>
  )
}

// Separate component for the management dialog
const ManageUserDialog = ({ 
  open, 
  user, 
  tab, 
  onClose, 
  onTabChange, 
  onOpenSalaryDialog, 
  onOpenExpenseDialog,
  onDeleteSalary,
  onExpenseAction,
  onDeleteExpense 
}) => {
  const { data: salariesData } = useGetSalariesQuery({ userId: user?._id, limit: 100 })
  const { data: expensesData } = useGetExpensesQuery({ userId: user?._id, limit: 100 })

  const salaries = salariesData?.data?.salaries || []
  const expenses = expensesData?.data?.expenses || []

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
      case 'Active': return 'success'
      default: return 'default'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Manage: {user?.firstName} {user?.lastName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab} onChange={(e, newValue) => onTabChange(newValue)}>
            <Tab label="Salary Management" icon={<AccountBalance />} />
            <Tab label="Expense Management" icon={<AttachMoney />} />
          </Tabs>
        </Box>

        {/* Salary Management Tab */}
        {tab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Salary Records</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => onOpenSalaryDialog(user)}
              >
                Add Salary
              </Button>
            </Box>

            {salaries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Salary Records
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a salary record for this user
                </Typography>
              </Box>
            ) : (
              <List>
                {salaries.map((salary, index) => (
                  <ListItem key={salary._id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatCurrency(salary.basicSalary)}
                          </Typography>
                          <Chip 
                            label={salary.status} 
                            color={getStatusColor(salary.status)}
                            size="small"
                          />
                          {salary.status === 'Active' && (
                            <Chip 
                              label="Current" 
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          )}
                          {index === 0 && (
                            <Chip 
                              label="Latest" 
                              color="info"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Effective Date: {formatDate(salary.effectiveDate)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created: {formatDate(salary.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => onOpenSalaryDialog(user, salary)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onDeleteSalary(salary._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}

        {/* Expense Management Tab */}
        {tab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Expense Claims</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => onOpenExpenseDialog(user)}
                color="secondary"
              >
                Add Expense
              </Button>
            </Box>

            {expenses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <AttachMoney sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Expense Claims
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This user hasn't submitted any expense claims yet
                </Typography>
              </Box>
            ) : (
              <List>
                {expenses.map((expense) => (
                  <ListItem key={expense._id} divider>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {formatCurrency(expense.amount)}
                          </Typography>
                          <Chip 
                            label={expense.status} 
                            color={getStatusColor(expense.status)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {expense.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Date: {formatDate(expense.expenseDate)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {expense.status === 'Pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                onClick={() => onExpenseAction(expense._id, 'Approved')}
                                color="success"
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const reason = prompt('Rejection reason:')
                                  if (reason) onExpenseAction(expense._id, 'Rejected', reason)
                                }}
                                color="error"
                              >
                                <Block />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => onDeleteExpense(expense._id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

// Separate component for salary dialog
const SalaryDialog = ({ open, user, salary, form, onFormChange, onClose, onSave }) => {
  const handleInputChange = (field, value) => {
    onFormChange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {salary ? 'Update' : 'Create'} Salary for {user?.firstName} {user?.lastName}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Salary Amount"
              type="number"
              value={form.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              InputProps={{ startAdornment: '₹' }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Effective Date"
              type="date"
              value={form.effectiveDate}
              onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={form.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          {salary ? 'Update' : 'Create'} Salary
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Separate component for expense dialog
const ExpenseDialog = ({ open, user, form, onFormChange, onClose, onSave }) => {
  const handleInputChange = (field, value) => {
    onFormChange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Expense for {user?.firstName} {user?.lastName}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              InputProps={{ startAdornment: '₹' }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Expense Date"
              type="date"
              value={form.expenseDate}
              onChange={(e) => handleInputChange('expenseDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          Add Expense
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Separate component for user dialog
const UserDialog = ({ open, user, form, errors, onFormChange, onErrorsChange, onClose, onSave }) => {
  const [debouncedEmail, setDebouncedEmail] = useState('')
  const [debouncedPhone, setDebouncedPhone] = useState('')

  // Debounce email and phone for validation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (form.email && form.email !== user?.email) {
        setDebouncedEmail(form.email)
      } else {
        setDebouncedEmail('')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.email, user?.email])

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (form.phoneNumber && form.phoneNumber !== user?.phoneNumber) {
        setDebouncedPhone(form.phoneNumber)
      } else {
        setDebouncedPhone('')
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [form.phoneNumber, user?.phoneNumber])

  // Check email availability
  const { data: emailCheck } = useCheckEmailAvailabilityQuery(
    { email: debouncedEmail, userId: user?._id },
    { skip: !debouncedEmail || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(debouncedEmail) }
  )

  // Check phone availability
  const { data: phoneCheck } = useCheckPhoneAvailabilityQuery(
    { phone: debouncedPhone, userId: user?._id },
    { skip: !debouncedPhone || !/^[0-9]{10}$/.test(debouncedPhone) }
  )

  // Update errors based on availability checks
  React.useEffect(() => {
    if (emailCheck && !emailCheck.data.available) {
      onErrorsChange(prev => ({
        ...prev,
        email: emailCheck.data.message
      }))
    }
  }, [emailCheck, onErrorsChange])

  React.useEffect(() => {
    if (phoneCheck && !phoneCheck.data.available) {
      onErrorsChange(prev => ({
        ...prev,
        phoneNumber: phoneCheck.data.message
      }))
    }
  }, [phoneCheck, onErrorsChange])

  const handleInputChange = (field, value) => {
    onFormChange(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      onErrorsChange(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {user ? 'Edit User' : 'Add New User'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={form.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={!!errors.firstName}
              helperText={errors.firstName}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={form.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={!!errors.lastName}
              helperText={errors.lastName}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              required
              InputProps={{
                endAdornment: debouncedEmail && !errors.email && emailCheck?.data?.available ? (
                  <InputAdornment position="end">
                    <CheckCircle color="success" fontSize="small" />
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Phone Number"
              value={form.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber || "Optional: Enter a valid 10-digit phone number"}
              placeholder="Enter 10-digit phone number"
              InputProps={{
                endAdornment: debouncedPhone && !errors.phoneNumber && phoneCheck?.data?.available ? (
                  <InputAdornment position="end">
                    <CheckCircle color="success" fontSize="small" />
                  </InputAdornment>
                ) : null
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={!!errors.password}
              helperText={
                errors.password || 
                (user ? 
                  "Leave blank to keep current password, or enter new password to change it" : 
                  "Enter a secure password (minimum 6 characters)"
                )
              }
              required={!user}
              placeholder={user ? "Enter new password to change" : "Enter password"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Role"
              value={form.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
            >
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                />
              }
              label="Active User"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          {user ? 'Update' : 'Create'} User
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UsersPage