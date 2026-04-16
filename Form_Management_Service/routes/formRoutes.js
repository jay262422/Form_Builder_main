const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const formVersionController = require('../controllers/formVersionController');
const { authenticate, optionalAuth, authorizeWorkspace } = require('../middleware/auth');
const { WORKSPACE_MUTATION_ROLES } = require('../utils/workspaceHelper');

// Public routes (with optional auth for filtering)
router.get('/', optionalAuth, formController.getAllForms);
router.get('/:id', optionalAuth, formController.getFormByCustomId);

// Protected mutations and management routes
router.post('/', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), formController.createForm);
router.put('/:id', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), formController.updateForm);
router.delete('/:id', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), formController.deleteForm);
router.post('/:id/duplicate', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), formController.duplicateForm);
router.get('/:id/stats', authenticate, formController.getFormStats);
router.get('/:id/export', authenticate, formController.exportForm);
router.get('/:id/versions', authenticate, formVersionController.getFormVersions);
router.get('/:id/versions/:versionNumber', authenticate, formVersionController.getFormVersionByNumber);
router.post('/:id/versions/:versionNumber/restore', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), formVersionController.restoreFormVersion);

module.exports = router;
