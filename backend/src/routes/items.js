const express = require('express')
const router = express.Router()
const Item = require('../models/Item')
const { authenticate } = require('../middleware/auth')
const { body, validationResult } = require('express-validator')

// Get all items
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, category = '', search = '', isActive } = req.query

    const query = {}
    
    // If isActive is specified, filter by it. Otherwise show all for admin
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true'
    }
    
    if (category) {
      query.category = new RegExp(category, 'i')
    }
    
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') }
      ]
    }

    const items = await Item.find(query)
      .populate('createdBy', 'name email')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Item.countDocuments(query)

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get items error:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch items' }
    })
  }
})

// Get active items only (for bill creation)
router.get('/active', authenticate, async (req, res) => {
  try {
    const items = await Item.find({ isActive: true })
      .select('name unitPrice quantity')
      .sort({ name: 1 })

    res.json({
      success: true,
      data: items
    })
  } catch (error) {
    console.error('Get active items error:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch active items' }
    })
  }
});

// Get single item
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('createdBy', 'name email')
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Item not found' }
      })
    }

    res.json({
      success: true,
      data: item
    })
  } catch (error) {
    console.error('Get item error:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch item' }
    })
  }
})

// Create item (Admin only)
router.post('/', [
  authenticate,
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('unitPrice').isNumeric().withMessage('Unit price must be a number').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('quantity').isNumeric().withMessage('Quantity must be a number').isInt({ min: 0 }).withMessage('Quantity cannot be negative'),
  body('category').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. Admin role required.' }
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      })
    }

    const { name, unitPrice, quantity, category, isActive = true } = req.body

    // Check if item with same name already exists
    const existingItem = await Item.findOne({ name: new RegExp(`^${name}$`, 'i') })
    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: { message: 'Item with this name already exists' }
      })
    }

    const item = new Item({
      name,
      unitPrice,
      quantity,
      category,
      isActive,
      createdBy: req.user.id
    })

    await item.save()
    await item.populate('createdBy', 'name email')

    res.status(201).json({
      success: true,
      data: item,
      message: 'Item created successfully'
    })
  } catch (error) {
    console.error('Create item error:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create item' }
    })
  }
})

// Update item (Admin only)
router.put('/:id', [
  authenticate,
  body('name').optional().trim().notEmpty().withMessage('Item name cannot be empty'),
  body('unitPrice').optional().isNumeric().withMessage('Unit price must be a number').isFloat({ min: 0 }).withMessage('Unit price cannot be negative'),
  body('quantity').optional().isNumeric().withMessage('Quantity must be a number').isInt({ min: 0 }).withMessage('Quantity cannot be negative'),
  body('category').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. Admin role required.' }
      })
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', details: errors.array() }
      })
    }

    const item = await Item.findById(req.params.id)
    if (!item) {
      return res.status(404).json({
        success: false,
        error: { message: 'Item not found' }
      })
    }

    const { name, unitPrice, quantity, category, isActive } = req.body

    // Check if item with same name already exists (excluding current item)
    if (name && name !== item.name) {
      const existingItem = await Item.findOne({ 
        name: new RegExp(`^${name}$`, 'i'),
        _id: { $ne: req.params.id }
      })
      if (existingItem) {
        return res.status(400).json({
          success: false,
          error: { message: 'Item with this name already exists' }
        })
      }
    }

    // Update fields
    if (name !== undefined) item.name = name
    if (unitPrice !== undefined) item.unitPrice = unitPrice
    if (quantity !== undefined) item.quantity = quantity
    if (category !== undefined) item.category = category
    if (isActive !== undefined) item.isActive = isActive

    await item.save()
    await item.populate('createdBy', 'name email')

    res.json({
      success: true,
      data: item,
      message: 'Item updated successfully'
    })
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update item' }
    })
  }
})

// Delete item (Admin only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    console.log('Delete item request for ID:', req.params.id)
    console.log('User role:', req.user.role)
    
    // Check if user is admin
    if (req.user.role !== 'Admin') {
      console.log('Access denied - user is not admin')
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. Admin role required.' }
      })
    }

    const item = await Item.findById(req.params.id)
    console.log('Found item:', item ? item.name : 'null')
    
    if (!item) {
      console.log('Item not found')
      return res.status(404).json({
        success: false,
        error: { message: 'Item not found' }
      })
    }

    // Actually delete the item instead of soft delete
    console.log('Deleting item from database')
    await Item.findByIdAndDelete(req.params.id)
    console.log('Item successfully deleted')

    res.json({
      success: true,
      message: 'Item deleted successfully'
    })
  } catch (error) {
    console.error('Delete item error:', error)
    console.error('Error stack:', error.stack)
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete item', details: error.message }
    })
  }
})

module.exports = router