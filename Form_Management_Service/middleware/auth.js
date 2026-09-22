const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { appConfig } = require('../config/appConfig');
const {
  unauthorizedResponse,
  forbiddenResponse,
  errorResponse
} = require('../utils/responseHelper');
const { hasWorkspaceRole } = require('../utils/workspaceHelper');

const getJwtSecret = () => {
  if (!appConfig.jwt.secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return appConfig.jwt.secret;
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No token provided');
    }

    const token = authHeader.substring(7);
    if (!token) {
      return unauthorizedResponse(res, 'No token provided');
    }

    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return unauthorizedResponse(res, 'User not found');
      }

      if (!user.isActive) {
        return unauthorizedResponse(res, 'User account is inactive');
      }

      if (appConfig.requireEmailVerified && !user.isEmailVerified) {
        return forbiddenResponse(res, 'Email verification is required');
      }

      req.user = user;
      req.userId = user._id;
      return next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return unauthorizedResponse(res, 'Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        return unauthorizedResponse(res, 'Token expired');
      }
      throw error;
    }
  } catch (error) {
    return errorResponse(res, error.message || 'Authentication error', 500);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, getJwtSecret());
        const user = await User.findById(decoded.userId).select('-password');

        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    return next();
  } catch (error) {
    return next();
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }

  if (!roles.includes(req.user.role)) {
    return forbiddenResponse(res, 'Insufficient permissions');
  }

  return next();
};

const authorizeWorkspace = (...workspaceRoles) => (req, res, next) => {
  if (!req.user) {
    return unauthorizedResponse(res, 'Authentication required');
  }

  if (!hasWorkspaceRole(req.user, workspaceRoles)) {
    return forbiddenResponse(res, 'Insufficient workspace permissions');
  }

  return next();
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  authorizeWorkspace
};
