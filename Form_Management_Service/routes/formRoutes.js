const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const formVersionController = require('../controllers/formVersionController');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth, authorizeWorkspace } = require('../middleware/auth');
const { WORKSPACE_MUTATION_ROLES } = require('../utils/workspaceHelper');
const {
  formListQuerySchema,
  createFormSchema,
  updateFormSchema,
  formIdParamSchema,
  restoreVersionParamSchema
} = require('../validators/formSchemas');

router.get('/', authenticate, validate(formListQuerySchema, 'query'), formController.getAllForms);
router.get('/:id', optionalAuth, validate(formIdParamSchema, 'params'), formController.getFormByCustomId);

router.post('/', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), validate(createFormSchema), formController.createForm);
router.put('/:id', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), validate(formIdParamSchema, 'params'), validate(updateFormSchema), formController.updateForm);
router.delete('/:id', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), validate(formIdParamSchema, 'params'), formController.deleteForm);
router.post('/:id/duplicate', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), validate(formIdParamSchema, 'params'), formController.duplicateForm);
router.get('/:id/stats', authenticate, validate(formIdParamSchema, 'params'), formController.getFormStats);
router.get('/:id/export', authenticate, validate(formIdParamSchema, 'params'), formController.exportForm);
router.get('/:id/versions', authenticate, validate(formIdParamSchema, 'params'), formVersionController.getFormVersions);
router.get('/:id/versions/:versionNumber', authenticate, validate(restoreVersionParamSchema, 'params'), formVersionController.getFormVersionByNumber);
router.post('/:id/versions/:versionNumber/restore', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), validate(restoreVersionParamSchema, 'params'), formVersionController.restoreFormVersion);

module.exports = router;
