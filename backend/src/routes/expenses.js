const express = require('express');
const Joi = require('joi');
const Expense = require('../models/Expense');
const { authenticate, authorize, filterByUser } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schema
const expenseSchema = Joi.object({
  userId: Joi.string().optional(), // Allow admin to specify userId
  title: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(500).optional().allow(''),
  category: Joi.string().valid(
    'Travel', 'Food', 'Office Supplies', 'Equipment', 'Software',
    'Marketing', 'Training', 'Utilities', 'Rent', 'Maintenance', 'Other'
  ).required(),
  amount: Joi.number().min(0).required(),
  expenseDate: Joi.date().max('now').required(),
  status: Joi.string().valid('Pending', 'Approved', 'Rejected').optional(), // Make optional since we set it programmatically
  rejectionReason: Joi.string().max(200).optional().allow('')
});

// Get all expenses
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, category, userId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    // Non-admin users can only see their own expenses
    if (req.user.role !== 'Admin') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) {
        query.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.expenseDate.$lte = new Date(endDate);
      }
    }
    
    const expenses = await Expense.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Expense.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get expense by ID
router.get('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: { message: 'Expense not found' }
      });
    }
    
    // Non-admin users can only view their own expenses
    if (req.user.role !== 'Admin' && expense.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
});

// Create new expense
router.post('/', uploadDocuments, async (req, res, next) => {
  try {
    const { error, value } = expenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    // Add receipt file if uploaded
    let receipt = null;
    if (req.files && req.files.receipt) {
      const file = req.files.receipt[0];
      receipt = {
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      };
    }

    const expenseData = {
      ...value,
      userId: req.user.role === 'Admin' && value.userId ? value.userId : req.user._id,
      createdBy: req.user._id,
      status: req.user.role === 'Admin' ? 'Approved' : 'Pending', // Admin expenses auto-approved
      receipt
    };

    const expense = new Expense(expenseData);
    await expense.save();

    await expense.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
});

// Update expense
router.put('/:id', uploadDocuments, async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: { message: 'Expense not found' }
      });
    }
    
    // Non-admin users can only update their own expenses and only if pending
    if (req.user.role !== 'Admin') {
      if (expense.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' }
        });
      }
      
      if (expense.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot update expense that is not pending' }
        });
      }
    }

    const { error, value } = expenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    // Add receipt file if uploaded
    if (req.files && req.files.receipt) {
      const file = req.files.receipt[0];
      value.receipt = {
        filename: file.filename,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size
      };
    }

    Object.assign(expense, value);
    await expense.save();

    await expense.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'approvedBy', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
});

// Approve/Reject expense (Admin only)
router.patch('/:id/status', authorize(['Admin']), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status. Must be Approved or Rejected' }
      });
    }
    
    if (status === 'Rejected' && !rejectionReason) {
      return res.status(400).json({
        success: false,
        error: { message: 'Rejection reason is required when rejecting expense' }
      });
    }

    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: { message: 'Expense not found' }
      });
    }

    expense.status = status;
    expense.approvedBy = req.user._id;
    
    if (status === 'Rejected') {
      expense.rejectionReason = rejectionReason;
    }

    await expense.save();

    await expense.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'approvedBy', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    next(error);
  }
});

// Delete expense
router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: { message: 'Expense not found' }
      });
    }
    
    // Non-admin users can only delete their own expenses and only if pending
    if (req.user.role !== 'Admin') {
      if (expense.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' }
        });
      }
      
      if (expense.status !== 'Pending') {
        return res.status(400).json({
          success: false,
          error: { message: 'Cannot delete expense that is not pending' }
        });
      }
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: { message: 'Expense deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
});

// Get expense statistics
router.get('/stats/summary', async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let matchQuery = {};
    
    // Non-admin users can only see their own stats
    if (req.user.role !== 'Admin') {
      matchQuery.userId = req.user._id;
    } else if (userId) {
      matchQuery.userId = mongoose.Types.ObjectId(userId);
    }
    
    // Date range filter
    if (startDate || endDate) {
      matchQuery.expenseDate = {};
      if (startDate) {
        matchQuery.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.expenseDate.$lte = new Date(endDate);
      }
    }
    
    const stats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0] }
          },
          approvedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, '$amount', 0] }
          }
        }
      }
    ]);
    
    const categoryStats = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalExpenses: 0,
          totalAmount: 0,
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          pendingAmount: 0,
          approvedAmount: 0
        },
        categoryBreakdown: categoryStats
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;