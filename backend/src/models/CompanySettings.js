const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  pincode: {
    type: String,
    trim: true
  },
  gstNumber: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  logo: {
    type: String, // filename of uploaded logo
    default: null
  },
  // Only one settings document should exist
  singleton: {
    type: Boolean,
    default: true,
    unique: true
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
companySettingsSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      const error = new Error('Company settings already exist. Use update instead.');
      return next(error);
    }
  }
  next();
});

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

module.exports = CompanySettings;
