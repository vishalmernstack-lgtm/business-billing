import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Divider,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Payment,
  Close,
  AttachMoney,
  CalendarToday,
  Receipt,
  History,
  Delete,
} from '@mui/icons-material'
import { useAddPaymentMutation, useGetPaymentHistoryQuery, useDeletePaymentMutation } from '../../store/api/apiSlice'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'

const PaymentModal = ({ open, onClose, bill }) => {
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  })

  // Get current user from Redux store
  const currentUser = useSelector((state) => state.auth.user)
  const isAdmin = currentUser?.role === 'Admin'

  const [addPayment, { isLoading: addingPayment }] = useAddPaymentMutation()
  const [deletePayment, { isLoading: deletingPayment }] = useDeletePaymentMutation()
  const { data: paymentHistoryData, isLoading: loadingHistory } = useGetPaymentHistoryQuery(
    bill?._id, 
    { skip: !bill?._id }
  )

  // Calculate amounts
  const totalAmount = bill?.totalAmount || 0
  const paidAmount = bill?.paidAmount || 0
  const dueAmount = totalAmount - paidAmount

  // Auto-fill due amount when modal opens
  useEffect(() => {
    if (open && dueAmount > 0) {
      setPaymentForm(prev => ({
        ...prev,
        amount: dueAmount.toFixed(2)
      }))
    }
  }, [open, dueAmount])

  const handleInputChange = (field, value) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddPayment = async () => {
    try {
      const paymentAmount = parseFloat(paymentForm.amount)

      if (!paymentAmount || paymentAmount <= 0) {
        toast.error('Please enter a valid payment amount')
        return
      }

      if (paymentAmount > dueAmount) {
        toast.error(`Payment amount cannot exceed due amount of ₹${dueAmount.toFixed(2)}`)
        return
      }

      const paymentData = {
        amount: paymentAmount,
        paymentMethod: paymentForm.method,
        notes: paymentForm.notes,
        paymentDate: paymentForm.paymentDate
      }

      await addPayment({ 
        billId: bill._id, 
        paymentData 
      }).unwrap()

      toast.success(`Payment of ₹${paymentAmount} added successfully!`)
      
      // Reset form
      setPaymentForm({
        amount: '',
        method: 'Cash',
        notes: '',
        paymentDate: new Date().toISOString().split('T')[0]
      })
      
      // Close modal if fully paid
      if (paymentAmount >= dueAmount) {
        onClose()
      }
      
    } catch (error) {
      console.error('Payment addition error:', error)
      toast.error(error?.data?.error?.message || error?.message || 'Failed to add payment')
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!isAdmin) {
      toast.error('Only Admin users can delete payments')
      return
    }

    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        await deletePayment({ 
          billId: bill._id, 
          paymentId 
        }).unwrap()
        
        toast.success('Payment deleted successfully!')
      } catch (error) {
        console.error('Payment deletion error:', error)
        toast.error(error?.data?.error?.message || error?.message || 'Failed to delete payment')
      }
    }
  }

  const handleClose = () => {
    setPaymentForm({
      amount: '',
      method: 'Cash',
      notes: '',
      paymentDate: new Date().toISOString().split('T')[0]
    })
    onClose()
  }

  if (!bill) return null

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Payment color="primary" />
            <Typography variant="h6" component="span" fontWeight="bold">
              Payment Management
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {bill.billNumber} • {bill.clientDetails?.clientName}
        </Typography>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column - Payment Summary */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'primary.50' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt color="primary" />
                Bill Summary
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography variant="h6" fontWeight="bold">₹{totalAmount.toFixed(2)}</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Paid Amount:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    ₹{paidAmount.toFixed(2)}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Due Amount:</Typography>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold" 
                    color={dueAmount > 0 ? 'error.main' : 'success.main'}
                  >
                    ₹{dueAmount.toFixed(2)}
                  </Typography>
                </Box>

                <Chip 
                  label={
                    dueAmount === 0 ? 'Fully Paid' : 
                    paidAmount > 0 ? 'Partially Paid' : 'Unpaid'
                  }
                  color={
                    dueAmount === 0 ? 'success' : 
                    paidAmount > 0 ? 'warning' : 'error'
                  }
                  sx={{ width: '100%' }}
                />
              </Box>
            </Paper>

            {/* Payment History */}
            {paymentHistoryData?.data?.paymentHistory && paymentHistoryData.data.paymentHistory.length > 0 && (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <History color="primary" />
                  Payment History ({paymentHistoryData.data.paymentHistory.length})
                </Typography>
                
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {(paymentHistoryData.data.paymentHistory || [])
                    .slice()
                    .sort((a, b) => {
                      // Sort by createdAt first (when payment was recorded), then by paymentDate
                      const dateA = new Date(a.createdAt || a.paymentDate);
                      const dateB = new Date(b.createdAt || b.paymentDate);
                      return dateB - dateA; // Newest first
                    })
                    .map((payment, index) => (
                    <Box 
                      key={payment._id || index} 
                      sx={{ 
                        p: 2, 
                        mb: 1, 
                        bgcolor: 'grey.50', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body1" fontWeight="bold" color="success.main">
                            ₹{payment.amount.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {payment.paymentMethod}
                          {payment.notes && ` • ${payment.notes}`}
                        </Typography>
                      </Box>
                      {isAdmin && (
                        <Tooltip title="Delete Payment (Admin Only)">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeletePayment(payment._id)}
                            disabled={deletingPayment}
                            sx={{ ml: 1 }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Grid>

          {/* Right Column - Add Payment */}
          <Grid item xs={12} md={6}>
            {dueAmount > 0 ? (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AttachMoney color="primary" />
                  Add Payment
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        fullWidth
                        label="Payment Amount (₹)"
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        inputProps={{ 
                          min: 0.01, 
                          max: dueAmount.toFixed(2) 
                        }}
                        helperText={`Max: ₹${dueAmount.toFixed(2)}`}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleInputChange('amount', dueAmount.toFixed(2))}
                        sx={{ minWidth: 'auto', px: 2 }}
                      >
                        Full
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Payment Method"
                      value={paymentForm.method}
                      onChange={(e) => handleInputChange('method', e.target.value)}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Payment Date"
                      type="date"
                      value={paymentForm.paymentDate}
                      onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Payment Notes (Optional)"
                      multiline
                      rows={3}
                      value={paymentForm.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add any notes about this payment..."
                    />
                  </Grid>
                </Grid>
              </Paper>
            ) : (
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h6" color="success.main" gutterBottom>
                  ✅ Bill Fully Paid
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This bill has been completely paid. No further payments are required.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
        {dueAmount > 0 && (
          <Button
            variant="contained"
            onClick={handleAddPayment}
            disabled={addingPayment || !paymentForm.amount || parseFloat(paymentForm.amount) <= 0}
            startIcon={addingPayment ? <CircularProgress size={16} /> : <Payment />}
            sx={{ borderRadius: 2 }}
          >
            {addingPayment ? 'Adding Payment...' : 'Add Payment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default PaymentModal