const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phoneNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allows multiple null values but enforces uniqueness for non-null values
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance (email already has unique index)
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  console.log('Pre-save hook triggered for user:', this.email);
  console.log('Password modified?', this.isModified('password'));
  console.log('Current password value:', this.password ? `[${this.password.length} chars]` : '[EMPTY]');
  
  if (!this.isModified('password')) {
    console.log('Password not modified, skipping hash');
    return next();
  }
  
  try {
    console.log('Hashing password for user:', this.email);
    console.log('Original password:', this.password);
    
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    console.log('Salt generated:', salt.substring(0, 10) + '...');
    console.log('Password hashed successfully. Hash:', hashedPassword.substring(0, 20) + '...');
    
    this.password = hashedPassword;
    console.log('Password set to hash for user:', this.email);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  console.log('Comparing password for user:', this.email);
  console.log('Candidate password:', candidatePassword);
  console.log('Stored hash:', this.password.substring(0, 20) + '...');
  
  const result = await bcrypt.compare(candidatePassword, this.password);
  console.log('Password comparison result:', result);
  
  return result;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);