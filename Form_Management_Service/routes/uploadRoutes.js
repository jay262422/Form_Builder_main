const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { optionalAuth } = require('../middleware/auth');

router.post(
  '/form/:formId',
  optionalAuth,
  uploadController.uploadMiddleware,
  uploadController.uploadFile
);

module.exports = router;
