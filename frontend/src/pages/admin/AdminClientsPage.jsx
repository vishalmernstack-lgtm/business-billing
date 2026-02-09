import React, { useState } from 'react'
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
} from '@mui/material'
import {
  Search,
  FilterList,
  Visibility,
  Person,
  Business,
  Phone,
  Email,
  LocationOn,
} from '@mui/icons-material'

import { useGetAdminClientsQuery } from '../../store/api/apiSlice'

const AdminClientsPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const [viewDialog, setViewDialog] = useState({ open: false, client: null })
  
  const { data, isLoading, error } = useGetAdminClientsQuery({
    page,
    limit: 10,
    userId,
  })

  const handleViewClient = (client) => {
    setViewDialog({ open: true, client })
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
        Failed to load clients. Please try again.
      </Alert>
    )
  }

  const clients = data?.data?.clients || []
  const pagination = data?.data?.pagination || {}

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" gutterBottom>
        All Clients
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        View and manage all client records across all users
      </Typography>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Filter by User"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <MenuItem value="">All Users</MenuItem>
              {/* This would be populated with actual users */}
              <MenuItem value="user1">John Doe</MenuItem>
              <MenuItem value="user2">Jane Smith</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearch('')
                setUserId('')
              }}
              fullWidth={isMobile}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Clients List */}
      {isMobile ? (
        // Mobile Card View
        <Grid container spacing={2}>
          {clients.map((client) => (
            <Grid item xs={12} key={client._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {client.clientName.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">
                        {client.clientName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Father: {client.fatherName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created by: {client.createdBy?.firstName} {client.createdBy?.lastName}
                      </Typography>
                    </Box>
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        PAN Number
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {client.panNumber || 'Not provided'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {client.phoneNumber || 'Not provided'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
                    {client.documents?.aadhaarCard && (
                      <Chip label="Aadhaar" size="small" color="primary" />
                    )}
                    {client.documents?.panCard && (
                      <Chip label="PAN" size="small" color="secondary" />
                    )}
                    {client.documents?.photo && (
                      <Chip label="Photo" size="small" color="success" />
                    )}
                  </Box>

                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewClient(client)}
                    fullWidth
                  >
                    View Details
                  </Button>
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
                <TableCell>Client</TableCell>
                <TableCell>Father's Name</TableCell>
                <TableCell>PAN Number</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Documents</TableCell>
                <TableCell>Created By</TableCell>
                <TableCell>Date Added</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {client.clientName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {client.clientName}
                        </Typography>
                        {client.gender && (
                          <Typography variant="caption" color="text.secondary">
                            {client.gender}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{client.fatherName}</TableCell>
                  <TableCell>
                    {client.panNumber ? (
                      <Chip label={client.panNumber} size="small" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not provided
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {client.phoneNumber || (
                      <Typography variant="body2" color="text.secondary">
                        Not provided
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {client.documents?.aadhaarCard && (
                        <Chip label="Aadhaar" size="small" color="primary" />
                      )}
                      {client.documents?.panCard && (
                        <Chip label="PAN" size="small" color="secondary" />
                      )}
                      {client.documents?.photo && (
                        <Chip label="Photo" size="small" color="success" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {client.createdBy?.firstName} {client.createdBy?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {client.createdBy?.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(client.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewClient(client)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {clients.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No clients found.
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

      {/* View Client Dialog */}
      <Dialog
        open={viewDialog.open}
        onClose={() => setViewDialog({ open: false, client: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Client Details: {viewDialog.client?.clientName}
        </DialogTitle>
        <DialogContent>
          {viewDialog.client && (
            <Grid container spacing={3} sx={{ pt: 2 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Personal Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {viewDialog.client.clientName}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Father's Name
                        </Typography>
                        <Typography variant="body1">
                          {viewDialog.client.fatherName}
                        </Typography>
                      </Box>
                    </Box>

                    {viewDialog.client.dateOfBirth && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Date of Birth
                        </Typography>
                        <Typography variant="body1">
                          {new Date(viewDialog.client.dateOfBirth).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    )}

                    {viewDialog.client.gender && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Gender
                        </Typography>
                        <Typography variant="body1">
                          {viewDialog.client.gender}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Contact Information
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {viewDialog.client.phoneNumber && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Phone Number
                          </Typography>
                          <Typography variant="body1">
                            {viewDialog.client.phoneNumber}
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {viewDialog.client.address && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <LocationOn fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Address
                          </Typography>
                          <Typography variant="body1">
                            {viewDialog.client.address}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Documents & IDs
                  </Typography>
                  <Grid container spacing={2}>
                    {viewDialog.client.panNumber && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            PAN Number
                          </Typography>
                          <Typography variant="h6" color="primary">
                            {viewDialog.client.panNumber}
                          </Typography>
                        </Box>
                      </Grid>
                    )}

                    {viewDialog.client.aadhaarNumber && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Aadhaar Number
                          </Typography>
                          <Typography variant="h6" color="secondary">
                            {viewDialog.client.aadhaarNumber}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Uploaded Documents
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {viewDialog.client.documents?.aadhaarCard && (
                        <Chip label="Aadhaar Card" color="primary" />
                      )}
                      {viewDialog.client.documents?.panCard && (
                        <Chip label="PAN Card" color="secondary" />
                      )}
                      {viewDialog.client.documents?.photo && (
                        <Chip label="Photo" color="success" />
                      )}
                      {!viewDialog.client.documents?.aadhaarCard && 
                       !viewDialog.client.documents?.panCard && 
                       !viewDialog.client.documents?.photo && (
                        <Typography variant="body2" color="text.secondary">
                          No documents uploaded
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    System Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Created By
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {viewDialog.client.createdBy?.firstName} {viewDialog.client.createdBy?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {viewDialog.client.createdBy?.email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Date Added
                      </Typography>
                      <Typography variant="body1">
                        {new Date(viewDialog.client.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(viewDialog.client.createdAt).toLocaleTimeString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog({ open: false, client: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AdminClientsPage