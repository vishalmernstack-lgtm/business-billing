const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  // Personal Information
  clientName: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Client name cannot exceed 100 characters']
  },
  fatherName: {
    type: String,
    required: false, // Make it optional
    trim: true,
    maxlength: [100, 'Father name cannot exceed 100 characters']
  },
  motherName: {
    type: String,
    trim: true,
    maxlength: [100, 'Mother name cannot exceed 100 characters']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  panNumber: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    uppercase: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number']
  },
  aadhaarNumber: {
    type: String,
    match: [/^[0-9]{12}$/, 'Please enter a valid Aadhaar number']
  },
  phoneNumber: {
    type: String,
    required: false, // Make it optional
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  alternatePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  email: {
    type: String,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  village: {
    type: String,
    maxlength: [100, 'Village name cannot exceed 100 characters']
  },
  district: {
    type: String,
    maxlength: [100, 'District name cannot exceed 100 characters']
  },
  state: {
    type: String,
    maxlength: [100, 'State name cannot exceed 100 characters']
  },
  pincode: {
    type: String,
    match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
  },
  
  // Family Information
  familyMembers: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    relationship: {
      type: String,
      enum: ['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Son', 'Daughter', 'Other'],
      required: true
    },
    age: {
      type: Number,
      min: [0, 'Age cannot be negative'],
      max: [150, 'Age cannot exceed 150']
    },
    occupation: {
      type: String,
      maxlength: [100, 'Occupation cannot exceed 100 characters']
    },
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    }
  }],
  
  // Neighbor/Reference Information
  neighbors: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phoneNumber: {
      type: String,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    address: {
      type: String,
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    relationship: {
      type: String,
      maxlength: [50, 'Relationship cannot exceed 50 characters']
    }
  }],
  
  // Documents
  documents: {
    aadhaarCard: {
      type: String // File path
    },
    panCard: {
      type: String // File path
    },
    photo: {
      type: String // File path
    },
    otherDocuments: [{
      name: String,
      path: String
    }]
  },
  
  // Additional Information
  occupation: {
    type: String,
    maxlength: [100, 'Occupation cannot exceed 100 characters']
  },
  monthlyIncome: {
    type: Number,
    min: [0, 'Monthly income cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for performance (panNumber already has unique index)
clientSchema.index({ createdBy: 1 });
clientSchema.index({ clientName: 1 });
clientSchema.index({ village: 1 });
clientSchema.index({ district: 1 });
// Compound index to ensure one phone number per user
clientSchema.index({ phoneNumber: 1, createdBy: 1 }, { unique: true, sparse: true });

// Ensure PAN number uniqueness only when provided
clientSchema.pre('save', function(next) {
  if (this.panNumber) {
    this.panNumber = this.panNumber.toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Client', clientSchema);