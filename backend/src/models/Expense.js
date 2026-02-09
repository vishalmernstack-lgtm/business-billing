const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Travel',
      'Food',
      'Office Supplies',
      'Equipment',
      'Software',
      'Marketing',
      'Training',
      'Utilities',
      'Rent',
      'Maintenance',
      'Other'
    ]
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  expenseDate: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  receipt: {
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance
expenseSchema.index({ userId: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ createdBy: 1 });

// Update approved date when status changes to approved
expenseSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'Approved' && !this.approvedDate) {
    this.approvedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);