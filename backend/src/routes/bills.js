const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const Bill = require('../models/Bill');
const { authenticate, filterByUser } = require('../middleware/auth');
const { uploadDocuments } = require('../middleware/upload');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// Validation schemas
const billItemSchema = Joi.object({
  itemName: Joi.string().min(1).max(200).required(),
  quantity: Joi.number().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  totalPrice: Joi.number().min(0).optional()
});

const clientDetailsSchema = Joi.object({
  clientName: Joi.string().min(2).max(100).required(),
  phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  village: Joi.string().min(1).max(100).required(),
  photo: Joi.string().optional().allow(''),
  aadhaarPhoto: Joi.string().optional().allow(''),
  panPhoto: Joi.string().optional().allow('')
});

const referenceDetailsSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional().allow(''),
  phoneNumber: Joi.string().pattern(/^[0-9]{10}$/).optional().allow(''),
  gender: Joi.string().valid('Male', 'Female', 'Other', '').optional().allow(''), // Allow empty string
  village: Joi.string().min(1).max(100).optional().allow(''),
  photo: Joi.string().optional().allow(''),
  aadhaarPhoto: Joi.string().optional().allow(''),
  panPhoto: Joi.string().optional().allow('')
});

const billSchema = Joi.object({
  clientDetails: clientDetailsSchema.required(),
  references: Joi.array().items(referenceDetailsSchema).optional().default([]),
  items: Joi.array().items(billItemSchema).min(1).required(),
  subtotal: Joi.number().min(0).required(),
  tax: Joi.number().min(0).default(0),
  totalAmount: Joi.number().min(0).required(),
  paidAmount: Joi.number().min(0).default(0),
  status: Joi.string().valid('Draft', 'Sent', 'Partial', 'Paid').default('Draft'),
  paymentDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().allow('', null),
    Joi.allow(null)
  ).optional(),
  paymentHistory: Joi.array().items(Joi.object({
    amount: Joi.number().min(0).required(),
    paymentDate: Joi.date().default(Date.now),
    paymentMethod: Joi.string().valid('Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other').default('Cash'),
    notes: Joi.string().max(500).allow('').optional(),
    recordedBy: Joi.string().optional()
  })).optional().default([])
});

const paymentSchema = Joi.object({
  amount: Joi.number().min(0.01).required(),
  paymentMethod: Joi.string().valid('Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other').default('Cash'),
  notes: Joi.string().max(500).allow('').optional(),
  paymentDate: Joi.date().default(Date.now)
});

