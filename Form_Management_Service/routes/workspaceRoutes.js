const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, workspaceController.getMyWorkspace);
router.put('/me', authenticate, workspaceController.updateMyWorkspace);
router.post('/me/invite', authenticate, workspaceController.inviteMember);
router.post('/invitations/accept', authenticate, workspaceController.acceptInvitation);
router.patch('/me/members/:userId/role', authenticate, workspaceController.updateMemberRole);
router.delete('/me/members/:userId', authenticate, workspaceController.removeMember);

module.exports = router;
