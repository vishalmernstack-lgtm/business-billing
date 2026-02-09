const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  console.log('=== AUTH MIDDLEWARE DEBUG START ===');
  console.log('Request URL:', req.originalUrl);
  console.log('Request Method:', req.method);
  
  try {
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'No token');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        error: { message: 'Access denied. No token provided.' }
      });
    }

    console.log('Verifying JWT token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully. User ID:', decoded.id);
    
    console.log('Finding user in database...');
    const user = await User.findById(decoded.id).select('-password');
    console.log('User found:', user ? '✅ YES' : '❌ NO');
    
    if (user) {
      console.log('User details:');
      console.log('- ID:', user._id);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Active:', user.isActive);
    }
    
    if (!user || !user.isActive) {
      console.log('❌ Invalid token or user not active');
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid token or user not active.' }
      });
    }

    req.user = user;
    console.log('✅ Authentication successful');
    console.log('=== AUTH MIDDLEWARE DEBUG END ===');
    next();
  } catch (error) {
    console.log('❌ Authentication error:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.log('=== AUTH MIDDLEWARE DEBUG END (ERROR) ===');
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Token expired. Please login again.' }
      });
    }
    
    res.status(401).json({
      success: false,
      error: { message: 'Invalid token.' }
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required.' }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied. Insufficient permissions.' }
      });
    }

    next();
  };
};

const filterByUser = (req, res, next) => {
  console.log('=== FILTER BY USER MIDDLEWARE DEBUG START ===');
  console.log('User role:', req.user?.role);
  console.log('User ID:', req.user?._id);
  
  // Add user filter for non-admin users
  if (req.user.role !== 'Admin') {
    req.userFilter = { createdBy: req.user._id };
    console.log('Non-admin user - applying user filter:', JSON.stringify(req.userFilter, null, 2));
  } else {
    req.userFilter = {};
    console.log('Admin user - no user filter applied');
  }
  
  console.log('=== FILTER BY USER MIDDLEWARE DEBUG END ===');
  next();
};

module.exports = {
  authenticate,
  authorize,
  filterByUser
};