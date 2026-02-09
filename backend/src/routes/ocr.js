const express = require('express');
const { authenticate } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');
const ocrService = require('../services/ocrService');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Process Aadhaar card
router.post('/aadhaar', uploadSingle('aadhaarCard'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'Aadhaar card image is required' }
      });
    }

    const result = await ocrService.processDocument(
      req.file.path,
      'aadhaar',
      req.user._id
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Process PAN card
router.post('/pan', uploadSingle('panCard'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'PAN card image is required' }
      });
    }

    const result = await ocrService.processDocument(
      req.file.path,
      'pan',
      req.user._id
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get OCR job status
router.get('/status/:jobId', async (req, res, next) => {
  try {
    const result = await ocrService.getJobStatus(req.params.jobId, req.user._id);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        error: { message: error.message }
      });
    }
    next(error);
  }
});

module.exports = router;