import React, { useState, useRef } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
} from '@mui/material'
import {
  ArrowBack,
  Save,
  AttachFile,
  Delete,
  Receipt,
  AttachMoney,
  CalendarToday,
  Category,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'

import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useGetExpenseQuery,
} from '../../store/api/apiSlice'

const schema = yup.object({
  title: yup.string().required('Title is required').max(100, 'Title cannot exceed 100 characters'),
  description: yup.string().max(500, 'Description cannot exceed 500 characters'),
  category: yup.string().required('Category is required'),
  amount: yup.number().required('Amount is required').min(0, 'Amount cannot be negative'),
  expenseDate: yup.date().required('Expense date is required').max(new Date(), 'Expense date cannot be in the future'),
})

const ExpenseFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const fileInputRef = useRef(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)

  const { data: expenseData, isLoading: fetching } = useGetExpenseQuery(id, {
    skip: !isEdit,
  })

  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation()
  const [updateExpense, { isLoading: updating }] = useUpdateExpenseMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
    },
  })

  // Load expense data for editing
  React.useEffect(() => {
    if (isEdit && expenseData?.data) {
      const expense = expenseData.data
      reset({
        title: expense.title,
        description: expense.description || '',
        category: expense.category,
        amount: expense.amount,
        expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      })
      
      if (expense.receipt) {
        setFilePreview(expense.receipt.path)
      }
    }
  }, [isEdit, expenseData, reset])

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, and PDF files are allowed')
        return
      }

      setSelectedFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setFilePreview(e.target.result)
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data) => {
    try {
      const formData = new FormData()
      
      // Append form data
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key])
        }
      })

      // Append file if selected
      if (selectedFile) {
        formData.append('receipt', selectedFile)
      }

      if (isEdit) {
        await updateExpense({ id, ...Object.fromEntries(formData) }).unwrap()
        toast.success('Expense updated successfully')
      } else {
        await createExpense(Object.fromEntries(formData)).unwrap()
        toast.success('Expense created successfully')
      }
      
      navigate('/expenses')
    } catch (error) {
      console.error('Expense submission error:', error)
      toast.error(error?.data?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} expense`)
    }
  }

  const categories = [
    'Travel', 'Food', 'Office Supplies', 'Equipment', 'Software',
    'Marketing', 'Training', 'Utilities', 'Rent', 'Maintenance', 'Other'
  ]

  if (isEdit && fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
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
            {isEdit ? 'Edit Expense' : 'Add New Expense'}
          </Typography>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt />
                Expense Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Expense Title"
                    {...register('title')}
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    {...register('description')}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    multiline
                    rows={3}
                    placeholder="Optional description of the expense..."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required error={!!errors.category}>
                    <InputLabel>Category</InputLabel>
                    <Select
                      {...register('category')}
                      label="Category"
                      startAdornment={
                        <InputAdornment position="start">
                          <Category />
                        </InputAdornment>
                      }
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                        {errors.category.message}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    step="0.01"
                    {...register('amount')}
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Expense Date"
                    type="date"
                    {...register('expenseDate')}
                    error={!!errors.expenseDate}
                    helperText={errors.expenseDate?.message}
                    required
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Receipt Upload */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Receipt (Optional)
                  </Typography>
                  
                  <Card variant="outlined" sx={{ p: 2 }}>
                    {filePreview ? (
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            {selectedFile ? selectedFile.name : 'Current receipt'}
                          </Typography>
                          <IconButton color="error" onClick={handleRemoveFile} size="small">
                            <Delete />
                          </IconButton>
                        </Box>
                        {filePreview.startsWith('data:image') || filePreview.includes('image') ? (
                          <Box sx={{ textAlign: 'center' }}>
                            <img 
                              src={filePreview} 
                              alt="Receipt preview" 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '200px', 
                                objectFit: 'contain',
                                borderRadius: '4px'
                              }} 
                            />
                          </Box>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <AttachFile sx={{ fontSize: 48, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              PDF Receipt Attached
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <AttachFile sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Upload receipt (JPEG, PNG, PDF - Max 5MB)
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => fileInputRef.current?.click()}
                          startIcon={<AttachFile />}
                        >
                          Choose File
                        </Button>
                      </Box>
                    )}
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Summary Sidebar */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ 
              p: 3, 
              position: isMobile ? 'relative' : 'sticky', 
              top: isMobile ? 'auto' : 100, 
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: 3
            }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}>
                <AttachMoney />
                Expense Summary
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  Your expense will be submitted for approval. You can edit it until it's approved or rejected.
                </Typography>
              </Alert>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={creating || updating ? <CircularProgress size={20} /> : <Save />}
                  disabled={creating || updating}
                  fullWidth
                  size="large"
                  sx={{ py: 1.5 }}
                >
                  {creating || updating ? 'Saving...' : (isEdit ? 'Update Expense' : 'Submit Expense')}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate('/expenses')}
                  fullWidth
                  size="large"
                >
                  Cancel
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}

export default ExpenseFormPage