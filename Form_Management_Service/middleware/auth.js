const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { hasWorkspaceRole } = require('../utils/workspaceHelper');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
};

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'No token provided' 
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, getJwtSecret());
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User not found' 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'User account is inactive' 
        });
      }

      // Attach user to request
      req.user = user;
      req.userId = user._id;
      
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Invalid token' 
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Token expired' 
        });
      }
      throw error;
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Authentication error',
      message: error.message 
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token exists, but doesn't require it
 */
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
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

/**
 * Workspace role authorization middleware
 */
const authorizeWorkspace = (...workspaceRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!hasWorkspaceRole(req.user, workspaceRoles)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient workspace permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  authorizeWorkspace
};
