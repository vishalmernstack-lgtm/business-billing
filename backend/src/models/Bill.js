const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [200, 'Item name cannot exceed 200 characters']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

// Payment history schema for tracking partial payments
const paymentHistorySchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: [0, 'Payment amount cannot be negative']
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'],
    default: 'Cash'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Payment notes cannot exceed 500 characters']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { 
  timestamps: true,
  _id: true 
});

// Client details embedded in bill
const clientDetailsSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Client name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  village: {
    type: String,
    required: [true, 'Village is required'],
    trim: true,
    maxlength: [100, 'Village name cannot exceed 100 characters']
  },
  photo: {
    type: String,
    trim: true
  },
  aadhaarPhoto: {
    type: String,
    trim: true
  },
  panPhoto: {
    type: String,
    trim: true
  }
}, { _id: false });

// Reference details embedded in bill (optional)
const referenceDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Reference name cannot exceed 100 characters']
  },
  phoneNumber: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
    // Note: gender is optional for references (no required: true)
  },
  village: {
    type: String,
    trim: true,
    maxlength: [100, 'Village name cannot exceed 100 characters']
  },
  photo: {
    type: String,
    trim: true
  },
  aadhaarPhoto: {
    type: String,
    trim: true
  },
  panPhoto: {
    type: String,
    trim: true
  }
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNumber: {
    type: String,
    unique: true
  },
  clientDetails: {
    type: clientDetailsSchema,
    required: [true, 'Client details are required']
  },
  references: {
    type: [referenceDetailsSchema],
    default: []
  },
  items: {
    type: [billItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'At least one item is required'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  // Payment tracking fields
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Paid amount cannot be negative']
  },
  dueAmount: {
    type: Number,
    default: 0,
    min: [0, 'Due amount cannot be negative']
  },
  paymentHistory: {
    type: [paymentHistorySchema],
    default: []
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Partial', 'Paid'],
    default: 'Draft'
  },
  paymentDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance (billNumber already has unique index)
billSchema.index({ createdBy: 1 });
billSchema.index({ 'clientDetails.clientName': 1 });
billSchema.index({ 'clientDetails.phoneNumber': 1 });
billSchema.index({ status: 1 });

// Generate bill number before saving
billSchema.pre('save', async function(next) {
  if (!this.billNumber) {
    try {
      // Use a more robust method to generate unique bill numbers
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      
      // Find the latest bill number for current month/year
      const latestBill = await mongoose.model('Bill')
        .findOne({}, {}, { sort: { 'createdAt': -1 } });
      
      let billNumber;
      if (latestBill && latestBill.billNumber) {
        // Extract number from existing bill number (e.g., BILL-000001 -> 1)
        const match = latestBill.billNumber.match(/BILL-(\d+)/);
        const lastNumber = match ? parseInt(match[1]) : 0;
        billNumber = `BILL-${String(lastNumber + 1).padStart(6, '0')}`;
      } else {
        // First bill
        billNumber = 'BILL-000001';
      }
      
      this.billNumber = billNumber;
    } catch (error) {
      console.error('Error generating bill number:', error);
      // Fallback to timestamp-based number
      this.billNumber = `BILL-${Date.now()}`;
    }
  }
  
  // Calculate item totals
  this.items.forEach(item => {
    item.totalPrice = item.quantity * item.unitPrice;
  });
  
  // Calculate subtotal
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate total amount (subtotal + tax)
  this.totalAmount = this.subtotal + this.tax;
  
  // Calculate due amount
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  // Auto-update status based on payment
  if (this.paidAmount === 0) {
    if (this.status === 'Paid' || this.status === 'Partial') {
      this.status = 'Sent'; // Reset to Sent if no payment
    }
  } else if (this.paidAmount >= this.totalAmount) {
    this.status = 'Paid';
    if (!this.paymentDate) {
      this.paymentDate = new Date();
    }
  } else if (this.paidAmount > 0 && this.paidAmount < this.totalAmount) {
    this.status = 'Partial';
  }
  
  next();
});

// Method to add payment
billSchema.methods.addPayment = function(paymentData) {
  const payment = {
    amount: paymentData.amount,
    paymentDate: paymentData.paymentDate || new Date(),
    paymentMethod: paymentData.paymentMethod || 'Cash',
    notes: paymentData.notes || '',
    recordedBy: paymentData.recordedBy
  };
  
  this.paymentHistory.push(payment);
  this.paidAmount += payment.amount;
  
  return this.save();
};

// Method to get payment summary
billSchema.methods.getPaymentSummary = function() {
  return {
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    dueAmount: this.dueAmount,
    paymentCount: this.paymentHistory.length,
    lastPaymentDate: this.paymentHistory.length > 0 
      ? this.paymentHistory[this.paymentHistory.length - 1].paymentDate 
      : null
  };
};

module.exports = mongoose.model('Bill', billSchema);