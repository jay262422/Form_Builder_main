const Workspace = require('../models/Workspace');
const User = require('../models/User');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  conflictResponse
} = require('../utils/responseHelper');
const {
  WORKSPACE_ADMIN_ROLES,
  ensureUserWorkspace,
  generateInviteToken,
  updateUserWorkspaceContext
} = require('../utils/workspaceHelper');

const canManageWorkspace = (user) => WORKSPACE_ADMIN_ROLES.includes(user.workspaceRole || 'viewer');

const loadWorkspaceForUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;

  await ensureUserWorkspace(user);
  return Workspace.findById(user.workspaceId);
};

exports.getMyWorkspace = async (req, res) => {
  try {
    const workspace = await loadWorkspaceForUser(req.userId);
    if (!workspace) {
      return notFoundResponse(res, 'Workspace not found');
    }

    return successResponse(res, { workspace }, 'Workspace retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve workspace', 500);
  }
};

exports.updateMyWorkspace = async (req, res) => {
  try {
    if (!canManageWorkspace(req.user)) {
      return errorResponse(res, 'Only workspace admins can update workspace settings', 403, 'forbidden');
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return validationError(res, 'Workspace name is required');
    }

    const workspace = await loadWorkspaceForUser(req.userId);
    if (!workspace) {
      return notFoundResponse(res, 'Workspace not found');
    }

    workspace.name = name.trim();
    await workspace.save();

    return successResponse(res, { workspace }, 'Workspace updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update workspace', 500);
  }
};

exports.inviteMember = async (req, res) => {
  try {
    if (!canManageWorkspace(req.user)) {
      return errorResponse(res, 'Only workspace admins can invite members', 403, 'forbidden');
    }

    const { email, role = 'viewer' } = req.body;
    const normalizedEmail = email?.toLowerCase()?.trim();

    if (!normalizedEmail) {
      return validationError(res, 'Email is required');
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return validationError(res, 'Role must be one of admin, editor, or viewer');
    }

    const workspace = await loadWorkspaceForUser(req.userId);
    if (!workspace) {
      return notFoundResponse(res, 'Workspace not found');
    }

    const existingMember = workspace.members.find(member => member.email === normalizedEmail);
    if (existingMember) {
      return conflictResponse(res, 'This user is already in the workspace or already invited');
    }

    const inviteToken = generateInviteToken();
    workspace.members.push({
      userId: null,
      email: normalizedEmail,
      name: '',
      role,
      status: 'invited',
      inviteToken,
      invitedAt: new Date(),
      invitedBy: req.userId
    });

    await workspace.save();

    return successResponse(res, {
      invite: {
        email: normalizedEmail,
        role,
        inviteToken
      }
    }, 'Member invited successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to invite member', 500);
  }
};

exports.acceptInvitation = async (req, res) => {
  try {
    const { inviteToken } = req.body;
    if (!inviteToken) {
      return validationError(res, 'Invite token is required');
    }

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return notFoundResponse(res, 'User not found');
    }

    const workspace = await Workspace.findOne({ 'members.inviteToken': inviteToken });
    if (!workspace) {
      return notFoundResponse(res, 'Invitation not found or expired');
    }

    const memberIndex = workspace.members.findIndex(member => member.inviteToken === inviteToken);
    if (memberIndex === -1) {
      return notFoundResponse(res, 'Invitation not found or expired');
    }

    const invitation = workspace.members[memberIndex];
    if (invitation.email !== currentUser.email.toLowerCase()) {
      return errorResponse(res, 'Invitation email does not match your account', 403, 'forbidden');
    }

    workspace.members[memberIndex] = {
      ...workspace.members[memberIndex],
      userId: currentUser._id,
      name: currentUser.name,
      status: 'active',
      inviteToken: null,
      joinedAt: new Date()
    };

    await workspace.save();
    await updateUserWorkspaceContext(currentUser._id, workspace._id, invitation.role);

    return successResponse(res, { workspace }, 'Invitation accepted successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to accept invitation', 500);
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    if (!canManageWorkspace(req.user)) {
      return errorResponse(res, 'Only workspace admins can update member roles', 403, 'forbidden');
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return validationError(res, 'Role must be one of admin, editor, or viewer');
    }

    const workspace = await loadWorkspaceForUser(req.userId);
    if (!workspace) {
      return notFoundResponse(res, 'Workspace not found');
    }

    const member = workspace.members.find(m => m.userId && m.userId.toString() === userId);
    if (!member) {
      return notFoundResponse(res, 'Member not found');
    }

    if (member.role === 'owner') {
      return errorResponse(res, 'Cannot change owner role', 400, 'invalid_operation');
    }

    member.role = role;
    await workspace.save();
    await updateUserWorkspaceContext(userId, workspace._id, role);

    return successResponse(res, { workspace }, 'Member role updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update member role', 500);
  }
};

exports.removeMember = async (req, res) => {
  try {
    if (!canManageWorkspace(req.user)) {
      return errorResponse(res, 'Only workspace admins can remove members', 403, 'forbidden');
    }

    const { userId } = req.params;
    const workspace = await loadWorkspaceForUser(req.userId);
    if (!workspace) {
      return notFoundResponse(res, 'Workspace not found');
    }

    const member = workspace.members.find(m => m.userId && m.userId.toString() === userId);
    if (!member) {
      return notFoundResponse(res, 'Member not found');
    }

    if (member.role === 'owner') {
      return errorResponse(res, 'Cannot remove workspace owner', 400, 'invalid_operation');
    }

    workspace.members = workspace.members.filter(m => !(m.userId && m.userId.toString() === userId));
    await workspace.save();
    await updateUserWorkspaceContext(userId, null, 'viewer');

    return successResponse(res, { workspace }, 'Member removed successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to remove member', 500);
  }
};
