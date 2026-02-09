const express = require('express');
const User = require('../models/User');
const Client = require('../models/Client');
const Bill = require('../models/Bill');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorize(['Admin']));

// Test endpoint to check database connection and users
router.get('/test-users', async (req, res, next) => {
  try {
    console.log('Test users endpoint called');
    
    // Check database connection
    const dbState = require('mongoose').connection.readyState;
    console.log('Database connection state:', dbState); // 1 = connected
    
    // Get all users without any filtering
    const allUsers = await User.find({}).select('-password');
    console.log('All users found:', allUsers);
    
    res.json({
      success: true,
      data: {
        dbState,
        userCount: allUsers.length,
        users: allUsers
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get dashboard analytics
router.get('/dashboard', async (req, res, next) => {
  try {
    // Get total sales amount (all bills)
    const salesAggregation = await Bill.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$totalAmount' },
          totalBills: { $sum: 1 }
        }
      }
    ]);

    const totalSales = salesAggregation[0]?.totalSales || 0;
    const totalBills = salesAggregation[0]?.totalBills || 0;

    // Get paid bills amount
    const paidBillsAggregation = await Bill.aggregate([
      {
        $match: { status: 'Paid' }
      },
      {
        $group: {
          _id: null,
          paidAmount: { $sum: '$totalAmount' },
          paidBills: { $sum: 1 }
        }
      }
    ]);

    const paidAmount = paidBillsAggregation[0]?.paidAmount || 0;
    const paidBills = paidBillsAggregation[0]?.paidBills || 0;

    // Get pending bills amount (Sent and Draft status)
    const pendingBillsAggregation = await Bill.aggregate([
      {
        $match: { status: { $in: ['Sent', 'Draft'] } }
      },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: '$totalAmount' },
          pendingBills: { $sum: 1 }
        }
      }
    ]);

    const pendingAmount = pendingBillsAggregation[0]?.pendingAmount || 0;
    const pendingBills = pendingBillsAggregation[0]?.pendingBills || 0;

    // Get total users count
    const totalUsers = await User.countDocuments({ isActive: true });

    // Get total clients count
    const totalClients = await Client.countDocuments();

    // Get user-wise sales (show all users, not just those with bills)
    const allUsers = await User.find({ isActive: true }).select('firstName lastName email phoneNumber');
    
    // Get bill statistics per user
    const billStats = await Bill.aggregate([
      {
        $group: {
          _id: '$createdBy',
          totalSales: { $sum: '$totalAmount' },
          totalReceiveAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Paid'] }, '$totalAmount', 0]
            }
          },
          totalPendingAmount: {
            $sum: {
              $cond: [{ $in: ['$status', ['Sent', 'Draft']] }, '$totalAmount', 0]
            }
          },
          billCount: { $sum: 1 }
        }
      }
    ]);

    // Create a map of bill statistics by user ID
    const billStatsMap = {};
    billStats.forEach(stat => {
      billStatsMap[stat._id.toString()] = stat;
    });

    // Combine all users with their bill statistics
    const userSales = allUsers.map(user => {
      const stats = billStatsMap[user._id.toString()] || {
        totalSales: 0,
        totalReceiveAmount: 0,
        totalPendingAmount: 0,
        billCount: 0
      };

      return {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        userEmail: user.email,
        userPhone: user.phoneNumber || 'Not provided',
        totalSales: stats.totalSales,
        totalReceiveAmount: stats.totalReceiveAmount,
        totalPendingAmount: stats.totalPendingAmount,
        billCount: stats.billCount
      };
    }).sort((a, b) => b.totalSales - a.totalSales); // Sort by total sales descending

    // Get recent bills
    const recentBills = await Bill.find()
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalSales,
          totalBills,
          paidAmount,
          paidBills,
          pendingAmount,
          pendingBills,
          totalUsers,
          totalClients
        },
        userSales,
        recentBills
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query object
    let query = {};
    
    if (role && role.trim() !== '') {
      query.role = role;
    }
    
    if (isActive && isActive.trim() !== '') {
      query.isActive = isActive === 'true';
    }

    // Add search functionality for name, email, and phone
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i'); // Case-insensitive search
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        // Also search for full name combination
        { $expr: { 
          $regexMatch: { 
            input: { $concat: ['$firstName', ' ', '$lastName'] }, 
            regex: search.trim(), 
            options: 'i' 
          } 
        }}
      ];
    }
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    // Calculate statistics for each user
    const userStats = await Promise.all(
      users.map(async (user) => {
        try {
          // Get actual statistics for each user
          const clientCount = await Client.countDocuments({ createdBy: user._id });
          const billCount = await Bill.countDocuments({ createdBy: user._id });
          
          // Get total sales for this user
          const salesAggregation = await Bill.aggregate([
            { $match: { createdBy: user._id } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]);
          
          const totalSales = salesAggregation[0]?.total || 0;

          // Get paid amount (totalReceiveAmount)
          const paidAggregation = await Bill.aggregate([
            { $match: { createdBy: user._id, status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]);
          
          const totalReceiveAmount = paidAggregation[0]?.total || 0;

          // Get pending amount (totalPendingAmount)
          const pendingAggregation = await Bill.aggregate([
            { $match: { createdBy: user._id, status: { $in: ['Sent', 'Draft'] } } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
          ]);
          
          const totalPendingAmount = pendingAggregation[0]?.total || 0;

          // Get current active salary
          const Salary = require('../models/Salary');
          const currentSalary = await Salary.findOne({ 
            userId: user._id, 
            status: 'Active' 
          }).sort({ effectiveDate: -1 });
          
          return {
            ...user.toObject(),
            stats: {
              clientCount,
              billCount,
              totalSales,
              totalReceiveAmount,
              totalPendingAmount
            },
            currentSalary: currentSalary ? {
              basicSalary: currentSalary.basicSalary,
              netSalary: currentSalary.netSalary,
              effectiveDate: currentSalary.effectiveDate
            } : null
          };
        } catch (statsError) {
          console.error(`Error calculating stats for user ${user.email}:`, statsError);
          return {
            ...user.toObject(),
            stats: {
              clientCount: 0,
              billCount: 0,
              totalSales: 0,
              totalReceiveAmount: 0,
              totalPendingAmount: 0
            },
            currentSalary: null
          };
        }
      })
    );
    
    const responseData = {
      users: userStats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    };
    
    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error in admin users endpoint:', error);
    next(error);
  }
});

// Update user role
router.put('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!['User', 'Admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid role. Must be User or Admin' }
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update user details
router.put('/users/:id', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role, isActive } = req.body;
    
    console.log(`Admin updating user ${req.params.id}:`, {
      firstName: !!firstName,
      lastName: !!lastName,
      email: !!email,
      phoneNumber: !!phoneNumber,
      password: !!password,
      role: !!role,
      isActive
    });
    
    // Validate role if provided
    if (role && !['User', 'Admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid role. Must be User or Admin' }
      });
    }

    // Check for duplicate email (if email is being updated)
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: { message: 'User with this email already exists' }
        });
      }
    }

    // Check for duplicate phone number (if phone number is being updated)
    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber, _id: { $ne: req.params.id } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          error: { message: 'User with this phone number already exists' }
        });
      }
    }

    // Find the user first
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    console.log(`Found user: ${user.email}`);

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (password) {
      console.log('Updating password for user:', user.email);
      user.password = password; // This will trigger the pre-save hook to hash the password
    }
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    // Save the user (this will trigger pre-save hooks including password hashing)
    await user.save();
    console.log('User saved successfully');
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error updating user:', error);
    next(error);
  }
});

