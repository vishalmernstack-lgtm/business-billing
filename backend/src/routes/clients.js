const express = require('express');
const Joi = require('joi');
const Client = require('../models/Client');
const { authenticate, authorize, filterByUser } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');
const ocrService = require('../services/ocrService');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schema
const clientSchema = Joi.object({
  clientName: Joi.string().min(2).max(100).required(),
  fatherName: Joi.string().min(2).max(100).optional().allow('', null),
  motherName: Joi.string().min(2).max(100).optional().allow('', null),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  panNumber: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional().allow('', null),
  aadhaarNumber: Joi.string().pattern(/^[0-9]{12}$/).optional().allow('', null),
  phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null),
  alternatePhone: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  address: Joi.string().max(500).optional().allow('', null),
  village: Joi.string().max(100).optional().allow('', null),
  district: Joi.string().max(100).optional().allow('', null),
  state: Joi.string().max(100).optional().allow('', null),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).optional().allow('', null),
  occupation: Joi.string().max(100).optional().allow('', null),
  monthlyIncome: Joi.number().min(0).optional().allow(null),
  notes: Joi.string().max(1000).optional().allow('', null),
  familyMembers: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    relationship: Joi.string().valid('Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Son', 'Daughter', 'Other').required(),
    age: Joi.number().min(0).max(150).optional(),
    occupation: Joi.string().max(100).optional().allow('', null),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null)
  })).optional(),
  neighbors: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow('', null),
    address: Joi.string().max(200).optional().allow('', null),
    relationship: Joi.string().max(50).optional().allow('', null)
  })).optional(),
  documents: Joi.object({
    aadhaarCard: Joi.string().optional().allow('', null),
    panCard: Joi.string().optional().allow('', null),
    photo: Joi.string().optional().allow('', null),
    otherDocuments: Joi.array().items(Joi.object({
      name: Joi.string().optional(),
      path: Joi.string().optional()
    })).optional()
  }).optional()
});

// Get all clients
router.get('/', filterByUser, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { ...req.userFilter };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { clientName: { $regex: search, $options: 'i' } },
        { panNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const clients = await Client.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Client.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        clients,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get client by ID
router.get('/:id', filterByUser, async (req, res, next) => {
  try {
    const client = await Client.findOne({ 
      _id: req.params.id, 
      ...req.userFilter 
    }).populate('createdBy', 'firstName lastName email');
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' }
      });
    }
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
});

// Create new client
router.post('/', uploadDocuments, async (req, res, next) => {
  try {
    const { error, value } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    // Add document paths if files were uploaded
    const documents = {};
    if (req.files) {
      if (req.files.aadhaarCard) {
        documents.aadhaarCard = req.files.aadhaarCard[0].path;
      }
      if (req.files.panCard) {
        documents.panCard = req.files.panCard[0].path;
      }
      if (req.files.photo) {
        documents.photo = req.files.photo[0].path;
      }
    }

    const clientData = {
      ...value,
      documents,
      createdBy: req.user._id
    };

    const client = new Client(clientData);
    await client.save();

    // Trigger OCR processing for uploaded documents
    const ocrJobs = [];
    if (documents.aadhaarCard) {
      const job = await ocrService.processDocument(
        documents.aadhaarCard, 
        'aadhaar', 
        req.user._id
      );
      ocrJobs.push(job);
    }
    
    if (documents.panCard) {
      const job = await ocrService.processDocument(
        documents.panCard, 
        'pan', 
        req.user._id
      );
      ocrJobs.push(job);
    }

    await client.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      data: {
        client,
        ocrJobs
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update client
router.put('/:id', filterByUser, uploadDocuments, async (req, res, next) => {
  try {
    const { error, value } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const client = await Client.findOne({ 
      _id: req.params.id, 
      ...req.userFilter 
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' }
      });
    }

    // Update document paths if new files were uploaded
    if (req.files) {
      if (req.files.aadhaarCard) {
        value.documents = { ...client.documents, aadhaarCard: req.files.aadhaarCard[0].path };
      }
      if (req.files.panCard) {
        value.documents = { ...client.documents, panCard: req.files.panCard[0].path };
      }
      if (req.files.photo) {
        value.documents = { ...client.documents, photo: req.files.photo[0].path };
      }
    }

    Object.assign(client, value);
    await client.save();
    await client.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    next(error);
  }
});

// Delete client
router.delete('/:id', filterByUser, async (req, res, next) => {
  try {
    const client = await Client.findOneAndDelete({ 
      _id: req.params.id, 
      ...req.userFilter 
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' }
      });
    }

    res.json({
      success: true,
      data: { message: 'Client deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
});

// Upload documents for existing client
router.post('/:id/documents', filterByUser, uploadDocuments, async (req, res, next) => {
  try {
    const client = await Client.findOne({ 
      _id: req.params.id, 
      ...req.userFilter 
    });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' }
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files uploaded' }
      });
    }

    // Update document paths
    const documents = { ...client.documents };
    const ocrJobs = [];

    if (req.files.aadhaarCard) {
      documents.aadhaarCard = req.files.aadhaarCard[0].path;
      const job = await ocrService.processDocument(
        documents.aadhaarCard, 
        'aadhaar', 
        req.user._id
      );
      ocrJobs.push(job);
    }
    
    if (req.files.panCard) {
      documents.panCard = req.files.panCard[0].path;
      const job = await ocrService.processDocument(
        documents.panCard, 
        'pan', 
        req.user._id
      );
      ocrJobs.push(job);
    }
    
    if (req.files.photo) {
      documents.photo = req.files.photo[0].path;
    }

    client.documents = documents;
    await client.save();

    res.json({
      success: true,
      data: {
        client,
        ocrJobs
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;