import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material'
import {
  Business,
  Email,
  Phone,
  LocationOn,
  Language,
  Save,
  CloudUpload,
  Delete,
} from '@mui/icons-material'
import { useGetCompanySettingsQuery, useUpdateCompanySettingsMutation } from '../../store/api/apiSlice'
import toast from 'react-hot-toast'

const CompanySettingsPage = () => {
  const { data: settingsData, isLoading, error } = useGetCompanySettingsQuery()
  const [updateSettings, { isLoading: updating }] = useUpdateCompanySettingsMutation()

  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstNumber: '',
    website: '',
  })

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)

  useEffect(() => {
    if (settingsData?.data) {
      const settings = settingsData.data
      setFormData({
        companyName: settings.companyName || '',
        email: settings.email || '',
        phone: settings.phone || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        pincode: settings.pincode || '',
        gstNumber: settings.gstNumber || '',
        website: settings.website || '',
      })
      
      if (settings.logo) {
        setLogoPreview(`http://localhost:5000/uploads/logos/${settings.logo}`)
      }
    }
  }, [settingsData])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file size should be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const submitData = {
        ...formData
      }

      if (logoFile) {
        submitData.logo = logoFile
      }

      await updateSettings(submitData).unwrap()
      toast.success('Company settings updated successfully!')
    } catch (error) {
      console.error('Update error:', error)
      toast.error(error?.data?.error?.message || 'Failed to update settings')
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load company settings. Please try again.
      </Alert>
    )
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business color="primary" />
          Company Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your company information and logo. These details will appear on all printed bills.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Company Logo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload your company logo (Max 5MB, PNG/JPG/JPEG)
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar
                  src={logoPreview}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.light',
                    fontSize: '3rem'
                  }}
                >
                  {!logoPreview && <Business sx={{ fontSize: '3rem' }} />}
                </Avatar>

                <Box>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="logo-upload"
                    type="file"
                    onChange={handleLogoChange}
                  />
                  <label htmlFor="logo-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 1 }}
                    >
                      Upload Logo
                    </Button>
                  </label>
                  {logoPreview && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={handleRemoveLogo}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Company Name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    InputProps={{
                      startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="GST Number"
                    value={formData.gstNumber}
                    onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    multiline
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    InputProps={{
                      startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="State"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Pincode"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    InputProps={{
                      startAdornment: <Language sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    placeholder="https://www.example.com"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <Save />}
                disabled={updating}
                sx={{
                  minWidth: 150,
                  bgcolor: '#2e7d32',
                  '&:hover': {
                    bgcolor: '#1b5e20'
                  }
                }}
              >
                {updating ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  )
}

export default CompanySettingsPage
