const express = require('express');
const Joi = require('joi');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('User', 'Admin').default('User')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const result = await authService.register(value);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { 
          message: error.details[0].message,
          field: error.details[0].path[0],
          type: 'validation'
        }
      });
    }

    const { email, password } = value;
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.includes('Invalid credentials') || 
        error.message.includes('Account is deactivated')) {
      return res.status(401).json({
        success: false,
        error: { 
          message: error.message,
          type: 'authentication'
        }
      });
    }
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: { message: 'Refresh token is required' }
      });
    }

    const result = await authService.refreshTokens(refreshToken);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error.message.includes('Invalid refresh token')) {
      return res.status(401).json({
        success: false,
        error: { message: error.message }
      });
    }
    next(error);
  }
});

// Get profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const updateSchema = Joi.object({
      firstName: Joi.string().min(2).max(50),
      lastName: Joi.string().min(2).max(50)
    });

    const { error, value } = updateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const user = await authService.updateUserProfile(req.user._id, value);
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/profile/password', authenticate, async (req, res, next) => {
  try {
    const passwordSchema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(6).required(),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
        .messages({ 'any.only': 'Passwords do not match' })
    });

    const { error, value } = passwordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: { message: error.details[0].message }
      });
    }

    const { currentPassword, newPassword } = value;
    await authService.changePassword(req.user._id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    if (error.message.includes('Current password is incorrect')) {
      return res.status(400).json({
        success: false,
        error: { message: error.message }
      });
    }
    next(error);
  }
});

module.exports = router;