// Debug endpoint - list all bills (remove in production)
router.get('/debug/all', authenticate, async (req, res, next) => {
  try {
    console.log('=== DEBUG: LISTING ALL BILLS ===');
    const bills = await Bill.find({}).select('_id billNumber clientDetails.clientName createdBy status').limit(10);
    console.log('Total bills found:', bills.length);
    
    bills.forEach((bill, index) => {
      console.log(`Bill ${index + 1}:`);
      console.log('- ID:', bill._id);
      console.log('- Bill Number:', bill.billNumber);
      console.log('- Client:', bill.clientDetails?.clientName);
      console.log('- Created By:', bill.createdBy);
      console.log('- Status:', bill.status);
    });
    
    res.json({
      success: true,
      data: bills,
      message: 'Debug endpoint - showing first 10 bills'
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    next(error);
  }
});

// Get all bills
router.get('/', filterByUser, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { ...req.userFilter };
    
    // Add filters
    if (status) {
      query.status = status;
    }
    
    // Add comprehensive search functionality
    if (search) {
      query.$or = [
        { 'clientDetails.clientName': { $regex: search, $options: 'i' } },
        { 'clientDetails.phoneNumber': { $regex: search, $options: 'i' } },
        { 'billNumber': { $regex: search, $options: 'i' } },
        { 'items.itemName': { $regex: search, $options: 'i' } }
      ];
    }
    
    const bills = await Bill.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Bill.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        bills,
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

// Get bill by ID
router.get('/:id', filterByUser, async (req, res, next) => {
  console.log('=== GET BILL BY ID DEBUG START ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    const { id } = req.params;
    console.log('Extracted Bill ID:', id);
    console.log('Bill ID type:', typeof id);
    console.log('Bill ID length:', id.length);
    
    // Validate ObjectId format
    console.log('Validating ObjectId format...');
    const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
    console.log('Is valid ObjectId:', isValidObjectId);
    
    if (!isValidObjectId) {
      console.log('❌ Invalid ObjectId format, returning 400');
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid bill ID format' }
      });
    }
    
    console.log('✅ ObjectId validation passed');
    console.log('User from auth middleware:', req.user ? req.user._id : 'No user');
    console.log('User filter from middleware:', JSON.stringify(req.userFilter, null, 2));
    
    console.log('Searching for bill in database...');
    const startTime = Date.now();
    
    const bill = await Bill.findOne({ 
      _id: id, 
      ...req.userFilter 
    })
      .populate('createdBy', 'firstName lastName email');
    
    const endTime = Date.now();
    console.log(`Database query completed in ${endTime - startTime}ms`);
    console.log('Bill found:', bill ? '✅ YES' : '❌ NO');
    
    if (bill) {
      console.log('Bill details:');
      console.log('- Bill Number:', bill.billNumber);
      console.log('- Client Name:', bill.clientDetails?.clientName);
      console.log('- Created By:', bill.createdBy?._id);
      console.log('- Status:', bill.status);
      console.log('- Total Amount:', bill.totalAmount);
    } else {
      console.log('❌ Bill not found - possible reasons:');
      console.log('1. Bill ID does not exist in database');
      console.log('2. Bill belongs to different user (user filter)');
      console.log('3. Bill was deleted');
      
      // Let's check if bill exists without user filter
      console.log('Checking if bill exists without user filter...');
      const billWithoutFilter = await Bill.findById(id);
      console.log('Bill exists without filter:', billWithoutFilter ? '✅ YES' : '❌ NO');
      
      if (billWithoutFilter) {
        console.log('Bill belongs to user:', billWithoutFilter.createdBy);
        console.log('Current user:', req.user?._id);
        console.log('User filter createdBy:', req.userFilter?.createdBy);
      }
    }
    
    if (!bill) {
      console.log('Returning 404 - Bill not found');
      return res.status(404).json({
        success: false,
        error: { message: 'Bill not found' }
      });
    }
    
    console.log('✅ Setting cache-control headers...');
    // Add cache-control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    console.log('✅ Sending successful response');
    console.log('=== GET BILL BY ID DEBUG END ===');
    
    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    console.log('❌ ERROR in GET bill by ID:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('=== GET BILL BY ID DEBUG END (ERROR) ===');
    next(error);
  }
});

// Create new bill
router.post('/', uploadDocuments, async (req, res, next) => {
  try {
    // Parse JSON strings from FormData back to objects
    const parseFormData = (body) => {
      const parsed = { ...body };
      
      // Parse JSON strings back to objects
      if (typeof parsed.clientDetails === 'string') {
        parsed.clientDetails = JSON.parse(parsed.clientDetails);
      }
      if (typeof parsed.references === 'string') {
        parsed.references = JSON.parse(parsed.references);
      }
      if (typeof parsed.items === 'string') {
        parsed.items = JSON.parse(parsed.items);
      }
      
      // Convert string numbers back to numbers
      if (typeof parsed.subtotal === 'string') {
        parsed.subtotal = parseFloat(parsed.subtotal);
      }
      if (typeof parsed.totalAmount === 'string') {
        parsed.totalAmount = parseFloat(parsed.totalAmount);
      }
      
      // Convert date string back to Date object
      if (typeof parsed.paymentDate === 'string' && parsed.paymentDate && parsed.paymentDate !== 'null') {
        parsed.paymentDate = new Date(parsed.paymentDate);
      } else if (parsed.paymentDate === 'null' || !parsed.paymentDate) {
        parsed.paymentDate = null;
      }
      
      return parsed;
    };

    const parsedBody = parseFormData(req.body);
    
    const { error, value } = billSchema.validate(parsedBody);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    // Handle file uploads
    const processFileUploads = (files, prefix = '') => {
      const result = {};
      if (files) {
        if (files.photo && files.photo[0]) {
          result[`${prefix}photo`] = files.photo[0].filename;
        }
        if (files.aadhaarCard && files.aadhaarCard[0]) {
          result[`${prefix}aadhaarPhoto`] = files.aadhaarCard[0].filename;
        }
        if (files.panCard && files.panCard[0]) {
          result[`${prefix}panPhoto`] = files.panCard[0].filename;
        }
      }
      return result;
    };

    // Process client document uploads
    const clientFiles = processFileUploads(req.files);
    
    const billData = {
      ...value,
      clientDetails: {
        ...value.clientDetails,
        ...clientFiles
      },
      createdBy: req.user._id
    };

    const bill = new Bill(billData);
    
    // If there's an initial payment, add it to payment history
    if (bill.paidAmount > 0 && bill.paymentDate) {
      bill.paymentHistory.push({
        amount: bill.paidAmount,
        paymentDate: bill.paymentDate,
        paymentMethod: 'Cash', // Default method for initial payment
        notes: 'Initial payment at bill creation',
        recordedBy: req.user._id
      });
    }
    
    await bill.save();

    await bill.populate('createdBy', 'firstName lastName email');

    // Auto-create or update client based on phone number
    try {
      const Client = require('../models/Client');
      const phoneNumber = value.clientDetails.phoneNumber;
      
      // Check if client with this phone number already exists
      let client = await Client.findOne({ 
        phoneNumber: phoneNumber,
        createdBy: req.user._id 
      });

      if (client) {
        // Update existing client with new information if provided
        console.log(`Client with phone ${phoneNumber} already exists, updating...`);
        
        // Only update fields if they have values
        if (value.clientDetails.clientName) client.clientName = value.clientDetails.clientName;
        if (value.clientDetails.gender) client.gender = value.clientDetails.gender;
        if (value.clientDetails.village) client.village = value.clientDetails.village;
        
        // Update documents if new ones were uploaded
        if (clientFiles.photo) {
          client.documents = client.documents || {};
          client.documents.photo = `uploads/photos/${clientFiles.photo}`;
        }
        if (clientFiles.aadhaarPhoto) {
          client.documents = client.documents || {};
          client.documents.aadhaarCard = `uploads/aadhaar/${clientFiles.aadhaarPhoto}`;
        }
        if (clientFiles.panPhoto) {
          client.documents = client.documents || {};
          client.documents.panCard = `uploads/pan/${clientFiles.panPhoto}`;
        }
        
        await client.save();
        console.log(`Client updated successfully: ${client.clientName}`);
      } else {
        // Create new client
        console.log(`Creating new client with phone ${phoneNumber}...`);
        
        const clientData = {
          clientName: value.clientDetails.clientName,
          phoneNumber: phoneNumber,
          gender: value.clientDetails.gender,
          village: value.clientDetails.village,
          documents: {},
          createdBy: req.user._id
        };

        // Add document paths if files were uploaded
        if (clientFiles.photo) {
          clientData.documents.photo = `uploads/photos/${clientFiles.photo}`;
        }
        if (clientFiles.aadhaarPhoto) {
          clientData.documents.aadhaarCard = `uploads/aadhaar/${clientFiles.aadhaarPhoto}`;
        }
        if (clientFiles.panPhoto) {
          clientData.documents.panCard = `uploads/pan/${clientFiles.panPhoto}`;
        }

        client = new Client(clientData);
        await client.save();
        console.log(`New client created successfully: ${client.clientName}`);
      }
    } catch (clientError) {
      // Log error but don't fail the bill creation
      console.error('Error auto-creating/updating client:', clientError);
      console.error('Bill was created successfully, but client sync failed');
    }

    res.status(201).json({
      success: true,
      data: bill
    });
  } catch (error) {
    next(error);
  }
});

// Update bill
router.put('/:id', filterByUser, uploadDocuments, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid bill ID format' }
      });
    }
    
    // Check if bill exists and get current status
    const existingBill = await Bill.findOne({ 
      _id: id, 
      ...req.userFilter 
    });
    
    if (!existingBill) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bill not found' }
      });
    }

    // Prevent editing paid bills (except for Admin users)
    if (existingBill.status === 'Paid' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Cannot edit paid bills. Paid bills are locked to maintain data integrity. Only Admin users can edit paid bills.' }
      });
    }
    
    // Parse JSON strings from FormData back to objects
    const parseFormData = (body) => {
      const parsed = { ...body };
      
      // Parse JSON strings back to objects
      if (typeof parsed.clientDetails === 'string') {
        parsed.clientDetails = JSON.parse(parsed.clientDetails);
      }
      if (typeof parsed.references === 'string') {
        parsed.references = JSON.parse(parsed.references);
      }
      if (typeof parsed.items === 'string') {
        parsed.items = JSON.parse(parsed.items);
      }
      
      // Convert string numbers back to numbers
      if (typeof parsed.subtotal === 'string') {
        parsed.subtotal = parseFloat(parsed.subtotal);
      }
      if (typeof parsed.totalAmount === 'string') {
        parsed.totalAmount = parseFloat(parsed.totalAmount);
      }
      
      // Convert date string back to Date object
      if (typeof parsed.paymentDate === 'string' && parsed.paymentDate && parsed.paymentDate !== 'null') {
        parsed.paymentDate = new Date(parsed.paymentDate);
      } else if (parsed.paymentDate === 'null' || !parsed.paymentDate) {
        parsed.paymentDate = null;
      }
      
      return parsed;
    };

    const parsedBody = parseFormData(req.body);
    
    const { error, value } = billSchema.validate(parsedBody);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    console.log('Updating bill with ID:', id);
    console.log('Update data:', value);

    // Handle file uploads for updates
    const processFileUploads = (files, prefix = '') => {
      const result = {};
      if (files) {
        if (files.photo && files.photo[0]) {
          result[`${prefix}photo`] = files.photo[0].filename;
        }
        if (files.aadhaarCard && files.aadhaarCard[0]) {
          result[`${prefix}aadhaarPhoto`] = files.aadhaarCard[0].filename;
        }
        if (files.panCard && files.panCard[0]) {
          result[`${prefix}panPhoto`] = files.panCard[0].filename;
        }
      }
      return result;
    };

    // Process client document uploads
    const clientFiles = processFileUploads(req.files);
    
    // Merge uploaded files with existing client details
    const updatedClientDetails = {
      ...value.clientDetails,
      ...clientFiles
    };

    // Check if payment amount has increased
    const oldPaidAmount = existingBill.paidAmount || 0;
    const newPaidAmount = value.paidAmount || 0;
    const paymentIncrease = newPaidAmount - oldPaidAmount;

    Object.assign(existingBill, {
      ...value,
      clientDetails: updatedClientDetails
    });
    
    // If payment increased, add the difference to payment history
    if (paymentIncrease > 0 && value.paymentDate) {
      existingBill.paymentHistory.push({
        amount: paymentIncrease,
        paymentDate: value.paymentDate,
        paymentMethod: 'Cash', // Default method
        notes: 'Payment added during bill update',
        recordedBy: req.user._id
      });
    }
    
    await existingBill.save();

    await existingBill.populate('createdBy', 'firstName lastName email');

    console.log('Bill updated successfully');

    // Auto-update client based on phone number
    try {
      const Client = require('../models/Client');
      const phoneNumber = value.clientDetails.phoneNumber;
      
      // Check if client with this phone number exists
      let client = await Client.findOne({ 
        phoneNumber: phoneNumber,
        createdBy: req.user._id 
      });

      if (client) {
        // Update existing client with new information if provided
        console.log(`Updating client with phone ${phoneNumber}...`);
        
        // Only update fields if they have values
        if (value.clientDetails.clientName) client.clientName = value.clientDetails.clientName;
        if (value.clientDetails.gender) client.gender = value.clientDetails.gender;
        if (value.clientDetails.village) client.village = value.clientDetails.village;
        
        // Update documents if new ones were uploaded
        if (clientFiles.photo) {
          client.documents = client.documents || {};
          client.documents.photo = `uploads/photos/${clientFiles.photo}`;
        }
        if (clientFiles.aadhaarPhoto) {
          client.documents = client.documents || {};
          client.documents.aadhaarCard = `uploads/aadhaar/${clientFiles.aadhaarPhoto}`;
        }
        if (clientFiles.panPhoto) {
          client.documents = client.documents || {};
          client.documents.panCard = `uploads/pan/${clientFiles.panPhoto}`;
        }
        
        await client.save();
        console.log(`Client updated successfully: ${client.clientName}`);
      } else {
        // Create new client if doesn't exist
        console.log(`Creating new client with phone ${phoneNumber}...`);
        
        const clientData = {
          clientName: value.clientDetails.clientName,
          phoneNumber: phoneNumber,
          gender: value.clientDetails.gender,
          village: value.clientDetails.village,
          documents: {},
          createdBy: req.user._id
        };

        // Add document paths if files were uploaded
        if (clientFiles.photo) {
          clientData.documents.photo = `uploads/photos/${clientFiles.photo}`;
        }
        if (clientFiles.aadhaarPhoto) {
          clientData.documents.aadhaarCard = `uploads/aadhaar/${clientFiles.aadhaarPhoto}`;
        }
        if (clientFiles.panPhoto) {
          clientData.documents.panCard = `uploads/pan/${clientFiles.panPhoto}`;
        }

        client = new Client(clientData);
        await client.save();
        console.log(`New client created successfully: ${client.clientName}`);
      }
    } catch (clientError) {
      // Log error but don't fail the bill update
      console.error('Error auto-creating/updating client:', clientError);
      console.error('Bill was updated successfully, but client sync failed');
    }

    res.json({
      success: true,
      data: existingBill
    });
  } catch (error) {
    console.error('Error updating bill:', error);
    next(error);
  }
});

