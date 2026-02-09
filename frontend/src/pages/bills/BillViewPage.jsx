import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  Print,
  Send,
  GetApp,
  Share,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useGetBillQuery } from '../../store/api/apiSlice'

const BillViewPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const { data, isLoading, error } = useGetBillQuery(id)

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bill ${bill.billNumber}`,
          text: `Bill for ${bill.client?.clientName} - Amount: ₹${bill.totalAmount}`,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast.success('Bill link copied to clipboard')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success'
      case 'Sent': return 'warning'
      case 'Draft': return 'default'
      default: return 'default'
    }
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
        Failed to load bill. Please try again.
      </Alert>
    )
  }

  const bill = data?.data

  if (!bill) {
    return (
      <Alert severity="error">
        Bill not found.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', md: 'center' },
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3,
        '@media print': { display: 'none' }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/bills')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">
            Bill Details
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate(`/bills/${id}/edit`)}
            size={isMobile ? 'small' : 'medium'}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrint}
            size={isMobile ? 'small' : 'medium'}
          >
            Print
          </Button>
          <Button
            variant="outlined"
            startIcon={<Share />}
            onClick={handleShare}
            size={isMobile ? 'small' : 'medium'}
          >
            Share
          </Button>
        </Box>
      </Box>

      {/* Bill Content */}
      <Paper sx={{ p: 4, '@media print': { boxShadow: 'none', p: 2 } }}>
        {/* Bill Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ '@media print': { fontSize: '2rem' } }}>
            INVOICE
          </Typography>
          <Typography variant="h5" color="primary" gutterBottom>
            {bill.billNumber}
          </Typography>
          <Chip 
            label={bill.status} 
            color={getStatusColor(bill.status)}
            sx={{ '@media print': { display: 'none' } }}
          />
        </Box>

        <Grid container spacing={4}>
          {/* Bill Info */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Bill Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Bill Number:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {bill.billNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Date:
                    </Typography>
                    <Typography variant="body2">
                      {new Date(bill.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Status:
                    </Typography>
                    <Typography variant="body2">
                      {bill.status}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Client Info */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Client Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Name:
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {bill.client?.clientName}
                    </Typography>
                  </Box>
                  {bill.client?.panNumber && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        PAN Number:
                      </Typography>
                      <Typography variant="body2">
                        {bill.client.panNumber}
                      </Typography>
                    </Box>
                  )}
                  {bill.client?.phoneNumber && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone:
                      </Typography>
                      <Typography variant="body2">
                        {bill.client.phoneNumber}
                      </Typography>
                    </Box>
                  )}
                  {bill.client?.address && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Address:
                      </Typography>
                      <Typography variant="body2">
                        {bill.client.address}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Items Table */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Items
          </Typography>
          
          {isMobile ? (
            // Mobile Card View
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bill.items.map((item, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {item.itemName}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {item.quantity}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Unit Price
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{item.unitPrice.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">
                          Total
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          ₹{item.totalPrice.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Desktop Table View
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell align="center">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bill.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {item.itemName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {item.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          ₹{item.unitPrice.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          ₹{item.totalPrice.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Bill Summary */}
        <Box sx={{ mt: 4 }}>
          <Grid container justifyContent="flex-end">
            <Grid item xs={12} md={6} lg={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    Bill Summary
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">
                      Subtotal:
                    </Typography>
                    <Typography variant="body2">
                      ₹{bill.subtotal.toFixed(2)}
                    </Typography>
                  </Box>

                  {bill.tax > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Tax:
                      </Typography>
                      <Typography variant="body2">
                        ₹{bill.tax.toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">
                      Total Amount:
                    </Typography>
                    <Typography variant="h6" fontWeight="bold" color="primary">
                      ₹{bill.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center', '@media print': { mt: 6 } }}>
          <Typography variant="body2" color="text.secondary">
            Thank you for your business!
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Generated on {new Date().toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default BillViewPage