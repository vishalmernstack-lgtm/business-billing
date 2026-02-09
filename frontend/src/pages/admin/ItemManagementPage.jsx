import React, { useState, useMemo } from 'react'
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
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material'
import {
  Search,
  Edit,
  Delete,
  Add,
} from '@mui/icons-material'
import toast from 'react-hot-toast'

import { 
  useGetItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} from '../../store/api/apiSlice'

const ItemManagementPage = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [search, setSearch] = useState('')
  const [itemDialog, setItemDialog] = useState({ open: false, item: null })
  const [itemForm, setItemForm] = useState({
    name: '',
    unitPrice: '',
    quantity: '',
    isActive: true
  })

  // Calculate total value whenever unitPrice or quantity changes
  const totalValue = useMemo(() => {
    const price = parseFloat(itemForm.unitPrice) || 0
    const qty = parseInt(itemForm.quantity) || 0
    return price * qty
  }, [itemForm.unitPrice, itemForm.quantity])
  
  const { data, isLoading, error } = useGetItemsQuery()
  const [createItem] = useCreateItemMutation()
  const [updateItem] = useUpdateItemMutation()
  const [deleteItem] = useDeleteItemMutation()

  const handleCreateItem = async () => {
    try {
      const itemData = {
        name: itemForm.name,
        unitPrice: parseFloat(itemForm.unitPrice),
        quantity: parseInt(itemForm.quantity),
        isActive: itemForm.isActive,
      }

      if (itemDialog.item) {
        await updateItem({ id: itemDialog.item._id, ...itemData }).unwrap()
        toast.success('Item updated successfully')
      } else {
        await createItem(itemData).unwrap()
        toast.success('Item created successfully')
      }
      
      setItemDialog({ open: false, item: null })
      resetItemForm()
    } catch (error) {
      toast.error('Failed to save item')
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId).unwrap()
        toast.success('Item deleted successfully')
      } catch (error) {
        console.error('Delete item error:', error)
        const errorMessage = error?.data?.error?.message || error?.message || 'Failed to delete item'
        toast.error(errorMessage)
      }
    }
  }

  const resetItemForm = () => {
    setItemForm({
      name: '',
      unitPrice: '',
      quantity: '',
      isActive: true
    })
  }

  const openItemDialog = (item = null) => {
    if (item) {
      setItemForm({
        name: item.name,
        unitPrice: item.unitPrice.toString(),
        quantity: item.quantity?.toString() || '0',
        isActive: item.isActive !== false // Default to true if undefined
      })
    } else {
      resetItemForm()
    }
    setItemDialog({ open: true, item })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  const filteredItems = data?.data?.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading items...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load items: {error?.data?.error?.message || error?.message || 'Unknown error'}
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
          <Typography variant="h4" gutterBottom>
            Item Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage items for billing and invoicing
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openItemDialog()}
          sx={{ minWidth: { xs: '100%', md: 'auto' } }}
        >
          Add Item
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search items..."
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
      </Paper>

      {/* Items List */}
      {isMobile ? (
        // Mobile Card View
        <Grid container spacing={2}>
          {filteredItems.map((item) => (
            <Grid item xs={12} key={item._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">
                          {item.name}
                        </Typography>
                        <Chip
                          label={item.isActive ? 'Active' : 'Inactive'}
                          color={item.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(item.unitPrice)} per item
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Stock: {item.quantity || 0} items
                      </Typography>
                      <Typography variant="body1" color="success.main" fontWeight="bold">
                        Total Value: {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => openItemDialog(item)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteItem(item._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
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
                <TableCell>Item Name</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="center">Stock Quantity</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(item.unitPrice)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per item
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {item.quantity || 0}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      in stock
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      total value
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(item.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={item.isActive ? 'Active' : 'Inactive'}
                      color={item.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={() => openItemDialog(item)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteItem(item._id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredItems.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" gutterBottom>
                No items found
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {search ? 
                  'Try adjusting your search to see more items.' : 
                  'Create your first item to get started.'
                }
              </Typography>
            </Box>
          )}
        </TableContainer>
      )}

      {/* Item Dialog */}
      <Dialog open={itemDialog.open} onClose={() => setItemDialog({ open: false, item: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          {itemDialog.item ? 'Edit Item' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Name"
                value={itemForm.name}
                onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={itemForm.unitPrice}
                onChange={(e) => setItemForm(prev => ({ ...prev, unitPrice: e.target.value }))}
                InputProps={{ startAdornment: '₹' }}
                helperText="Price per single item"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={itemForm.quantity}
                onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))}
                helperText="How many items in stock"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Value"
                value={formatCurrency(totalValue)}
                InputProps={{
                  readOnly: true,
                  style: { 
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }
                }}
                helperText="Auto-calculated: Unit Price × Stock Quantity"
                variant="filled"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={itemForm.isActive}
                    onChange={(e) => setItemForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active Item"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialog({ open: false, item: null })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateItem}>
            {itemDialog.item ? 'Update' : 'Create'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ItemManagementPage