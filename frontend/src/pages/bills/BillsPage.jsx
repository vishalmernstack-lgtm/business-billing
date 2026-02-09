import React, { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  useMediaQuery,
  useTheme,
  Fab,
  Tooltip,
  MenuItem,
  Autocomplete,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility,
  Print,
  ExpandMore,
  Person,
  Phone,
  LocationOn,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Assessment,
  Receipt,
  Payment,
  Lock,
  PersonAdd,
  NoteAdd,
  Close,
  History,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'

import { useGetBillsQuery, useDeleteBillMutation, useUpdateBillMutation, useGetClientsQuery, useGetCompanySettingsQuery } from '../../store/api/apiSlice'
import PaymentModal from '../../components/bills/PaymentModal'

const ClientBillsGroup = ({ client, bills, onEditBill, onDeleteBill, onPrintBill, onPaymentBill, onOpenPaymentHistory, user }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Calculate client statistics
  const totalBills = bills.length
  const paidBills = bills.filter(bill => bill.status === 'Paid')
  const pendingBills = bills.filter(bill => bill.status === 'Sent' || bill.status === 'Partial')
  const draftBills = bills.filter(bill => bill.status === 'Draft')
  
  const totalAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0)
  const paidAmount = bills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0)
  const dueAmount = totalAmount - paidAmount
  const pendingAmount = pendingBills.reduce((sum, bill) => sum + bill.totalAmount, 0)
  const remainingAmount = totalAmount - paidAmount
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success'
      case 'Sent': return 'warning'
      case 'Draft': return 'default'
      default: return 'default'
    }
  }

  // Get professional gradient background based on payment status
  const getCardBackground = (status) => {
    switch (status) {
      case 'Paid': 
        return 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)'
      case 'Partial':
        return 'linear-gradient(135deg, #E65100 0%, #F57C00 50%, #FF9800 100%)'
      case 'Sent': 
        return 'linear-gradient(135deg, #B71C1C 0%, #D32F2F 50%, #F44336 100%)'
      case 'Draft': 
        return 'linear-gradient(135deg, #424242 0%, #616161 50%, #757575 100%)'
      default: 
        return 'linear-gradient(135deg, #424242 0%, #616161 50%, #757575 100%)'
    }
  }

  // Get accordion header background based on client's overall payment status
  const getAccordionHeaderBackground = () => {
    const allPaid = bills.every(bill => bill.status === 'Paid')
    const allUnpaid = bills.every(bill => bill.status === 'Sent' || bill.status === 'Draft')
    const hasPartial = bills.some(bill => bill.status === 'Partial')
    const hasMixed = bills.some(bill => bill.status === 'Paid') && bills.some(bill => bill.status === 'Sent' || bill.status === 'Draft' || bill.status === 'Partial')
    
    if (allPaid) {
      // Rich green gradient for fully paid clients
      return 'linear-gradient(135deg, #2E7D32 0%, #388E3C 50%, #43A047 100%)'
    } else if (hasPartial || hasMixed) {
      // Orange to amber gradient for partial payments
      return 'linear-gradient(135deg, #F57C00 0%, #FF9800 50%, #FFB74D 100%)'
    } else if (allUnpaid) {
      // Red gradient for unpaid clients
      return 'linear-gradient(135deg, #D32F2F 0%, #F44336 50%, #E57373 100%)'
    }
    return 'linear-gradient(135deg, #616161 0%, #757575 50%, #9E9E9E 100%)'
  }

  // Get payment status text and color for display
  const getPaymentStatusInfo = () => {
    const allPaid = bills.every(bill => bill.status === 'Paid')
    const allUnpaid = bills.every(bill => bill.status === 'Sent' || bill.status === 'Draft')
    const hasPartial = bills.some(bill => bill.status === 'Partial')
    const hasMixed = bills.some(bill => bill.status === 'Paid') && bills.some(bill => bill.status === 'Sent' || bill.status === 'Draft' || bill.status === 'Partial')
    
    if (allPaid) {
      return { text: '✓ All Paid', color: 'success.main', icon: '✓' }
    } else if (hasPartial || hasMixed) {
      return { text: '⚡ Partial Payment', color: 'warning.main', icon: '⚡' }
    } else if (allUnpaid) {
      return { text: '⏳ Payment Pending', color: 'error.main', icon: '⏳' }
    }
    return { text: 'No Bills', color: 'text.secondary', icon: '' }
  }

  // Get item names for display - improved formatting
  const getItemNames = (items) => {
    if (!items || items.length === 0) return 'No items'
    
    // Clean up item names by removing duplicates and extra spaces
    const uniqueItems = [...new Set(items.map(item => item.itemName?.trim()).filter(Boolean))]
    
    if (uniqueItems.length === 0) return 'No items'
    if (uniqueItems.length === 1) return uniqueItems[0]
    if (uniqueItems.length <= 3) return uniqueItems.join(', ')
    
    return `${uniqueItems.slice(0, 2).join(', ')} +${uniqueItems.length - 2} more`
  }

  return (
    <Accordion sx={{ 
      mb: 3, 
      borderRadius: '12px !important',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      '&:before': {
        display: 'none',
      },
      '& .MuiAccordionDetails-root': {
        background: 'linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)',
        borderRadius: '0 0 12px 12px',
      }
    }}>
      <AccordionSummary 
        expandIcon={<ExpandMore />}
        sx={{
          background: getAccordionHeaderBackground(),
          color: 'white',
          '& .MuiAccordionSummary-content': {
            alignItems: 'center',
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            color: 'white',
          },
          borderRadius: '12px 12px 0 0',
          minHeight: 72,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none',
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
          {/* Client Avatar */}
          <Avatar 
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.25)', 
              color: 'white',
              width: 56,
              height: 56,
              fontSize: '1.4rem',
              fontWeight: 'bold',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}
          >
            {client.clientName?.charAt(0)?.toUpperCase() || 'C'}
          </Avatar>

          {/* Client Information */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" sx={{ color: 'white !important', fontWeight: 'bold' }}>
                {client.clientName}
              </Typography>
              {/* Show creator badge for admin view */}
              {user?.role === 'Admin' && bills[0]?.createdBy && (
                <Chip
                  label={`By: ${bills[0].createdBy.firstName} ${bills[0].createdBy.lastName}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    color: 'white !important',
                    fontWeight: '600',
                    fontSize: '0.7rem',
                    height: '22px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Phone fontSize="small" />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9) !important' }}>
                  {client.phoneNumber}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9) !important' }}>
                  {client.village}
                </Typography>
              </Box>
              {client.gender && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Person fontSize="small" />
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9) !important' }}>
                    {client.gender}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Client Statistics and Actions */}
          <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Unified Statistics Box */}
            <Box sx={{ 
              display: 'flex',
              gap: 0,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '6px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              backdropFilter: 'blur(10px)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              height: '42px'
            }}>
              {/* Bills Count */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 2,
                minWidth: '85px',
                bgcolor: 'rgba(33, 150, 243, 0.08)',
                borderRight: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(0, 0, 0, 0.7) !important', 
                  fontWeight: '700', 
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1
                }}>
                  Bills
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(0, 0, 0, 0.9) !important', 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  mt: 0.3
                }}>
                  {bills.length}
                </Typography>
              </Box>
              
              {/* Total Amount */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 2,
                minWidth: '130px',
                bgcolor: 'rgba(156, 39, 176, 0.08)',
                borderRight: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(0, 0, 0, 0.7) !important', 
                  fontWeight: '700', 
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1
                }}>
                  Total
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(0, 0, 0, 0.9) !important', 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  mt: 0.3
                }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </Typography>
              </Box>

              {/* Paid Amount */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 2,
                minWidth: '130px',
                bgcolor: 'rgba(76, 175, 80, 0.08)',
                borderRight: '1px solid rgba(0, 0, 0, 0.08)'
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(0, 0, 0, 0.7) !important', 
                  fontWeight: '700', 
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1
                }}>
                  Paid
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#2e7d32 !important', 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  mt: 0.3
                }}>
                  ₹{paidAmount.toLocaleString('en-IN')}
                </Typography>
              </Box>

              {/* Due Amount */}
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                px: 2,
                minWidth: '130px',
                bgcolor: dueAmount > 0 ? 'rgba(255, 152, 0, 0.12)' : 'rgba(76, 175, 80, 0.08)',
              }}>
                <Typography variant="caption" sx={{ 
                  color: 'rgba(0, 0, 0, 0.7) !important', 
                  fontWeight: '700', 
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1
                }}>
                  Due
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: dueAmount > 0 ? '#e65100 !important' : '#2e7d32 !important', 
                  fontWeight: '700', 
                  fontSize: '0.95rem',
                  lineHeight: 1,
                  mt: 0.3
                }}>
                  ₹{dueAmount.toLocaleString('en-IN')}
                </Typography>
              </Box>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Create New Bill Button */}
              <Tooltip title="Create new bill for this client">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add sx={{ fontSize: '1rem' }} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Pass all client data as URL parameters
                    const params = new URLSearchParams({
                      phone: client.phoneNumber || '',
                      name: client.clientName || '',
                      gender: client.gender || '',
                      village: client.village || ''
                    })
                    const url = `/bills/new?${params.toString()}`
                    window.open(url, '_blank')
                  }}
                  sx={{
                    backgroundColor: '#4caf50',
                    color: 'white !important',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    px: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    minWidth: '100px',
                    height: '42px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    '&:hover': {
                      backgroundColor: '#45a049',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  New Bill
                </Button>
              </Tooltip>

              {/* Payment History Button */}
              <Tooltip title="View complete payment history">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<History sx={{ fontSize: '1rem' }} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenPaymentHistory(client, bills)
                  }}
                  sx={{
                    backgroundColor: '#2196f3',
                    color: 'white !important',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    px: 2,
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    minWidth: '130px',
                    height: '42px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  Payments
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </AccordionSummary>
      
      <AccordionDetails>
        <Divider sx={{ mb: 3 }} />

        {/* Bills Table */}
        {isMobile ? (
          // Mobile Card View with Full Background Colors
          <Grid container spacing={2}>
            {bills.map((bill, index) => (
              <Grid item xs={12} key={bill._id}>
                <Card 
                  sx={{ 
                    background: getCardBackground(bill.status),
                    color: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                      pointerEvents: 'none',
                    },
                    '& .MuiTypography-root': { color: 'white' },
                    '& .MuiChip-root': { 
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '1px solid rgba(255, 255, 255, 0.3)'
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={index + 1}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white !important',
                            fontWeight: 'bold',
                            minWidth: '28px',
                            height: '24px'
                          }}
                        />
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ color: 'white !important', mb: 0.5 }}>
                            {bill.billNumber}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8) !important' }}>
                            {new Date(bill.createdAt).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip 
                        label={bill.status === 'Sent' ? 'Unpaid' : bill.status} 
                        icon={bill.status === 'Paid' ? <Lock /> : undefined}
                        sx={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          color: 'white !important',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          '& .MuiChip-icon': {
                            color: 'white !important'
                          }
                        }}
                        size="small"
                      />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9) !important' }} gutterBottom>
                        Items: {getItemNames(bill.items)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white !important', fontWeight: 'bold' }}>
                        ₹{bill.totalAmount.toLocaleString()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {bill.status !== 'Paid' && (
                        <IconButton 
                          size="small" 
                          onClick={() => onPaymentBill(bill)} 
                          sx={{ 
                            color: 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '&:hover': { 
                              backgroundColor: 'rgba(255, 255, 255, 0.4)',
                              transform: 'scale(1.1)',
                              transition: 'all 0.2s ease'
                            }
                          }}
                        >
                          <Payment />
                        </IconButton>
                      )}
                      <Tooltip title={bill.status === 'Paid' && user?.role !== 'Admin' ? 'Cannot edit paid bills' : 'Edit'}>
                        <IconButton 
                          size="small" 
                          onClick={() => onEditBill(bill._id)} 
                          disabled={bill.status === 'Paid' && user?.role !== 'Admin'}
                          sx={{ 
                            color: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.3)' : 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '&:hover': { 
                              backgroundColor: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.4)',
                              transform: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'none' : 'scale(1.1)',
                              transition: 'all 0.2s ease'
                            },
                            '&:disabled': {
                              color: 'rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)'
                            }
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <IconButton 
                        size="small" 
                        onClick={() => onPrintBill(bill)} 
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          '&:hover': { 
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            transform: 'scale(1.1)',
                            transition: 'all 0.2s ease'
                          }
                        }}
                      >
                        <Print />
                      </IconButton>
                      <Tooltip title={bill.status === 'Paid' && user?.role !== 'Admin' ? 'Cannot delete paid bills' : 'Delete'}>
                        <IconButton 
                          size="small" 
                          onClick={() => onDeleteBill(bill._id, bill.billNumber)}
                          disabled={bill.status === 'Paid' && user?.role !== 'Admin'}
                          sx={{ 
                            color: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.3)' : 'white',
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            '&:hover': { 
                              backgroundColor: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 152, 152, 0.4)',
                              transform: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'none' : 'scale(1.1)',
                              transition: 'all 0.2s ease'
                            },
                            '&:disabled': {
                              color: 'rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              border: '1px solid rgba(255, 255, 255, 0.2)'
                            }
                          }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          // Desktop Table View with Full Background Colors
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'auto', boxShadow: 2 }}>
            <Table size="small" sx={{ minWidth: 1000, width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  '& .MuiTableCell-root': {
                    color: 'white !important',
                    fontWeight: 'bold',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    padding: '12px 16px',
                    boxSizing: 'border-box'
                  }
                  }}>
                  <TableCell sx={{ width: '50px', textAlign: 'center !important', padding: '12px 8px !important' }}>
                    #
                  </TableCell>
                  <TableCell sx={{ width: '130px', textAlign: 'left !important' }}>
                    Bill Number
                  </TableCell>
                  <TableCell sx={{ width: '110px', textAlign: 'center !important' }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ width: '200px', textAlign: 'center !important' }}>
                    Items
                  </TableCell>
                  <TableCell sx={{ width: '110px', textAlign: 'center !important' }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ width: '90px', textAlign: 'center !important' }}>
                    Status
                  </TableCell>
                  {user?.role === 'Admin' && (
                    <TableCell sx={{ width: '120px', textAlign: 'center !important' }}>
                      Created By
                    </TableCell>
                  )}
                  <TableCell sx={{ width: '130px', textAlign: 'center !important' }}>
                    Latest Payment
                  </TableCell>
                  <TableCell sx={{ width: '180px', textAlign: 'center !important' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.map((bill, index) => {
                  // Get the latest payment for this bill - create a copy before sorting
                  let latestPayment = null;
                  try {
                    if (bill.paymentHistory && bill.paymentHistory.length > 0) {
                      const paymentsCopy = [...bill.paymentHistory];
                      latestPayment = paymentsCopy.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
                    }
                  } catch (error) {
                    console.error('Error sorting payment history:', error);
                    latestPayment = bill.paymentHistory?.[0] || null;
                  }

                  return (
                    <TableRow 
                      key={bill._id} 
                      hover
                      sx={{ 
                        background: getCardBackground(bill.status),
                        '&::before': {
                          display: 'none'
                        },
                        '& .MuiTableCell-root': { 
                          color: 'white !important',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                          verticalAlign: 'middle',
                          padding: '12px 16px',
                          boxSizing: 'border-box'
                        },
                        '& .MuiChip-root': { 
                          backgroundColor: 'rgba(255, 255, 255, 0.25)',
                          color: 'white !important',
                          fontWeight: 'bold',
                          border: '1px solid rgba(255, 255, 255, 0.3)'
                        },
                        '&:hover': {
                          background: `${getCardBackground(bill.status)} !important`,
                          transform: 'scale(1.002)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      <TableCell sx={{ width: '50px', textAlign: 'center', padding: '12px 8px !important' }}>
                        <Chip 
                          label={index + 1}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            color: 'white !important',
                            fontWeight: 'bold',
                            minWidth: '24px',
                            height: '20px',
                            fontSize: '0.7rem'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: '130px', textAlign: 'left', padding: '12px 16px !important' }}>
                        <Typography variant="body2" fontWeight="bold" sx={{ color: 'white !important' }}>
                          {bill.billNumber}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '110px', textAlign: 'center', padding: '12px 16px !important' }}>
                        <Typography variant="body2" sx={{ color: 'white !important', whiteSpace: 'nowrap' }}>
                          {new Date(bill.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '200px', textAlign: 'center', padding: '12px 16px !important' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'white !important',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={getItemNames(bill.items)} // Show full text on hover
                        >
                          {getItemNames(bill.items)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '110px', textAlign: 'center', padding: '12px 16px !important' }}>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: 'white !important', whiteSpace: 'nowrap' }}>
                          ₹{bill.totalAmount.toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: '90px', textAlign: 'center', padding: '12px 16px !important' }}>
                        <Chip 
                          label={bill.status === 'Sent' ? 'Unpaid' : bill.status} 
                          icon={bill.status === 'Paid' ? <Lock /> : undefined}
                          sx={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                            color: 'white !important',
                            fontWeight: 'bold',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            height: '24px',
                            fontSize: '0.75rem',
                            '& .MuiChip-icon': {
                              color: 'white !important'
                            }
                          }}
                          size="small"
                        />
                      </TableCell>
                      {user?.role === 'Admin' && (
                        <TableCell sx={{ width: '120px', textAlign: 'center', padding: '12px 16px !important' }}>
                          {bill.createdBy ? (
                            <Chip
                              label={`${bill.createdBy.firstName} ${bill.createdBy.lastName}`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255, 255, 255, 0.25)',
                                color: 'white !important',
                                fontWeight: '600',
                                fontSize: '0.7rem',
                                height: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6) !important' }}>
                              Unknown
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell sx={{ width: '130px', textAlign: 'center', padding: '12px 16px !important' }}>
                        {latestPayment ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: 'white !important', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                              ₹{latestPayment.amount.toLocaleString('en-IN')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8) !important', lineHeight: 1, whiteSpace: 'nowrap' }}>
                              {new Date(latestPayment.paymentDate).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6) !important', whiteSpace: 'nowrap' }}>
                            No payments
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ width: '180px', textAlign: 'center', padding: '12px 16px !important' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'nowrap' }}>
                          {bill.status !== 'Paid' && (
                            <Tooltip title="Manage Payments">
                              <IconButton 
                                size="small" 
                                onClick={() => onPaymentBill(bill)} 
                                sx={{ 
                                  color: 'white',
                                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                  width: '28px',
                                  height: '28px',
                                  '&:hover': { 
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    transform: 'scale(1.1)',
                                    transition: 'all 0.2s ease'
                                  }
                                }}
                              >
                                <Payment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={bill.status === 'Paid' && user?.role !== 'Admin' ? 'Cannot edit paid bills' : 'Edit'}>
                            <IconButton 
                              size="small" 
                              onClick={() => onEditBill(bill._id)} 
                              disabled={bill.status === 'Paid' && user?.role !== 'Admin'}
                              sx={{ 
                                color: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.3)' : 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                width: '28px',
                                height: '28px',
                                '&:hover': { 
                                  backgroundColor: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.4)',
                                  transform: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'none' : 'scale(1.1)',
                                  transition: 'all 0.2s ease'
                                },
                                '&:disabled': {
                                  color: 'rgba(255, 255, 255, 0.3)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton 
                              size="small" 
                              onClick={() => onPrintBill(bill)} 
                              sx={{ 
                                color: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                width: '28px',
                                height: '28px',
                                '&:hover': { 
                                  backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                  transform: 'scale(1.1)',
                                  transition: 'all 0.2s ease'
                                }
                              }}
                            >
                              <Print fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={bill.status === 'Paid' && user?.role !== 'Admin' ? 'Cannot delete paid bills' : 'Delete'}>
                            <IconButton 
                              size="small" 
                              onClick={() => onDeleteBill(bill._id, bill.billNumber)}
                              disabled={bill.status === 'Paid' && user?.role !== 'Admin'}
                              sx={{ 
                                color: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.3)' : 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                width: '28px',
                                height: '28px',
                                '&:hover': { 
                                  backgroundColor: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 152, 152, 0.4)',
                                  transform: (bill.status === 'Paid' && user?.role !== 'Admin') ? 'none' : 'scale(1.1)',
                                  transition: 'all 0.2s ease'
                                },
                                '&:disabled': {
                                  color: 'rgba(255, 255, 255, 0.3)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

const BillsPage = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  // Get current user from Redux store
  const currentUser = useSelector((state) => state.auth.user)
  const isAdmin = currentUser?.role === 'Admin'
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addressFilter, setAddressFilter] = useState('')
  
  // Smart search state for phone number detection
  const [showSmartActions, setShowSmartActions] = useState(false)
  const [searchedClient, setSearchedClient] = useState(null)
  const [isPhoneSearch, setIsPhoneSearch] = useState(false)
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  
  // Payment history modal state
  const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false)
  const [selectedClientBills, setSelectedClientBills] = useState(null)
  
  const { data: billsData, isLoading: billsLoading, error: billsError } = useGetBillsQuery({
    page: 1,
    limit: 1000,
    search: search,
  })
  
  // Get company settings for bill printing
  const { data: companySettingsData } = useGetCompanySettingsQuery()
  
  // Smart search for clients by phone number
  const { data: clientSearchData, isLoading: clientSearchLoading } = useGetClientsQuery({
    page: 1,
    limit: 5,
    search: isPhoneSearch ? search : '',
  }, {
    skip: !isPhoneSearch || search.length < 10,
  })
  
  const [deleteBill] = useDeleteBillMutation()
  const [updateBill] = useUpdateBillMutation()

  // Phone number detection and smart search logic
  useEffect(() => {
    const phoneRegex = /^[0-9]{10}$/
    const isPhone = phoneRegex.test(search.trim())
    
    setIsPhoneSearch(isPhone)
    
    if (isPhone) {
      // Check if we found a client with this phone number
      if (clientSearchData?.data?.clients?.length > 0) {
        const foundClient = clientSearchData.data.clients.find(
          client => client.phoneNumber === search.trim()
        )
        setSearchedClient(foundClient || null)
        setShowSmartActions(true)
      } else if (!clientSearchLoading && clientSearchData?.data?.clients?.length === 0) {
        // No client found with this phone number
        setSearchedClient(null)
        setShowSmartActions(true)
      }
    } else {
      setShowSmartActions(false)
      setSearchedClient(null)
    }
  }, [search, clientSearchData, clientSearchLoading])

  const handleDeleteBill = async (id, billNumber) => {
    if (window.confirm(`Are you sure you want to delete bill ${billNumber}?`)) {
      try {
        await deleteBill(id).unwrap()
        toast.success('Bill deleted successfully')
      } catch (error) {
        toast.error('Failed to delete bill')
      }
    }
  }

  const handlePaymentBill = (bill) => {
    setSelectedBill(bill)
    setPaymentModalOpen(true)
  }

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false)
    setSelectedBill(null)
  }

  const handleEditBill = (id) => {
    navigate(`/bills/${id}/edit`)
  }

  // Smart search action handlers
  const handleCreateBillForClient = () => {
    if (searchedClient) {
      navigate(`/bills/new?clientId=${searchedClient._id}&phone=${search}`)
    } else {
      navigate(`/bills/new?phone=${search}`)
    }
  }

  const handleCreateClientAndBill = () => {
    navigate(`/clients/new?phone=${search}&returnTo=bills`)
  }

  const handleDismissSmartActions = () => {
    setShowSmartActions(false)
  }

  const handleOpenPaymentHistory = (client, bills) => {
    setSelectedClientBills({ client, bills })
    setPaymentHistoryModalOpen(true)
  }

  const handleClosePaymentHistory = () => {
    setPaymentHistoryModalOpen(false)
    setSelectedClientBills(null)
  }

  const handlePrintBill = (bill) => {
    const companySettings = companySettingsData?.data || {}
    const logoUrl = companySettings.logo 
      ? `http://localhost:5000/uploads/logos/${companySettings.logo}` 
      : ''
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Bill ${bill.billNumber}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 3px solid #1976d2;
              padding-bottom: 20px;
            }
            .company-logo {
              max-width: 150px;
              max-height: 80px;
              margin-bottom: 10px;
            }
            .company-info {
              font-size: 12px;
              color: #666;
              margin-top: 10px;
            }
            .invoice-title {
              color: #1976d2;
              margin: 10px 0;
            }
            .bill-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .bill-info, .client-info {
              flex: 1;
            }
            .bill-info {
              text-align: right;
            }
            .section-title {
              font-weight: bold;
              color: #1976d2;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .info-line {
              margin: 5px 0;
              font-size: 13px;
            }
            .items-table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .items-table th { 
              background-color: #1976d2;
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-weight: bold;
            }
            .items-table td { 
              border: 1px solid #ddd; 
              padding: 10px 8px;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-section { 
              text-align: right;
              margin-top: 20px;
            }
            .total-line {
              margin: 8px 0;
              font-size: 14px;
            }
            .grand-total {
              font-size: 18px;
              font-weight: bold;
              color: #1976d2;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 2px solid #1976d2;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" class="company-logo" />` : ''}
            <h1 class="invoice-title">${companySettings.companyName || 'INVOICE'}</h1>
            ${companySettings.address || companySettings.phone || companySettings.email ? `
              <div class="company-info">
                ${companySettings.address ? `${companySettings.address}<br/>` : ''}
                ${companySettings.city && companySettings.state ? `${companySettings.city}, ${companySettings.state} ${companySettings.pincode || ''}<br/>` : ''}
                ${companySettings.phone ? `Phone: ${companySettings.phone}` : ''} 
                ${companySettings.email ? `| Email: ${companySettings.email}` : ''}<br/>
                ${companySettings.gstNumber ? `GST No: ${companySettings.gstNumber}` : ''}
                ${companySettings.website ? `| ${companySettings.website}` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="bill-details">
            <div class="client-info">
              <div class="section-title">BILL TO:</div>
              <div class="info-line"><strong>${bill.clientDetails?.clientName || 'N/A'}</strong></div>
              <div class="info-line">${bill.clientDetails?.village || ''}</div>
              <div class="info-line">Phone: ${bill.clientDetails?.phoneNumber || 'N/A'}</div>
              ${bill.clientDetails?.gender ? `<div class="info-line">Gender: ${bill.clientDetails.gender}</div>` : ''}
            </div>
            
            <div class="bill-info">
              <div class="section-title">INVOICE DETAILS:</div>
              <div class="info-line"><strong>Bill No:</strong> ${bill.billNumber}</div>
              <div class="info-line"><strong>Date:</strong> ${new Date(bill.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}</div>
              <div class="info-line"><strong>Status:</strong> ${bill.status === 'Sent' ? 'Unpaid' : bill.status}</div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 10%;">#</th>
                <th style="width: 45%;">Item Description</th>
                <th style="width: 15%; text-align: center;">Quantity</th>
                <th style="width: 15%; text-align: right;">Unit Price</th>
                <th style="width: 15%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items.map((item, index) => `
                <tr>
                  <td style="text-align: center;">${index + 1}</td>
                  <td>${item.itemName}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
                  <td style="text-align: right;">₹${(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-line">Subtotal: ₹${bill.subtotal.toFixed(2)}</div>
            <div class="grand-total">Total Amount: ₹${bill.totalAmount.toFixed(2)}</div>
            ${bill.paidAmount > 0 ? `
              <div class="total-line" style="color: #2e7d32; margin-top: 10px;">
                Paid: ₹${bill.paidAmount.toFixed(2)}
              </div>
              <div class="total-line" style="color: ${bill.totalAmount - bill.paidAmount > 0 ? '#d32f2f' : '#2e7d32'};">
                ${bill.totalAmount - bill.paidAmount > 0 ? 'Balance Due' : 'Fully Paid'}: ₹${(bill.totalAmount - bill.paidAmount).toFixed(2)}
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            ${companySettings.companyName ? `<p>${companySettings.companyName}</p>` : ''}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Group bills by client with filtering
  const groupedBillsData = useMemo(() => {
    if (!billsData?.data?.bills) return []
    
    const bills = billsData.data.bills
    
    // Group bills by client details (now embedded in bill)
    const grouped = bills.reduce((acc, bill) => {
      // Use client details directly from bill
      const clientDetails = bill.clientDetails
      
      if (!clientDetails) return acc
      
      // Apply comprehensive search filters
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesClientName = clientDetails.clientName.toLowerCase().includes(searchLower)
        const matchesPhoneNumber = clientDetails.phoneNumber.includes(search)
        const matchesBillNumber = bill.billNumber.toLowerCase().includes(searchLower)
        const matchesItemName = bill.items.some(item => 
          item.itemName.toLowerCase().includes(searchLower)
        )
        
        if (!matchesClientName && !matchesPhoneNumber && !matchesBillNumber && !matchesItemName) {
          return acc
        }
      }
      
      if (statusFilter) {
        if (statusFilter === 'Sent') {
          // "Unpaid" should include both Sent and Draft
          if (bill.status !== 'Sent' && bill.status !== 'Draft') {
            return acc
          }
        } else if (bill.status !== statusFilter) {
          return acc
        }
      }
      
      if (addressFilter && (!clientDetails.village || 
          !clientDetails.village.toLowerCase().includes(addressFilter.toLowerCase()))) {
        return acc
      }
      
      // Create a unique key for grouping (using phone number as unique identifier)
      const clientKey = clientDetails.phoneNumber || `unknown-${Math.random()}`
      
      if (!acc[clientKey]) {
        acc[clientKey] = {
          client: {
            ...clientDetails,
            _id: clientKey, // Use phone number as ID for compatibility
          },
          bills: []
        }
      }
      
      acc[clientKey].bills.push(bill)
      return acc
    }, {})
    
    // Convert to array and sort bills within each group, then sort groups
    return Object.values(grouped).map(group => ({
      ...group,
      // Sort bills within each client group by bill number (descending - newest first)
      bills: [...group.bills].sort((a, b) => {
        // Extract bill numbers and compare them
        const billNumA = parseInt(a.billNumber.replace(/\D/g, '')) || 0
        const billNumB = parseInt(b.billNumber.replace(/\D/g, '')) || 0
        return billNumB - billNumA // Descending order (newest first)
      })
    })).sort((a, b) => {
      // Sort client groups by the latest bill date (most recent client activity first)
      const latestDateA = Math.max(...a.bills.map(bill => new Date(bill.createdAt).getTime()))
      const latestDateB = Math.max(...b.bills.map(bill => new Date(bill.createdAt).getTime()))
      return latestDateB - latestDateA
    })
  }, [billsData, search, statusFilter, addressFilter])

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    const allBills = groupedBillsData.flatMap(group => group.bills)
    const totalAmount = allBills.reduce((sum, bill) => sum + bill.totalAmount, 0)
    const paidAmount = allBills.filter(bill => bill.status === 'Paid').reduce((sum, bill) => sum + bill.totalAmount, 0)
    const pendingAmount = allBills.filter(bill => bill.status === 'Sent' || bill.status === 'Partial').reduce((sum, bill) => {
      if (bill.status === 'Partial') {
        return sum + (bill.totalAmount - (bill.paidAmount || 0))
      }
      return sum + bill.totalAmount
    }, 0)
    
    return {
      totalClients: groupedBillsData.length,
      totalBills: allBills.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      paymentRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
    }
  }, [groupedBillsData])

  // Get unique villages from all bills for the filter dropdown with bill counts
  const uniqueVillages = useMemo(() => {
    if (!billsData?.data?.bills) return []
    
    const villageCount = {}
    
    // Count bills per village
    billsData.data.bills.forEach(bill => {
      const village = bill.clientDetails?.village
      if (village && village.trim() !== '') {
        const trimmedVillage = village.trim()
        villageCount[trimmedVillage] = (villageCount[trimmedVillage] || 0) + 1
      }
    })
    
    // Create array of village objects with counts, sorted alphabetically
    const uniqueVillagesList = Object.keys(villageCount)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .map(village => ({
        name: village,
        count: villageCount[village]
      }))
    
    return uniqueVillagesList
  }, [billsData])

  if (billsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (billsError) {
    return (
      <Alert severity="error">
        Failed to load bills data. Please try again.
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
        mb: 3 
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom sx={{ mb: 0 }}>
              Bills Management
            </Typography>
            {isAdmin && (
              <Chip 
                label="Admin View - All Users" 
                color="primary" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            {!isAdmin && (
              <Chip 
                label="My Bills Only" 
                color="default" 
                size="small"
                variant="outlined"
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {isAdmin 
              ? 'Viewing and managing bills from all users in the system'
              : 'Manage your bills grouped by client and payment status'
            }
          </Typography>
        </Box>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/bills/new')}
            size="large"
          >
            Create New Bill
          </Button>
        )}
      </Box>

      {/* Overall Statistics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="primary">
              {overallStats.totalClients}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Clients
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="secondary.main">
              {overallStats.totalBills}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Bills
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="success.main">
              ₹{overallStats.paidAmount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Paid Amount
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2 }}>
            <Typography variant="h4" color="warning.main">
              ₹{overallStats.pendingAmount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pending Amount
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search by client name, phone, bill number, or item name..."
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
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Payment Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Partial">Partial</MenuItem>
              <MenuItem value="Sent">Unpaid</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <Autocomplete
              fullWidth
              options={uniqueVillages}
              getOptionLabel={(option) => {
                // Handle both string (when typed) and object (when selected from list)
                if (typeof option === 'string') return option
                return option.name || ''
              }}
              value={addressFilter}
              onChange={(event, newValue) => {
                // Handle both string and object values
                if (typeof newValue === 'string') {
                  setAddressFilter(newValue)
                } else if (newValue && newValue.name) {
                  setAddressFilter(newValue.name)
                } else {
                  setAddressFilter('')
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Filter by Village (${uniqueVillages.length} available)`}
                  placeholder="Select or type village name..."
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <LocationOn />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    {typeof option === 'string' ? option : option.name}
                  </Box>
                  {typeof option === 'object' && option.count && (
                    <Chip 
                      label={`${option.count} bill${option.count !== 1 ? 's' : ''}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                </Box>
              )}
              freeSolo
              clearOnEscape
              selectOnFocus
              handleHomeEndKeys
              filterOptions={(options, { inputValue }) => {
                // Custom filter to allow partial matching
                const filtered = options.filter(option => {
                  const name = typeof option === 'string' ? option : option.name
                  return name.toLowerCase().includes(inputValue.toLowerCase())
                })
                
                // If user is typing something not in the list, add it as an option
                if (inputValue !== '' && !filtered.some(option => {
                  const name = typeof option === 'string' ? option : option.name
                  return name.toLowerCase() === inputValue.toLowerCase()
                })) {
                  filtered.push(inputValue)
                }
                
                return filtered
              }}
              noOptionsText="No villages found"
              loadingText="Loading villages..."
              clearText="Clear selection"
              openText="Open village list"
              closeText="Close village list"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setAddressFilter('')
              }}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Smart Search Actions */}
      <Collapse in={showSmartActions && isPhoneSearch}>
        <Paper sx={{ 
          mb: 3, 
          p: 3, 
          background: searchedClient 
            ? 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)' 
            : 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)',
          border: searchedClient 
            ? '2px solid rgba(46, 125, 50, 0.3)' 
            : '2px solid rgba(245, 124, 0, 0.3)',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: searchedClient 
              ? 'linear-gradient(90deg, #2e7d32 0%, #66bb6a 100%)'
              : 'linear-gradient(90deg, #f57c00 0%, #ffb74d 100%)',
          }
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ 
                bgcolor: searchedClient ? 'success.main' : 'warning.main',
                width: 48,
                height: 48
              }}>
                {searchedClient ? <Person /> : <PersonAdd />}
              </Avatar>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: searchedClient ? 'success.dark' : 'warning.dark',
                  fontWeight: 'bold'
                }}>
                  {searchedClient ? `Client Found: ${searchedClient.clientName}` : 'New Phone Number Detected'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {search} {searchedClient && `• Village: ${searchedClient.village || 'Not specified'}`}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              size="small" 
              onClick={handleDismissSmartActions}
              sx={{ color: 'text.secondary' }}
            >
              <Close />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {searchedClient ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<NoteAdd />}
                  onClick={handleCreateBillForClient}
                  sx={{
                    background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1b5e20 0%, #4caf50 100%)',
                    }
                  }}
                >
                  Create Bill for {searchedClient.clientName}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={() => navigate(`/clients/${searchedClient._id}`)}
                  sx={{ 
                    borderColor: 'success.main',
                    color: 'success.main',
                    '&:hover': {
                      borderColor: 'success.dark',
                      backgroundColor: 'success.50'
                    }
                  }}
                >
                  View Client Details
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={handleCreateClientAndBill}
                  sx={{
                    background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e65100 0%, #ff9800 100%)',
                    }
                  }}
                >
                  Create Client & Bill
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NoteAdd />}
                  onClick={handleCreateBillForClient}
                  sx={{ 
                    borderColor: 'warning.main',
                    color: 'warning.main',
                    '&:hover': {
                      borderColor: 'warning.dark',
                      backgroundColor: 'warning.50'
                    }
                  }}
                >
                  Create Bill Only
                </Button>
              </>
            )}
          </Box>

          {clientSearchLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Searching for client...
              </Typography>
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* Grouped Bills */}
      {groupedBillsData.length === 0 ? (
        <Paper sx={{ textAlign: 'center', py: 8 }}>
          <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No bills found
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {search || statusFilter || addressFilter ? 
              'Try adjusting your filters' : 
              'Create your first bill to get started!'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/bills/new')}
            sx={{ mt: 2 }}
          >
            Create Your First Bill
          </Button>
        </Paper>
      ) : (
        <Box>
          {groupedBillsData.map((group) => (
            <ClientBillsGroup
              key={group.client._id || group.client.phoneNumber || Math.random()}
              client={group.client}
              bills={group.bills}
              onEditBill={handleEditBill}
              onDeleteBill={handleDeleteBill}
              onPrintBill={handlePrintBill}
              onPaymentBill={handlePaymentBill}
              onOpenPaymentHistory={handleOpenPaymentHistory}
              user={currentUser}
            />
          ))}
        </Box>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add bill"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
          onClick={() => navigate('/bills/new')}
        >
          <Add />
        </Fab>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={handleClosePaymentModal}
        bill={selectedBill}
      />

      {/* Payment History Modal */}
      <PaymentHistoryModal
        open={paymentHistoryModalOpen}
        onClose={handleClosePaymentHistory}
        clientData={selectedClientBills}
      />
    </Box>
  )
}

// Payment History Modal Component
const PaymentHistoryModal = ({ open, onClose, clientData }) => {
  if (!clientData) return null;

  const { client, bills } = clientData;

  // Get all payments from all bills
  const allPayments = bills
    .filter(bill => bill.paymentHistory && bill.paymentHistory.length > 0)
    .flatMap(bill => 
      bill.paymentHistory.map(payment => ({
        ...payment,
        billNumber: bill.billNumber,
        billId: bill._id
      }))
    )
    .sort((a, b) => {
      // Sort by createdAt first (when payment was recorded), then by paymentDate
      const dateA = new Date(a.createdAt || a.paymentDate);
      const dateB = new Date(b.createdAt || b.paymentDate);
      return dateB - dateA; // Newest first
    });

  // Calculate totals
  const totalPayments = allPayments.length;
  const totalReceived = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalBillAmount = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const outstanding = totalBillAmount - totalReceived;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
        }
      }}
    >
      <DialogTitle sx={{ 
        background: 'linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <History />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Payment History - {client.clientName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {client.phoneNumber} • {client.village} {client.gender && `• ${client.gender}`}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {/* Summary Cards */}
        <Box sx={{ p: 3, background: 'white' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  {totalPayments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Payments
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  ₹{totalReceived.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Received
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="bold" color="info.main">
                  ₹{totalBillAmount.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Bills
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="bold" color="warning.main">
                  ₹{outstanding.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Outstanding
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Payment History Table */}
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Bill Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allPayments.length > 0 ? (
                allPayments.map((payment, index) => (
                  <TableRow 
                    key={`${payment.billId}-${payment._id || index}`}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { 
                        backgroundColor: 'rgba(46, 125, 50, 0.05)' 
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="500">
                        {new Date(payment.paymentDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.billNumber}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold" color="success.main">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={payment.paymentMethod || 'Cash'}
                        size="small"
                        color="default"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {payment.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No payment history available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, background: 'white' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BillsPage