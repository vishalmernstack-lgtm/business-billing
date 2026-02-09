const mongoose = require('mongoose');

const ocrJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    unique: true,
    required: true
  },
  documentType: {
    type: String,
    enum: ['aadhaar', 'pan'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Processing', 'Completed', 'Failed'],
    default: 'Processing'
  },
  extractedData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for performance (jobId already has unique index)
ocrJobSchema.index({ createdBy: 1 });
ocrJobSchema.index({ status: 1 });

module.exports = mongoose.model('OCRJob', ocrJobSchema);