const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth, authorizeWorkspace } = require('../middleware/auth');
const { WORKSPACE_MUTATION_ROLES } = require('../utils/workspaceHelper');
const {
  submissionListQuerySchema,
  createSubmissionSchema,
  updateSubmissionSchema,
  submissionIdParamSchema,
  formIdParamSchema
} = require('../validators/submissionSchemas');

router.get('/form/:formId', authenticate, validate(formIdParamSchema, 'params'), validate(submissionListQuerySchema, 'query'), submissionController.getSubmissionsByForm);
router.get('/form/:formId/stats', authenticate, validate(formIdParamSchema, 'params'), submissionController.getSubmissionStats);
router.get('/form/:formId/export', authenticate, validate(formIdParamSchema, 'params'), submissionController.exportSubmissions);

router.get('/', authenticate, validate(submissionListQuerySchema, 'query'), submissionController.getAllSubmissions);
router.get('/:id', authenticate, validate(submissionIdParamSchema, 'params'), submissionController.getSubmissionById);
router.post('/', optionalAuth, validate(createSubmissionSchema), submissionController.createSubmission);
router.put('/:id', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), validate(submissionIdParamSchema, 'params'), validate(updateSubmissionSchema), submissionController.updateSubmission);
router.delete('/:id', authenticate, authorizeWorkspace(...WORKSPACE_MUTATION_ROLES), validate(submissionIdParamSchema, 'params'), submissionController.deleteSubmission);

module.exports = router;
