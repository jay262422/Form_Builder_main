const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ensureUserWorkspace } = require('../utils/workspaceHelper');
const { logAuditEvent } = require('../utils/auditLogger');
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

// Generate JWT token
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return validationError(res, 'Email, password, and name are required');
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return conflictResponse(res, 'User with this email already exists. Please login instead.');
    }

    // Generate email verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = new User({
      email,
      password,
      name,
      emailVerificationToken: verificationToken
    });

    await user.save();
    await ensureUserWorkspace(user);

    // TODO: Send verification email
    // For now, log the token (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== EMAIL VERIFICATION TOKEN (DEV ONLY) ===');
      console.log(`Email: ${email}`);
      console.log(`Verification Token: ${verificationToken}`);
      console.log(`Verification Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);
      console.log('===========================================');
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    return createdResponse(res, {
      user: user.toPublicJSON(),
      token
    }, 'User registered successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Registration failed', 500);
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return validationError(res, 'Email and password are required');
    }

    // Find user with password
    const user = await User.findByEmail(email).select('+password');
    
    if (!user) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      return unauthorizedResponse(res, 'Your account has been deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await ensureUserWorkspace(user);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return successResponse(res, {
      user: user.toPublicJSON(),
      token
    }, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message || 'Login failed', 500);
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    await ensureUserWorkspace(user);

    return successResponse(res, {
      user: user.toPublicJSON()
    }, 'User retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to get user', 500);
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, settings, profile } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Update fields
    if (name) user.name = name;
    if (settings) user.settings = { ...user.settings, ...settings };
    if (profile) user.profile = { ...user.profile, ...profile };

    await user.save();

    await logAuditEvent(req, {
      action: 'USER_PROFILE_UPDATED',
      entityType: 'user',
      entityId: user._id.toString(),
      metadata: {
        updatedFields: [
          ...(name ? ['name'] : []),
          ...(settings ? ['settings'] : []),
          ...(profile ? ['profile'] : [])
        ]
      }
    });

    return successResponse(res, {
      user: user.toPublicJSON()
    }, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update profile', 500);
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return validationError(res, 'Current password and new password are required');
    }

    if (newPassword.length < 6) {
      return validationError(res, 'New password must be at least 6 characters');
    }

    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    await logAuditEvent(req, {
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'user',
      entityId: user._id.toString(),
      metadata: {}
    });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to change password', 500);
  }
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return validationError(res, 'Email is required');
    }

    const user = await User.findByEmail(email);

    // Don't reveal if user exists (security best practice)
    if (!user) {
      return successResponse(res, null, 'If an account with that email exists, a password reset link has been sent.');
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(resetTokenExpiry);
    await user.save();

    // TODO: Send email with reset link
    // For now, log the token (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== PASSWORD RESET TOKEN (DEV ONLY) ===');
      console.log(`Email: ${email}`);
      console.log(`Reset Token: ${resetToken}`);
      console.log(`Reset Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
      console.log('========================================');
    }

    const responseData = process.env.NODE_ENV === 'development' ? {
      devToken: resetToken,
      devLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    } : null;

    return successResponse(res, responseData, 'If an account with that email exists, a password reset link has been sent.');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to process password reset request', 500);
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return validationError(res, 'Token and new password are required');
    }

    if (newPassword.length < 6) {
      return validationError(res, 'Password must be at least 6 characters');
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return errorResponse(res, 'Password reset token is invalid or has expired', 400, 'invalid_token');
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return successResponse(res, null, 'Password has been reset successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to reset password', 500);
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return validationError(res, 'Verification token is required');
    }

    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return errorResponse(res, 'Email verification token is invalid', 400, 'invalid_token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await user.save();

    return successResponse(res, null, 'Email verified successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to verify email', 500);
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'Email is already verified', 400, 'already_verified');
    }

    // Generate new verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    user.emailVerificationToken = verificationToken;
    await user.save();

    // TODO: Send verification email
    // For now, log the token (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== EMAIL VERIFICATION TOKEN (DEV ONLY) ===');
      console.log(`Email: ${user.email}`);
      console.log(`Verification Token: ${verificationToken}`);
      console.log(`Verification Link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`);
      console.log('===========================================');
    }

    const responseData = process.env.NODE_ENV === 'development' ? {
      devToken: verificationToken,
      devLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`
    } : null;

    return successResponse(res, responseData, 'Verification email sent. Please check your inbox.');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to resend verification email', 500);
  }
};
