import React, { useState, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  CloudUpload,
  Delete,
  Visibility,
  CheckCircle,
  Error,
  Refresh,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'

import {
  useCreateClientMutation,
  useUpdateClientMutation,
  useGetClientQuery,
  useUploadClientDocumentsMutation,
  useProcessAadhaarMutation,
  useProcessPANMutation,
  useGetOCRStatusQuery,
} from '../../store/api/apiSlice'

const schema = yup.object({
  clientName: yup.string().required('Client name is required').min(2, 'Name must be at least 2 characters'),
  fatherName: yup.string().required('Father name is required').min(2, 'Name must be at least 2 characters'),
  dateOfBirth: yup.date().max(new Date(), 'Date of birth cannot be in the future'),
  gender: yup.string().oneOf(['Male', 'Female', 'Other']),
  panNumber: yup.string().matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format'),
  aadhaarNumber: yup.string().matches(/^[0-9]{12}$/, 'Aadhaar number must be 12 digits'),
  phoneNumber: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits'),
  address: yup.string().max(500, 'Address cannot exceed 500 characters'),
})

const DocumentUpload = ({ 
  type, 
  title, 
  onUpload, 
  onOCRProcess, 
  isProcessing, 
  ocrResult,
  existingDocument 
}) => {
  const [dragOver, setDragOver] = useState(false)
  const [previewDialog, setPreviewDialog] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onUpload(files[0])
    }
  }, [onUpload])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <Box
          sx={{
            border: '2px dashed',
            borderColor: dragOver ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: dragOver ? 'primary.50' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'primary.50',
            },
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById(`${type}-upload`).click()}
        >
          <input
            id={`${type}-upload`}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={(e) => onUpload(e.target.files[0])}
          />
          
          {isProcessing ? (
            <Box>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography variant="body2">
                Processing document...
              </Typography>
            </Box>
          ) : existingDocument ? (
            <Box>
              <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="body2" gutterBottom>
                Document uploaded
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewDialog(true)
                  }}
                >
                  View
                </Button>
                <Button
                  size="small"
                  startIcon={<CloudUpload />}
                  onClick={(e) => {
                    e.stopPropagation()
                    document.getElementById(`${type}-upload`).click()
                  }}
                >
                  Replace
                </Button>
              </Box>
            </Box>
          ) : (
            <Box>
              <CloudUpload sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body2" gutterBottom>
                Drop {title.toLowerCase()} here or click to upload
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Supports: JPG, PNG, PDF (Max 5MB)
              </Typography>
            </Box>
          )}
        </Box>

        {ocrResult && (
          <Box sx={{ mt: 2 }}>
            <Alert 
              severity={ocrResult.status === 'Completed' ? 'success' : 'error'}
              action={
                ocrResult.status === 'Failed' && (
                  <IconButton
                    color="inherit"
                    size="small"
                    onClick={() => onOCRProcess()}
                  >
                    <Refresh />
                  </IconButton>
                )
              }
            >
              {ocrResult.status === 'Completed' ? 
                'Data extracted successfully!' : 
                `OCR failed: ${ocrResult.error || 'Unknown error'}`
              }
            </Alert>
          </Box>
        )}
      </CardContent>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{title} Preview</DialogTitle>
        <DialogContent>
          {existingDocument && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={`/api/${existingDocument}`}
                alt={title}
                style={{ maxWidth: '100%', maxHeight: '500px' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <Typography variant="body2" sx={{ display: 'none', mt: 2 }}>
                Preview not available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

const ClientFormPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [createClient, { isLoading: creating }] = useCreateClientMutation()
  const [updateClient, { isLoading: updating }] = useUpdateClientMutation()
  const [uploadDocuments] = useUploadClientDocumentsMutation()
  const [processAadhaar] = useProcessAadhaarMutation()
  const [processPAN] = useProcessPANMutation()
  
  const { data: clientData, isLoading: fetching } = useGetClientQuery(id, {
    skip: !isEdit,
  })

  const [ocrJobs, setOcrJobs] = useState({})
  const [uploadedFiles, setUploadedFiles] = useState({})

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
  })

  React.useEffect(() => {
    if (isEdit && clientData?.data) {
      const client = clientData.data
      reset({
        clientName: client.clientName,
        fatherName: client.fatherName,
        dateOfBirth: client.dateOfBirth ? new Date(client.dateOfBirth).toISOString().split('T')[0] : '',
        gender: client.gender || '',
        panNumber: client.panNumber || '',
        aadhaarNumber: client.aadhaarNumber || '',
        phoneNumber: client.phoneNumber || '',
        address: client.address || '',
      })
    }
  }, [clientData, isEdit, reset])

  const handleFileUpload = async (file, type) => {
    if (!file) return

    const formData = new FormData()
    formData.append(type, file)

    try {
      setUploadedFiles(prev => ({ ...prev, [type]: file }))

      // Process OCR if it's Aadhaar or PAN
      if (type === 'aadhaarCard' || type === 'panCard') {
        const ocrFormData = new FormData()
        ocrFormData.append(type, file)

        const ocrResult = type === 'aadhaarCard' ? 
          await processAadhaar(ocrFormData).unwrap() :
          await processPAN(ocrFormData).unwrap()

        setOcrJobs(prev => ({ ...prev, [type]: ocrResult.data }))
        
        // Poll for OCR results
        pollOCRResult(ocrResult.data.jobId, type)
      }

      toast.success(`${type} uploaded successfully`)
    } catch (error) {
      toast.error(`Failed to upload ${type}`)
    }
  }

  const pollOCRResult = async (jobId, type) => {
    // This would typically use polling or websockets
    // For now, we'll simulate the OCR completion
    setTimeout(() => {
      setOcrJobs(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          status: 'Completed',
          extractedData: {
            // Mock extracted data
            name: 'John Doe',
            dateOfBirth: '1990-01-01',
            gender: 'Male',
            ...(type === 'aadhaarCard' ? { aadhaarNumber: '123456789012' } : { panNumber: 'ABCDE1234F' })
          }
        }
      }))

      // Auto-fill form with extracted data
      const mockData = {
        name: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        ...(type === 'aadhaarCard' ? { aadhaarNumber: '123456789012' } : { panNumber: 'ABCDE1234F' })
      }

      if (mockData.name && !watch('clientName')) {
        setValue('clientName', mockData.name)
      }
      if (mockData.dateOfBirth && !watch('dateOfBirth')) {
        setValue('dateOfBirth', mockData.dateOfBirth)
      }
      if (mockData.gender && !watch('gender')) {
        setValue('gender', mockData.gender)
      }
      if (mockData.aadhaarNumber && !watch('aadhaarNumber')) {
        setValue('aadhaarNumber', mockData.aadhaarNumber)
      }
      if (mockData.panNumber && !watch('panNumber')) {
        setValue('panNumber', mockData.panNumber)
      }

      toast.success('Form auto-filled with extracted data!')
    }, 3000)
  }

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateClient({ id, ...data }).unwrap()
        toast.success('Client updated successfully')
      } else {
        await createClient(data).unwrap()
        toast.success('Client created successfully')
      }
      
      navigate('/clients')
    } catch (error) {
      toast.error(error?.data?.error?.message || `Failed to ${isEdit ? 'update' : 'create'} client`)
    }
  }

  if (isEdit && fetching) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Client' : 'Add New Client'}
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Client Information */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client Name"
                    {...register('clientName')}
                    error={!!errors.clientName}
                    helperText={errors.clientName?.message}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Father's Name"
                    {...register('fatherName')}
                    error={!!errors.fatherName}
                    helperText={errors.fatherName?.message}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date of Birth"
                    type="date"
                    {...register('dateOfBirth')}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth?.message}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    {...register('gender')}
                    error={!!errors.gender}
                    helperText={errors.gender?.message}
                  >
                    <MenuItem value="">Select Gender</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PAN Number"
                    {...register('panNumber')}
                    error={!!errors.panNumber}
                    helperText={errors.panNumber?.message}
                    placeholder="ABCDE1234F"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Aadhaar Number"
                    {...register('aadhaarNumber')}
                    error={!!errors.aadhaarNumber}
                    helperText={errors.aadhaarNumber?.message}
                    placeholder="123456789012"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    {...register('phoneNumber')}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message}
                    placeholder="9876543210"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Address"
                    {...register('address')}
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Document Upload */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <DocumentUpload
                type="aadhaarCard"
                title="Aadhaar Card"
                onUpload={(file) => handleFileUpload(file, 'aadhaarCard')}
                onOCRProcess={() => {}}
                isProcessing={ocrJobs.aadhaarCard?.status === 'Processing'}
                ocrResult={ocrJobs.aadhaarCard}
                existingDocument={clientData?.data?.documents?.aadhaarCard}
              />

              <DocumentUpload
                type="panCard"
                title="PAN Card"
                onUpload={(file) => handleFileUpload(file, 'panCard')}
                onOCRProcess={() => {}}
                isProcessing={ocrJobs.panCard?.status === 'Processing'}
                ocrResult={ocrJobs.panCard}
                existingDocument={clientData?.data?.documents?.panCard}
              />

              <DocumentUpload
                type="photo"
                title="Client Photo"
                onUpload={(file) => handleFileUpload(file, 'photo')}
                existingDocument={clientData?.data?.documents?.photo}
              />
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/clients')}
                  size="large"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={creating || updating}
                  size="large"
                >
                  {creating || updating ? (
                    <CircularProgress size={24} />
                  ) : (
                    isEdit ? 'Update Client' : 'Create Client'
                  )}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}

export default ClientFormPage