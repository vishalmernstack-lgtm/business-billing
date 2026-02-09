const mongoose = require('mongoose')

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10,
    min: [0, 'Minimum stock level cannot be negative']
  },
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Virtual field for total value (unitPrice * quantity)
itemSchema.virtual('totalValue').get(function() {
  return this.unitPrice * this.quantity;
});

// Index for better query performance
itemSchema.index({ name: 1 })
itemSchema.index({ category: 1 })
itemSchema.index({ isActive: 1 })
itemSchema.index({ createdBy: 1 })

module.exports = mongoose.model('Item', itemSchema)