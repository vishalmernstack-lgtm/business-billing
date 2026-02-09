const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  generateTokens(userId) {
    const payload = { id: userId };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '15m'
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    });
    
    return { accessToken, refreshToken };
  }

  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }
      
      return user;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async register(userData) {
    const { email, password, firstName, lastName, role = 'User' } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
    
    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role
    });
    
    await user.save();
    
    // Generate tokens
    const tokens = this.generateTokens(user._id);
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  async login(email, password) {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid credentials - No account found with this email address');
    }
    
    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated - Please contact support to reactivate your account');
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials - Incorrect password provided');
    }
    
    // Generate tokens
    const tokens = this.generateTokens(user._id);
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  async refreshTokens(refreshToken) {
    const user = await this.verifyRefreshToken(refreshToken);
    const tokens = this.generateTokens(user._id);
    
    return {
      user: user.toJSON(),
      ...tokens
    };
  }

  async getUserProfile(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async updateUserProfile(userId, updateData) {
    const allowedUpdates = ['firstName', 'lastName'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = updateData[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async changePassword(userId, currentPassword, newPassword) {
    // Find user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();