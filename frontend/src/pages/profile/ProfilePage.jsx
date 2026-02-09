import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Container,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Person,
  Email,
  Badge,
  Edit,
  Save,
  Cancel,
  Lock,
  AccountCircle,
  Security,
  Info,
  CalendarToday,
  Update,
} from '@mui/icons-material'
import { useSelector } from 'react-redux'
import { selectUser } from '../../store/slices/authSlice'
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from '../../store/api/apiSlice'

const ProfilePage = () => {
  const user = useSelector(selectUser)
  const [isEditing, setIsEditing] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const { data: profileData, isLoading, error } = useGetProfileQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()

  // Use profile data from API or fallback to Redux user
  const currentUser = profileData?.data || user

  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
      })
    }
  }, [currentUser])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to current user data
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
      })
    }
  }

  const handleSave = async () => {
    try {
      await updateProfile(formData).unwrap()
      setIsEditing(false)
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' })
    } catch (error) {
      console.error('Failed to update profile:', error)
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' })
    }
  }

  const handlePasswordSubmit = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({ open: true, message: 'Passwords do not match', severity: 'error' })
      return
    }

    try {
      await changePassword(passwordData).unwrap()
      setPasswordDialogOpen(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' })
    } catch (error) {
      console.error('Failed to change password:', error)
      setSnackbar({ 
        open: true, 
        message: error.data?.error?.message || 'Failed to change password', 
        severity: 'error' 
      })
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load profile data. Please try again.
        </Alert>
      </Box>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 1
          }}
        >
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and personal information
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column - Profile Overview */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Profile Card */}
            <Card 
              elevation={3}
              sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {getInitials(currentUser?.firstName, currentUser?.lastName)}
                </Avatar>
                
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 1 }}>
                  {currentUser?.firstName} {currentUser?.lastName}
                </Typography>
                
                <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                  {currentUser?.email}
                </Typography>
                
                <Chip
                  icon={<Badge />}
                  label={currentUser?.role}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info color="primary" />
                  Account Status
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip 
                      label={currentUser?.isActive ? 'Active' : 'Inactive'}
                      color={currentUser?.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Member Since</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column - Profile Details */}
        <Grid item xs={12} lg={8}>
          <Stack spacing={3}>
            {/* Personal Information Card */}
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountCircle color="primary" sx={{ fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Personal Information
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Tooltip title="Change Password">
                      <Button
                        variant="outlined"
                        startIcon={<Lock />}
                        onClick={() => setPasswordDialogOpen(true)}
                        sx={{ borderRadius: 2 }}
                      >
                        Password
                      </Button>
                    </Tooltip>
                    
                    {!isEditing ? (
                      <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={handleEdit}
                        sx={{ borderRadius: 2 }}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancel}
                          disabled={isUpdating}
                          sx={{ borderRadius: 2 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={isUpdating ? <CircularProgress size={16} /> : <Save />}
                          onClick={handleSave}
                          disabled={isUpdating}
                          sx={{ borderRadius: 2 }}
                        >
                          Save Changes
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ mb: 4 }} />

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      sx={{
                        '& .MuiFilledInput-root': {
                          bgcolor: 'grey.50',
                          '&:hover': { bgcolor: 'grey.100' }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      variant={isEditing ? "outlined" : "filled"}
                      InputProps={{
                        startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      sx={{
                        '& .MuiFilledInput-root': {
                          bgcolor: 'grey.50',
                          '&:hover': { bgcolor: 'grey.100' }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={currentUser?.email || ''}
                      disabled
                      variant="filled"
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      helperText="Email address cannot be changed"
                      sx={{
                        '& .MuiFilledInput-root': {
                          bgcolor: 'grey.50',
                          '&:hover': { bgcolor: 'grey.100' }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={currentUser?.role || ''}
                      disabled
                      variant="filled"
                      InputProps={{
                        startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                      helperText="Role is managed by administrators"
                      sx={{
                        '& .MuiFilledInput-root': {
                          bgcolor: 'grey.50',
                          '&:hover': { bgcolor: 'grey.100' }
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account Status"
                      value={currentUser?.isActive ? 'Active' : 'Inactive'}
                      disabled
                      variant="filled"
                      helperText="Account status is managed by administrators"
                      sx={{
                        '& .MuiFilledInput-root': {
                          bgcolor: 'grey.50',
                          '&:hover': { bgcolor: 'grey.100' }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Account Timeline Card */}
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <CalendarToday color="primary" sx={{ fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Account Timeline
                  </Typography>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper 
                      elevation={1}
                      sx={{ 
                        p: 3, 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'primary.light',
                        bgcolor: 'primary.50'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CalendarToday color="primary" fontSize="small" />
                        <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                          Member Since
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentUser?.createdAt ? 
                          `${Math.floor((new Date() - new Date(currentUser.createdAt)) / (1000 * 60 * 60 * 24))} days ago`
                          : 'Unknown'
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper 
                      elevation={1}
                      sx={{ 
                        p: 3, 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'success.light',
                        bgcolor: 'success.50'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Update color="success" fontSize="small" />
                        <Typography variant="subtitle2" color="success.main" fontWeight="bold">
                          Last Updated
                        </Typography>
                      </Box>
                      <Typography variant="h6" fontWeight="bold">
                        {currentUser?.updatedAt ? new Date(currentUser.updatedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }) : 'N/A'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {currentUser?.updatedAt ? 
                          `${Math.floor((new Date() - new Date(currentUser.updatedAt)) / (1000 * 60 * 60 * 24))} days ago`
                          : 'Never updated'
                        }
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Enhanced Password Change Dialog */}
      <Dialog 
        open={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color="primary" />
            <Typography variant="h6" component="span" fontWeight="bold">
              Change Password
            </Typography>
          </Box>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Choose a strong password with at least 6 characters for better security.
          </Alert>
          
          <Stack spacing={3}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              required
              variant="outlined"
            />
            
            <TextField
              fullWidth
              type="password"
              label="New Password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              helperText="Password must be at least 6 characters"
              variant="outlined"
            />
            
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              error={Boolean(passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword)}
              helperText={
                passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                  ? 'Passwords do not match'
                  : 'Re-enter your new password'
              }
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setPasswordDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordSubmit}
            disabled={
              isChangingPassword ||
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              !passwordData.confirmPassword ||
              passwordData.newPassword !== passwordData.confirmPassword
            }
            startIcon={isChangingPassword ? <CircularProgress size={16} /> : <Lock />}
            sx={{ borderRadius: 2 }}
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: 3
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default ProfilePage