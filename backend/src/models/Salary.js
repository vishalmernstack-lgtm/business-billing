const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary cannot be negative']
  },
  allowances: {
    hra: {
      type: Number,
      default: 0,
      min: [0, 'HRA cannot be negative']
    },
    transport: {
      type: Number,
      default: 0,
      min: [0, 'Transport allowance cannot be negative']
    },
    medical: {
      type: Number,
      default: 0,
      min: [0, 'Medical allowance cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other allowance cannot be negative']
    }
  },
  deductions: {
    pf: {
      type: Number,
      default: 0,
      min: [0, 'PF deduction cannot be negative']
    },
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax deduction cannot be negative']
    },
    insurance: {
      type: Number,
      default: 0,
      min: [0, 'Insurance deduction cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other deduction cannot be negative']
    }
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  effectiveDate: {
    type: Date,
    required: [true, 'Effective date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate gross and net salary before saving
salarySchema.pre('save', function(next) {
  // Calculate gross salary (basic + all allowances)
  this.grossSalary = this.basicSalary + 
    this.allowances.hra + 
    this.allowances.transport + 
    this.allowances.medical + 
    this.allowances.other;
  
  // Calculate net salary (gross - all deductions)
  this.netSalary = this.grossSalary - 
    this.deductions.pf - 
    this.deductions.tax - 
    this.deductions.insurance - 
    this.deductions.other;
  
  next();
});

// Indexes for performance
salarySchema.index({ userId: 1 });
salarySchema.index({ effectiveDate: -1 });
salarySchema.index({ status: 1 });

// Remove any old problematic indexes on startup
salarySchema.on('index', function(error) {
  if (error) {
    console.error('Salary index error:', error);
  }
});

module.exports = mongoose.model('Salary', salarySchema);