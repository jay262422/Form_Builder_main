const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes (submissions can be created without auth for public forms)
// GET /api/submissions - Get all submissions (authenticated users only)
router.get('/', authenticate, submissionController.getAllSubmissions);

// GET /api/submissions/:id - Get submission by ID (authenticated users only)
router.get('/:id', authenticate, submissionController.getSubmissionById);

// POST /api/submissions - Create new submission (public, but sets userId if authenticated)
router.post('/', optionalAuth, submissionController.createSubmission);

// Protected routes (require authentication)
// PUT /api/submissions/:id - Update submission (only user's submissions)
router.put('/:id', authenticate, submissionController.updateSubmission);

// DELETE /api/submissions/:id - Delete submission (only user's submissions)
router.delete('/:id', authenticate, submissionController.deleteSubmission);

// GET /api/submissions/form/:formId - Get submissions by form (user's forms only)
router.get('/form/:formId', authenticate, submissionController.getSubmissionsByForm);

// GET /api/submissions/form/:formId/stats - Get submission statistics (user's forms only)
router.get('/form/:formId/stats', authenticate, submissionController.getSubmissionStats);

// GET /api/submissions/form/:formId/export - Export submissions (user's forms only)
router.get('/form/:formId/export', authenticate, submissionController.exportSubmissions);

module.exports = router; 
