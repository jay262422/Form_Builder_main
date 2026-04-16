const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate, authorizeWorkspace } = require('../middleware/auth');
const { WORKSPACE_ADMIN_ROLES } = require('../utils/workspaceHelper');

router.get(
  '/me',
  authenticate,
  authorizeWorkspace(...WORKSPACE_ADMIN_ROLES),
  auditLogController.getMyWorkspaceAuditLogs
);

module.exports = router;
