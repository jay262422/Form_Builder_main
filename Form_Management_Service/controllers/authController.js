const crypto = require('crypto');
const User = require('../models/User');
const { ensureUserWorkspace } = require('../utils/workspaceHelper');
const { logAuditEvent } = require('../utils/auditLogger');
const { issueTokenPair, rotateRefreshToken, revokeRefreshToken, hashToken } = require('../services/tokenService');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
} = require('../services/emailService');
const { appConfig } = require('../config/appConfig');
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

const buildAuthPayload = (user, tokens) => ({
  user: user.toPublicJSON(),
  token: tokens.accessToken,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  expiresIn: tokens.expiresIn
});

const getDevAuthExtras = (payload) => (
  appConfig.nodeEnv === 'development' ? payload : null
);

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return conflictResponse(res, 'User with this email already exists. Please login instead.');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = new User({
      email,
      password,
      name,
      emailVerificationToken: hashToken(verificationToken)
    });

    await user.save();
    await ensureUserWorkspace(user);

    await sendVerificationEmail({ to: email, name, token: verificationToken });
    await sendWelcomeEmail({ to: email, name });

    const tokens = await issueTokenPair(user);
    user.lastLogin = new Date();
    await user.save();

    await logAuditEvent(req, {
      action: 'USER_REGISTERED',
      entityType: 'user',
      entityId: user._id.toString(),
      metadata: { email }
    });

    return createdResponse(
      res,
      {
        ...buildAuthPayload(user, tokens),
        dev: getDevAuthExtras({
          verificationToken,
          verifyUrl: `${appConfig.frontendUrl}/verify-email?token=${verificationToken}`
        })
      },
      'User registered successfully'
    );
  } catch (error) {
    return errorResponse(res, error.message || 'Registration failed', 500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email).select('+password');

    if (!user) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    if (!user.isActive) {
      return unauthorizedResponse(res, 'Your account has been deactivated. Please contact support.');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Invalid email or password');
    }

    user.lastLogin = new Date();
    await ensureUserWorkspace(user);

    const tokens = await issueTokenPair(user);

    await logAuditEvent(req, {
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user._id.toString(),
      metadata: { email }
    });

    return successResponse(res, buildAuthPayload(user, tokens), 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message || 'Login failed', 500);
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const refreshTokenHash = hashToken(refreshToken);
    const user = await User.findOne({
      refreshTokens: {
        $elemMatch: {
          tokenHash: refreshTokenHash,
          expiresAt: { $gt: new Date() }
        }
      }
    });

    if (!user) {
      return unauthorizedResponse(res, 'Invalid or expired refresh token');
    }

    const tokens = await rotateRefreshToken(user, refreshToken);
    if (!tokens) {
      return unauthorizedResponse(res, 'Invalid or expired refresh token');
    }

    return successResponse(res, buildAuthPayload(user, tokens), 'Token refreshed successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to refresh token', 500);
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user) {
      await revokeRefreshToken(user, req.body.refreshToken);
    }

    return successResponse(res, null, 'Logged out successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Logout failed', 500);
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    await ensureUserWorkspace(user);

    return successResponse(res, { user: user.toPublicJSON() }, 'User retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to get user', 500);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, settings, profile } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

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

    return successResponse(res, { user: user.toPublicJSON() }, 'Profile updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update profile', 500);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return unauthorizedResponse(res, 'Current password is incorrect');
    }

    user.password = newPassword;
    user.refreshTokens = [];
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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return successResponse(res, null, 'If an account with that email exists, a password reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 3600000);
    await user.save();

    await sendPasswordResetEmail({ to: email, name: user.name, token: resetToken });

    return successResponse(
      res,
      getDevAuthExtras({
        resetToken,
        resetUrl: `${appConfig.frontendUrl}/reset-password?token=${resetToken}`
      }),
      'If an account with that email exists, a password reset link has been sent.'
    );
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to process password reset request', 500);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetExpires: { $gt: Date.now() },
      $or: [
        { passwordResetToken: tokenHash },
        { passwordResetToken: token }
      ]
    }).select('+password');

    if (!user) {
      return errorResponse(res, 'Password reset token is invalid or has expired', 400, 'invalid_token');
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.refreshTokens = [];
    await user.save();

    return successResponse(res, null, 'Password has been reset successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to reset password', 500);
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      $or: [
        { emailVerificationToken: tokenHash },
        { emailVerificationToken: token }
      ]
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

exports.resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'Email is already verified', 400, 'already_verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = hashToken(verificationToken);
    await user.save();

    await sendVerificationEmail({ to: user.email, name: user.name, token: verificationToken });

    return successResponse(
      res,
      getDevAuthExtras({
        verificationToken,
        verifyUrl: `${appConfig.frontendUrl}/verify-email?token=${verificationToken}`
      }),
      'Verification email sent. Please check your inbox.'
    );
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to resend verification email', 500);
  }
};
