const express = require('express');
const router = express.Router();
const dynamicMappingsController = require('../controllers/dynamicMappingsController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes (read-only)
// GET /api/dynamic-mappings - Get all mappings
router.get('/', optionalAuth, dynamicMappingsController.getAllMappings);

// GET /api/dynamic-mappings/summary - Get all mappings (summary)
router.get('/summary', optionalAuth, dynamicMappingsController.getAllMappingsSummary);

// GET /api/dynamic-mappings/custom/:id - Get mapping by custom ID
router.get('/custom/:id', optionalAuth, dynamicMappingsController.getMappingByCustomId);

// GET /api/dynamic-mappings/parent/:parentField/child/:childField - Get mappings by parent-child relationship
router.get('/parent/:parentField/child/:childField', optionalAuth, dynamicMappingsController.getMappingsByParentChild);

// GET /api/dynamic-mappings/options/:parentOptionType/:childOptionType - Get mappings by option types
router.get('/options/:parentOptionType/:childOptionType', optionalAuth, dynamicMappingsController.getMappingsByOptionTypes);

// GET /api/dynamic-mappings/:id - Get mapping by MongoDB ID
router.get('/:id', optionalAuth, dynamicMappingsController.getMappingById);

// GET /api/dynamic-mappings/:mappingId/options/:parentValue - Get mapped options for a parent value
router.get('/:mappingId/options/:parentValue', optionalAuth, dynamicMappingsController.getMappedOptions);

// GET /api/dynamic-mappings/custom/:mappingId/options/:parentValue - Get mapped options by custom mapping ID
router.get('/custom/:mappingId/options/:parentValue', optionalAuth, dynamicMappingsController.getMappedOptionsByMappingId);

// POST /api/dynamic-mappings/:mappingId/apply - Apply mapping to data
router.post('/:mappingId/apply', optionalAuth, dynamicMappingsController.applyMapping);

// POST /api/dynamic-mappings/:mappingId/test - Test mapping with sample data
router.post('/:mappingId/test', optionalAuth, dynamicMappingsController.testMapping);

// Protected routes (require authentication)
// POST /api/dynamic-mappings - Create new mapping
router.post('/', authenticate, dynamicMappingsController.createMapping);

// PUT /api/dynamic-mappings/:id - Update mapping
router.put('/:id', authenticate, dynamicMappingsController.updateMapping);

// DELETE /api/dynamic-mappings/:id - Delete mapping
router.delete('/:id', authenticate, dynamicMappingsController.deleteMapping);

// POST /api/dynamic-mappings/bulk - Bulk create mappings
router.post('/bulk', authenticate, dynamicMappingsController.bulkCreateMappings);

module.exports = router; 