// Partial update bill (for status changes, etc.)
router.patch('/:id', filterByUser, async (req, res, next) => {
  try {
    const allowedFields = ['status', 'paymentDate'];
    const updates = {};
    
    // Only allow specific fields for partial updates
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No valid fields to update' }
      });
    }

    // Check if bill exists and get current status
    const existingBill = await Bill.findOne({ 
      _id: req.params.id, 
      ...req.userFilter 
    });
    
    if (!existingBill) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bill not found' }
      });
    }

    // Prevent editing paid bills (except for admin operations)
    if (existingBill.status === 'Paid' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Cannot modify paid bills. Paid bills are locked to maintain data integrity.' }
      });
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, ...req.userFilter },
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: bill
    });
  } catch (error) {
    next(error);
  }
});

// Add payment to existing bill
router.post('/:id/payments', filterByUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid bill ID format' }
      });
    }

    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const bill = await Bill.findOne({ 
      _id: id, 
      ...req.userFilter 
    });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bill not found' }
      });
    }

    // Check if payment amount exceeds due amount
    const remainingDue = bill.totalAmount - bill.paidAmount;
    if (value.amount > remainingDue) {
      return res.status(400).json({
        success: false,
        error: { 
          message: `Payment amount (₹${value.amount}) exceeds due amount (₹${remainingDue.toFixed(2)})` 
        }
      });
    }

    // Add payment using the model method
    await bill.addPayment({
      ...value,
      recordedBy: req.user._id
    });

    await bill.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: bill,
      message: `Payment of ₹${value.amount} added successfully`
    });
  } catch (error) {
    next(error);
  }
});

