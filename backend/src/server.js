const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const billRoutes = require('./routes/bills');
const ocrRoutes = require('./routes/ocr');
const adminRoutes = require('./routes/admin');
const salaryRoutes = require('./routes/salaries');
const expenseRoutes = require('./routes/expenses');
const companySettingsRoutes = require('./routes/companySettings');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting - More lenient for development and production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development if needed
  skip: (req) => process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true',
});

// Only apply general rate limiter to API routes
app.use('/api', limiter);

// Auth rate limiting - More lenient and smarter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 auth attempts per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Skip rate limiting in development if needed
  skip: (req) => process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true',
});

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5173'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - serve from uploads directory in backend folder
const uploadsPath = path.join(__dirname, '../uploads');
console.log('📁 Serving static files from:', uploadsPath);

// Add CORS headers for static files
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use('/uploads', express.static(uploadsPath));

// Add a test route to verify file serving
app.get('/test-upload/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(uploadsPath, folder, filename);
  console.log('🔍 Testing file access:', filePath);
  
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    console.log('✅ File exists');
    res.sendFile(filePath);
  } else {
    console.log('❌ File not found');
    res.status(404).json({ error: 'File not found', path: filePath });
  }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/items', require('./routes/items'));
app.use('/api/salaries', salaryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/company-settings', companySettingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/business-billing';
    
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log('✅ Connected to MongoDB successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('📝 To fix this issue:');
    console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.log('   2. Start MongoDB service');
    console.log('   3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
    console.log('   4. Update MONGODB_URI in your .env file');
    console.log('');
    console.log('🚀 Server will continue running without database...');
    return false;
  }
};

const startServer = () => {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('🚀 Server running on port', PORT);
    console.log('🌐 Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');
    console.log('📊 Health check:', `http://localhost:${PORT}/api/health`);
    console.log('');
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️  Database not connected - some features may not work');
      console.log('   Please set up MongoDB to enable full functionality');
    }
  });
};

// Initialize database connection and start server
connectDB().then(() => {
  startServer();
}).catch(() => {
  startServer();
});

// Handle MongoDB connection events
mongoose.connection.on('connected', async () => {
  console.log('✅ Mongoose connected to MongoDB');
  
  // Clean up old problematic indexes
  try {
    const Salary = require('./models/Salary');
    const collection = mongoose.connection.db.collection('salaries');
    
    // Try to drop the problematic index if it exists
    try {
      await collection.dropIndex('userId_1_month_1');
      console.log('✅ Dropped old problematic salary index');
    } catch (error) {
      // Index might not exist, which is fine
      if (!error.message.includes('index not found')) {
        console.log('ℹ️  Old salary index not found (this is normal)');
      }
    }
  } catch (error) {
    console.log('ℹ️  Index cleanup completed');
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
  process.exit(0);
});

module.exports = app;