import React from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  CircularProgress,
  Container,
  MenuItem,
} from '@mui/material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'

import { useRegisterMutation } from '../../store/api/apiSlice'
import { loginSuccess } from '../../store/slices/authSlice'

const schema = yup.object({
  firstName: yup.string().required('First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: yup.string().required('Last name is required').min(2, 'Last name must be at least 2 characters'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup.string()
    .required('Confirm password is required')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  role: yup.string().oneOf(['User', 'Admin']).required('Role is required'),
})

const RegisterPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [register, { isLoading }] = useRegisterMutation()

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      role: 'User',
    },
  })

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...registerData } = data
      const result = await register(registerData).unwrap()
      
      dispatch(loginSuccess(result.data))
      toast.success('Registration successful!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error?.data?.error?.message || 'Registration failed')
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
            Sign Up
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your Business Billing account
          </Typography>

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="firstName"
                label="First Name"
                name="firstName"
                autoComplete="given-name"
                autoFocus
                {...registerField('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastName"
                autoComplete="family-name"
                {...registerField('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Box>

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              {...registerField('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              select
              id="role"
              label="Role"
              name="role"
              {...registerField('role')}
              error={!!errors.role}
              helperText={errors.role?.message}
            >
              <MenuItem value="User">User</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              {...registerField('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              {...registerField('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign In
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}

export default RegisterPage