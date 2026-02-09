const express = require('express');
const router = express.Router();
const CompanySettings = require('../models/CompanySettings');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const Joi = require('joi');

// Validation schema
const settingsSchema = Joi.object({
  companyName: Joi.string().trim().required(),
  email: Joi.string().email().trim().allow('', null),
  phone: Joi.string().trim().allow('', null),
  address: Joi.string().trim().allow('', null),
  city: Joi.string().trim().allow('', null),
  state: Joi.string().trim().allow('', null),
  pincode: Joi.string().trim().allow('', null),
  gstNumber: Joi.string().trim().allow('', null),
  website: Joi.string().uri().trim().allow('', null),
});

// Get company settings (accessible to all authenticated users)
router.get('/', authenticate, async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    
    // If no settings exist, return default values
    if (!settings) {
      settings = {
        companyName: 'Your Company Name',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstNumber: '',
        website: '',
        logo: null
      };
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
});

// Create or update company settings (Admin only)
router.post('/', [authenticate, authorize(['Admin']), upload.single('logo')], async (req, res, next) => {
  try {
    const { error, value } = settingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    // Check if settings already exist
    let settings = await CompanySettings.findOne();

    const updateData = {
      ...value
    };

    // Add logo if uploaded
    if (req.file) {
      updateData.logo = req.file.filename;
    }

    if (settings) {
      // Update existing settings
      Object.assign(settings, updateData);
      await settings.save();
    } else {
      // Create new settings
      settings = new CompanySettings({
        ...updateData,
        singleton: true
      });
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
      message: 'Company settings saved successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update company settings (Admin only)
router.put('/', [authenticate, authorize(['Admin']), upload.single('logo')], async (req, res, next) => {
  try {
    const { error, value } = settingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    let settings = await CompanySettings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new CompanySettings({
        ...value,
        singleton: true
      });
      
      if (req.file) {
        settings.logo = req.file.filename;
      }
      
      await settings.save();
    } else {
      // Update existing settings
      Object.assign(settings, value);
      
      if (req.file) {
        settings.logo = req.file.filename;
      }
      
      await settings.save();
    }

    res.json({
      success: true,
      data: settings,
      message: 'Company settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
