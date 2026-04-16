const express = require('express');
const router = express.Router();
const fieldOptionsController = require('../controllers/fieldOptionsController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes (read-only)
// GET /api/field-options - Get all field option types
router.get('/', optionalAuth, fieldOptionsController.getAllFieldOptionTypes);

// GET /api/field-options/types - Get all option types (summary)
router.get('/types', optionalAuth, fieldOptionsController.getOptionTypes);

// GET /api/field-options/type/:optionType - Get options by type
router.get('/type/:optionType', optionalAuth, fieldOptionsController.getOptionsByType);

// POST /api/field-options/schema - Get options for form schema
router.post('/schema', optionalAuth, fieldOptionsController.getOptionsForSchema);

// Protected routes (require authentication)
// POST /api/field-options - Create new field option type
router.post('/', authenticate, fieldOptionsController.createFieldOptionType);

// PUT /api/field-options/:id - Update field option type
router.put('/:id', authenticate, fieldOptionsController.updateFieldOptionType);

// DELETE /api/field-options/:id - Delete field option type
router.delete('/:id', authenticate, fieldOptionsController.deleteFieldOptionType);

// POST /api/field-options/:id/options - Add option to existing type
router.post('/:id/options', authenticate, fieldOptionsController.addOption);

// PUT /api/field-options/:id/options/:optionValue - Update specific option
router.put('/:id/options/:optionValue', authenticate, fieldOptionsController.updateOption);

// DELETE /api/field-options/:id/options/:optionValue - Remove option from type
router.delete('/:id/options/:optionValue', authenticate, fieldOptionsController.removeOption);

// POST /api/field-options/bulk - Bulk create field option types
router.post('/bulk', authenticate, fieldOptionsController.bulkCreateFieldOptionTypes);

// POST /api/field-options/import - Import options from JSON
router.post('/import', authenticate, fieldOptionsController.importOptions);

module.exports = router; 