// Get payment history for a bill
router.get('/:id/payments', filterByUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid bill ID format' }
      });
    }

    const bill = await Bill.findOne({ 
      _id: id, 
      ...req.userFilter 
    })
    .populate('paymentHistory.recordedBy', 'firstName lastName email')
    .select('paymentHistory totalAmount paidAmount dueAmount billNumber clientDetails.clientName');
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bill not found' }
      });
    }

    res.json({
      success: true,
      data: {
        billInfo: {
          billNumber: bill.billNumber,
          clientName: bill.clientDetails.clientName,
          totalAmount: bill.totalAmount,
          paidAmount: bill.paidAmount,
          dueAmount: bill.dueAmount
        },
        paymentHistory: bill.paymentHistory.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete payment from a bill (Admin only)
router.delete('/:id/payments/:paymentId', filterByUser, async (req, res, next) => {
  try {
    const { id, paymentId } = req.params;
    
    // Check if user is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Only Admin users can delete payments' }
      });
    }
    
    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid bill ID or payment ID format' }
      });
    }

    const bill = await Bill.findOne({ 
      _id: id, 
      ...req.userFilter 
    });
    
    if (!bill) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bill not found' }
      });
    }

    // Find the payment to delete
    const paymentIndex = bill.paymentHistory.findIndex(
      payment => payment._id.toString() === paymentId
    );

    if (paymentIndex === -1) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found' }
      });
    }

    // Get payment amount before deletion
    const deletedPaymentAmount = bill.paymentHistory[paymentIndex].amount;

    // Remove the payment
    bill.paymentHistory.splice(paymentIndex, 1);

    // Recalculate paid amount
    bill.paidAmount = bill.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);

    // Update status based on new paid amount
    if (bill.paidAmount === 0) {
      bill.status = 'Sent';
    } else if (bill.paidAmount < bill.totalAmount) {
      bill.status = 'Partial';
    } else if (bill.paidAmount >= bill.totalAmount) {
      bill.status = 'Paid';
    }

    await bill.save();
    await bill.populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: bill,
      message: `Payment of ₹${deletedPaymentAmount} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
});

// Delete bill
router.delete('/:id', filterByUser, async (req, res, next) => {
  try {
    // Check if bill exists and get current status
    const existingBill = await Bill.findOne({ 
      _id: req.params.id, 
      ...req.userFilter 
    });
    
    if (!existingBill) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bill not found' }
      });
    }

    // Prevent deleting paid bills (except for admin)
    if (existingBill.status === 'Paid' && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Cannot delete paid bills. Paid bills are locked to maintain data integrity.' }
      });
    }

    const bill = await Bill.findOneAndDelete({ 
      _id: req.params.id, 
      ...req.userFilter 
    });

    res.json({
      success: true,
      data: { message: 'Bill deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
});

// Get bills by user (for admin)
router.get('/user/:userId', authenticate, async (req, res, next) => {
  try {
    // Only admin can access other users' bills
    if (req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const bills = await Bill.find({ createdBy: req.params.userId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Bill.countDocuments({ createdBy: req.params.userId });
    
    res.json({
      success: true,
      data: {
        bills,
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

module.exports = router;