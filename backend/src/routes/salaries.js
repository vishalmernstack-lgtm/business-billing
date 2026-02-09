const express = require('express');
const Joi = require('joi');
const Salary = require('../models/Salary');
const { authenticate, authorize, filterByUser } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schema
const salarySchema = Joi.object({
  userId: Joi.string().required(),
  basicSalary: Joi.number().min(0).required(),
  allowances: Joi.object({
    hra: Joi.number().min(0).default(0),
    transport: Joi.number().min(0).default(0),
    medical: Joi.number().min(0).default(0),
    other: Joi.number().min(0).default(0)
  }).default({}),
  deductions: Joi.object({
    pf: Joi.number().min(0).default(0),
    tax: Joi.number().min(0).default(0),
    insurance: Joi.number().min(0).default(0),
    other: Joi.number().min(0).default(0)
  }).default({}),
  effectiveDate: Joi.date().default(Date.now),
  status: Joi.string().valid('Active', 'Inactive').default('Active')
});

// Get all salaries (Admin only)
router.get('/', authorize(['Admin']), async (req, res, next) => {
  try {
    const { page = 1, limit = 10, userId, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (status) {
      query.status = status;
    }
    
    const salaries = await Salary.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort({ effectiveDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Salary.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        salaries,
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

// Get current user's salary
router.get('/my-salary', async (req, res, next) => {
  try {
    const salary = await Salary.findOne({ 
      userId: req.user._id, 
      status: 'Active' 
    })
      .populate('createdBy', 'firstName lastName email')
      .sort({ effectiveDate: -1 });
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        error: { message: 'No active salary found' }
      });
    }
    
    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    next(error);
  }
});

// Get current user's salary history
router.get('/my-salary-history', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { userId: req.user._id };
    
    if (status) {
      query.status = status;
    }
    
    const salaries = await Salary.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ effectiveDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Salary.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        salaries,
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

// Get salary by ID
router.get('/:id', async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        error: { message: 'Salary not found' }
      });
    }
    
    // Non-admin users can only view their own salary
    if (req.user.role !== 'Admin' && salary.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }
    
    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    next(error);
  }
});

// Create new salary (Admin only)
router.post('/', authorize(['Admin']), async (req, res, next) => {
  try {
    const { error, value } = salarySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    // If creating an Active salary, deactivate all previous Active salaries for this user
    if (value.status === 'Active') {
      await Salary.updateMany(
        { userId: value.userId, status: 'Active' },
        { status: 'Inactive' }
      );
    }

    const salaryData = {
      ...value,
      createdBy: req.user._id
    };

    const salary = new Salary(salaryData);
    await salary.save();

    await salary.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      data: salary
    });
  } catch (error) {
    next(error);
  }
});

// Update salary (Admin only)
router.put('/:id', authorize(['Admin']), async (req, res, next) => {
  try {
    const { error, value } = salarySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const salary = await Salary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        error: { message: 'Salary not found' }
      });
    }

    // If updating to Active status, deactivate all other Active salaries for this user
    if (value.status === 'Active' && salary.status !== 'Active') {
      await Salary.updateMany(
        { userId: salary.userId, status: 'Active', _id: { $ne: req.params.id } },
        { status: 'Inactive' }
      );
    }

    Object.assign(salary, value);
    await salary.save();

    await salary.populate([
      { path: 'userId', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.json({
      success: true,
      data: salary
    });
  } catch (error) {
    next(error);
  }
});

// Delete salary (Admin only)
router.delete('/:id', authorize(['Admin']), async (req, res, next) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        error: { message: 'Salary not found' }
      });
    }

    res.json({
      success: true,
      data: { message: 'Salary deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
});

// Get salary history for a user (Admin only)
router.get('/user/:userId/history', authorize(['Admin']), async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const salaries = await Salary.find({ userId: req.params.userId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ effectiveDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Salary.countDocuments({ userId: req.params.userId });
    
    res.json({
      success: true,
      data: {
        salaries,
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

module.exports = router;