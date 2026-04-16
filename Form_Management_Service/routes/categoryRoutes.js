const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes (read-only)
// Category management routes
router.get('/categories', optionalAuth, categoryController.getCategories);

// Label mapping routes
router.get('/label-mappings', optionalAuth, categoryController.getLabelMappings);

// Protected routes (require authentication)
router.post('/categories', authenticate, categoryController.saveCategories);
router.post('/label-mappings', authenticate, categoryController.saveLabelMappings);

module.exports = router;