// Toggle user active status
router.put('/users/:id/status', async (req, res, next) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: { message: 'isActive must be a boolean value' }
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Create new user
router.post('/users', async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role = 'User', isActive = true } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'First name, last name, email, and password are required' }
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: { message: 'User with this email already exists' }
      });
    }

    // Check if phone number already exists (if provided)
    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          error: { message: 'User with this phone number already exists' }
        });
      }
    }
    
    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password, // Will be hashed by the User model pre-save hook
      role,
      isActive
    });
    
    await user.save();
    
    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    next(error);
  }
});

// Get all clients (admin view)
router.get('/clients', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, userId } = req.query;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (userId) {
      query.createdBy = userId;
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

// Get sales reports
router.get('/reports', async (req, res, next) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let matchQuery = {};
    
    // Date range filter
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        matchQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.createdAt.$lte = new Date(endDate);
      }
    }
    
    // User filter
    if (userId) {
      matchQuery.createdBy = userId;
    }
    
    // Monthly sales report
    const monthlySales = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          billCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);
    
    // Status-wise bill count
    const statusReport = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    // Top clients by sales
    const topClients = await Bill.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$client',
          totalSales: { $sum: '$totalAmount' },
          billCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: '_id',
          foreignField: '_id',
          as: 'client'
        }
      },
      {
        $unwind: '$client'
      },
      {
        $project: {
          clientName: '$client.clientName',
          totalSales: 1,
          billCount: 1
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    res.json({
      success: true,
      data: {
        monthlySales,
        statusReport,
        topClients
      }
    });
  } catch (error) {
    next(error);
  }
});

