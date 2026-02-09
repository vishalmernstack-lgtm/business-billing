import React, { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  Container,
  InputAdornment,
  IconButton,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'

import { useLoginMutation } from '../../store/api/apiSlice'
import { loginSuccess } from '../../store/slices/authSlice'

const schema = yup.object({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().required('Password is required'),
})

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: ''
  })

  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
  })

  const handleInputChange = (field) => {
    // Clear field-specific errors when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
    if (loginError) {
      setLoginError('')
    }
    clearErrors(field)
  }

  const onSubmit = async (data) => {
    try {
      // Clear previous errors
      setLoginError('')
      setFieldErrors({ email: '', password: '' })
      
      const result = await login(data).unwrap()
      
      dispatch(loginSuccess(result.data))
      toast.success('Login successful!')
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
      
      const errorMessage = error?.data?.error?.message || error?.message || 'Login failed'
      const errorType = error?.data?.error?.type || 'unknown'
      const errorField = error?.data?.error?.field
      
      // Handle specific error cases
      if (errorType === 'validation') {
        // Handle validation errors
        if (errorField === 'email') {
          setFieldErrors(prev => ({ ...prev, email: errorMessage }))
          setError('email', { message: errorMessage })
        } else if (errorField === 'password') {
          setFieldErrors(prev => ({ ...prev, password: errorMessage }))
          setError('password', { message: errorMessage })
        }
      } else if (errorType === 'authentication') {
        // Handle authentication errors
        if (errorMessage.includes('No account found')) {
          setFieldErrors(prev => ({ ...prev, email: 'No account found with this email address' }))
          setError('email', { message: 'No account found with this email address' })
        } else if (errorMessage.includes('Incorrect password')) {
          setFieldErrors(prev => ({ ...prev, password: 'Incorrect password provided' }))
          setError('password', { message: 'Incorrect password provided' })
        } else if (errorMessage.includes('Account is deactivated')) {
          setLoginError('Your account has been deactivated. Please contact support to reactivate your account.')
        } else if (errorMessage.includes('Invalid credentials')) {
          // Generic invalid credentials - could be either email or password
          setFieldErrors({
            email: 'Please check your email and password',
            password: 'Please check your email and password'
          })
          setError('email', { message: 'Please check your email and password' })
          setError('password', { message: 'Please check your email and password' })
        }
      } else {
        // Handle other errors
        setLoginError(errorMessage)
      }
      
      // Show toast with user-friendly message
      if (errorMessage.includes('No account found')) {
        toast.error('No account found with this email address')
      } else if (errorMessage.includes('Incorrect password')) {
        toast.error('Incorrect password provided')
      } else if (errorMessage.includes('Account is deactivated')) {
        toast.error('Account is deactivated. Please contact support.')
      } else {
        toast.error('Login failed. Please check your credentials.')
      }
    }
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Sign In
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back to Business Billing Software
          </Typography>

          {loginError && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {loginError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              onChange={(e) => {
                register('email').onChange(e)
                handleInputChange('email')
              }}
              error={!!errors.email || !!fieldErrors.email}
              helperText={errors.email?.message || fieldErrors.email || 'Enter your registered email address'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color={errors.email || fieldErrors.email ? 'error' : 'action'} />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              {...register('password')}
              onChange={(e) => {
                register('password').onChange(e)
                handleInputChange('password')
              }}
              error={!!errors.password || !!fieldErrors.password}
              helperText={errors.password?.message || fieldErrors.password || 'Enter your password'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color={errors.password || fieldErrors.password ? 'error' : 'action'} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              size="large"
            >
              {isLoading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <Typography variant="button">Signing In...</Typography>
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                Don't have an account? Sign Up
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default LoginPage