const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, optionalAuth, authorizeWorkspace } = require('../middleware/auth');
const { WORKSPACE_ADMIN_ROLES } = require('../utils/workspaceHelper');

// Public routes (read-only)
// Category management routes
router.get('/categories', optionalAuth, categoryController.getCategories);

// Label mapping routes
router.get('/label-mappings', optionalAuth, categoryController.getLabelMappings);

// Protected routes (require authentication)
router.post(
  '/categories',
  authenticate,
  authorizeWorkspace(...WORKSPACE_ADMIN_ROLES),
  categoryController.saveCategories
);
router.post(
  '/label-mappings',
  authenticate,
  authorizeWorkspace(...WORKSPACE_ADMIN_ROLES),
  categoryController.saveLabelMappings
);

module.exports = router;