// Check email availability
router.get('/users/check-email/:email', async (req, res, next) => {
  try {
    const { email } = req.params;
    const { userId } = req.query; // Optional: exclude current user when editing
    
    let query = { email };
    if (userId) {
      query._id = { $ne: userId };
    }
    
    const existingUser = await User.findOne(query);
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        message: existingUser ? 'Email is already registered' : 'Email is available'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Check phone number availability
router.get('/users/check-phone/:phone', async (req, res, next) => {
  try {
    const { phone } = req.params;
    const { userId } = req.query; // Optional: exclude current user when editing
    
    let query = { phoneNumber: phone };
    if (userId) {
      query._id = { $ne: userId };
    }
    
    const existingUser = await User.findOne(query);
    
    res.json({
      success: true,
      data: {
        available: !existingUser,
        message: existingUser ? 'Phone number is already registered' : 'Phone number is available'
      }
    });
  } catch (error) {
    next(error);
  }
});

// Test endpoint to manually test password update flow
router.post('/test-password-update/:id', async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    
    console.log('=== MANUAL PASSWORD UPDATE TEST ===');
    console.log('User ID:', req.params.id);
    console.log('New Password:', newPassword);
    
    // Find user
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    console.log('Found user:', user.email);
    console.log('Current password hash:', user.password.substring(0, 20) + '...');
    
    // Update password
    user.password = newPassword;
    console.log('Set new password on user object');
    
    // Save user
    await user.save();
    console.log('User saved successfully');
    
    // Test the new password
    const testResult = await user.comparePassword(newPassword);
    console.log('Password test result:', testResult);
    
    res.json({
      success: true,
      data: {
        message: 'Password updated and tested',
        email: user.email,
        passwordTest: testResult,
        newHashPreview: user.password.substring(0, 20) + '...'
      }
    });
    
  } catch (error) {
    console.error('Manual password update test error:', error);
    next(error);
  }
});

// Test endpoint to check user password hash (for debugging)
router.get('/users/:id/debug-password', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: {
        email: user.email,
        passwordHash: user.password,
        passwordLength: user.password.length,
        isHashed: user.password.startsWith('$2b$') || user.password.startsWith('$2a$'),
        lastModified: user.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// Test endpoint to verify password comparison
router.post('/users/:id/test-password', async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    const isMatch = await user.comparePassword(password);
    
    res.json({
      success: true,
      data: {
        email: user.email,
        passwordProvided: password,
        passwordMatch: isMatch,
        storedHash: user.password.substring(0, 20) + '...',
        isHashed: user.password.startsWith('$2b$') || user.password.startsWith('$2a$')
      }
    });
  } catch (error) {
    next(error);
  }
});

// Simple test endpoint for password functionality
router.post('/test-password-simple', async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log('=== SIMPLE PASSWORD TEST ===');
    console.log('Email:', email);
    console.log('New Password:', newPassword);
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }
    
    console.log('Found user:', user.email);
    console.log('Current password hash:', user.password);
    
    // Update password directly
    user.password = newPassword;
    console.log('Password set to:', newPassword);
    
    // Save user
    await user.save();
    console.log('User saved');
    
    // Fetch user again to verify
    const updatedUser = await User.findById(user._id).select('+password');
    console.log('Updated password hash:', updatedUser.password);
    
    // Test the password
    const testResult = await updatedUser.comparePassword(newPassword);
    console.log('Password test result:', testResult);
    
    res.json({
      success: true,
      data: {
        message: 'Password test completed',
        email: user.email,
        originalHash: user.password.substring(0, 20) + '...',
        newHash: updatedUser.password.substring(0, 20) + '...',
        passwordTest: testResult,
        hashChanged: user.password !== updatedUser.password
      }
    });
    
  } catch (error) {
    console.error('Simple password test error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message }
    });
  }
});

module.exports = router;