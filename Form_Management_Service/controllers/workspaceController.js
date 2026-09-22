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
const { logAuditEvent } = require('../utils/auditLogger');
const { hashToken } = require('../services/tokenService');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const canManageWorkspace = (user) => WORKSPACE_ADMIN_ROLES.includes(user.workspaceRole || 'viewer');

const isWorkspaceOwner = (user) => user?.workspaceRole === 'owner';

const toPublicWorkspace = (workspace) => {
  const plain = typeof workspace.toObject === 'function' ? workspace.toObject() : { ...workspace };
  plain.members = (plain.members || []).map((member) => {
    const nextMember = { ...member };
    delete nextMember.inviteToken;
    return nextMember;
  });
  return plain;
};

const inviteIsExpired = (invitation) => {
  if (invitation.inviteExpiresAt) {
    return new Date(invitation.inviteExpiresAt).getTime() <= Date.now();
  }
  if (!invitation.invitedAt) return true;
  return new Date(invitation.invitedAt).getTime() + INVITE_TTL_MS <= Date.now();
};

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

    return successResponse(res, { workspace: toPublicWorkspace(workspace) }, 'Workspace retrieved successfully');
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

    await logAuditEvent(req, {
      action: 'WORKSPACE_UPDATED',
      entityType: 'workspace',
      entityId: workspace._id.toString(),
      metadata: {
        workspaceName: workspace.name
      }
    });

    return successResponse(res, { workspace: toPublicWorkspace(workspace) }, 'Workspace updated successfully');
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

    if (role === 'admin' && !isWorkspaceOwner(req.user)) {
      return errorResponse(res, 'Only the workspace owner can invite admins', 403, 'forbidden');
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
    const inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    workspace.members.push({
      userId: null,
      email: normalizedEmail,
      name: '',
      role,
      status: 'invited',
      inviteToken: hashToken(inviteToken),
      inviteExpiresAt,
      invitedAt: new Date(),
      invitedBy: req.userId
    });

    await workspace.save();

    await logAuditEvent(req, {
      action: 'WORKSPACE_MEMBER_INVITED',
      entityType: 'workspace_member',
      entityId: normalizedEmail,
      metadata: {
        workspaceId: workspace._id.toString(),
        invitedEmail: normalizedEmail,
        invitedRole: role
      }
    });

    return successResponse(res, {
      invite: {
        email: normalizedEmail,
        role,
        inviteToken,
        expiresAt: inviteExpiresAt
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

    const tokenHash = hashToken(inviteToken);
    const workspace = await Workspace.findOne({
      $or: [
        { 'members.inviteToken': tokenHash },
        { 'members.inviteToken': inviteToken }
      ]
    });
    if (!workspace) {
      return notFoundResponse(res, 'Invitation not found or expired');
    }

    const memberIndex = workspace.members.findIndex(
      (member) => member.inviteToken === tokenHash || member.inviteToken === inviteToken
    );
    if (memberIndex === -1) {
      return notFoundResponse(res, 'Invitation not found or expired');
    }

    const invitation = workspace.members[memberIndex];
    if (invitation.status !== 'invited') {
      return notFoundResponse(res, 'Invitation not found or expired');
    }

    if (inviteIsExpired(invitation)) {
      return errorResponse(res, 'Invitation has expired', 400, 'invalid_token');
    }

    if (invitation.email !== currentUser.email.toLowerCase()) {
      return errorResponse(res, 'Invitation email does not match your account', 403, 'forbidden');
    }

    if (
      currentUser.workspaceId &&
      currentUser.workspaceId.toString() !== workspace._id.toString() &&
      !currentUser.homeWorkspaceId
    ) {
      currentUser.homeWorkspaceId = currentUser.workspaceId;
      await currentUser.save();
    }

    invitation.userId = currentUser._id;
    invitation.name = currentUser.name;
    invitation.status = 'active';
    invitation.inviteToken = null;
    invitation.inviteExpiresAt = null;
    invitation.joinedAt = new Date();

    await workspace.save();
    await updateUserWorkspaceContext(currentUser._id, workspace._id, invitation.role);

    await logAuditEvent(req, {
      action: 'WORKSPACE_INVITATION_ACCEPTED',
      entityType: 'workspace_member',
      entityId: currentUser._id.toString(),
      metadata: {
        workspaceId: workspace._id.toString(),
        memberEmail: currentUser.email,
        role: invitation.role
      }
    });

    return successResponse(res, { workspace: toPublicWorkspace(workspace) }, 'Invitation accepted successfully');
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

    if ((member.role === 'admin' || role === 'admin') && !isWorkspaceOwner(req.user)) {
      return errorResponse(res, 'Only the workspace owner can change admin roles', 403, 'forbidden');
    }

    const previousRole = member.role;
    member.role = role;
    await workspace.save();
    await updateUserWorkspaceContext(userId, workspace._id, role);

    await logAuditEvent(req, {
      action: 'WORKSPACE_MEMBER_ROLE_UPDATED',
      entityType: 'workspace_member',
      entityId: userId,
      metadata: {
        workspaceId: workspace._id.toString(),
        previousRole,
        newRole: role
      }
    });

    return successResponse(res, { workspace: toPublicWorkspace(workspace) }, 'Member role updated successfully');
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

    if (member.role === 'admin' && !isWorkspaceOwner(req.user)) {
      return errorResponse(res, 'Only the workspace owner can remove an admin', 403, 'forbidden');
    }

    const removedMember = {
      userId: member.userId?.toString() || '',
      email: member.email,
      role: member.role
    };

    workspace.members = workspace.members.filter(m => !(m.userId && m.userId.toString() === userId));
    await workspace.save();

    const removedUser = await User.findById(userId);
    let restoreWorkspaceId = null;
    let restoreRole = 'viewer';
    if (
      removedUser?.homeWorkspaceId &&
      removedUser.homeWorkspaceId.toString() !== workspace._id.toString()
    ) {
      const homeWorkspace = await Workspace.findById(removedUser.homeWorkspaceId);
      const homeMember = homeWorkspace?.members?.find(
        (home) => home.userId && home.userId.toString() === userId && home.status === 'active'
      );
      if (homeWorkspace && homeMember) {
        restoreWorkspaceId = homeWorkspace._id;
        restoreRole = homeMember.role;
      }
    }
    await updateUserWorkspaceContext(userId, restoreWorkspaceId, restoreRole);

    await logAuditEvent(req, {
      action: 'WORKSPACE_MEMBER_REMOVED',
      entityType: 'workspace_member',
      entityId: userId,
      metadata: {
        workspaceId: workspace._id.toString(),
        removedMember
      }
    });

    return successResponse(res, { workspace: toPublicWorkspace(workspace) }, 'Member removed successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to remove member', 500);
  }
};

exports.revokeInvitation = async (req, res) => {
  try {
    if (!canManageWorkspace(req.user)) {
      return errorResponse(res, 'Only workspace admins can revoke invitations', 403, 'forbidden');
    }

    const email = String(req.params.email || '').toLowerCase().trim();
    if (!email) {
      return validationError(res, 'Email is required');
    }

    const workspace = await loadWorkspaceForUser(req.userId);
    if (!workspace) {
      return notFoundResponse(res, 'Workspace not found');
    }

    const invitation = workspace.members.find((member) => member.email === email && member.status === 'invited');
    if (!invitation) {
      return notFoundResponse(res, 'Invitation not found');
    }

    if (invitation.role === 'admin' && !isWorkspaceOwner(req.user)) {
      return errorResponse(res, 'Only the workspace owner can revoke an admin invitation', 403, 'forbidden');
    }

    workspace.members = workspace.members.filter(
      (member) => !(member.email === email && member.status === 'invited')
    );
    await workspace.save();

    await logAuditEvent(req, {
      action: 'WORKSPACE_INVITATION_REVOKED',
      entityType: 'workspace_member',
      entityId: email,
      metadata: {
        workspaceId: workspace._id.toString(),
        invitedEmail: email
      }
    });

    return successResponse(res, { workspace: toPublicWorkspace(workspace) }, 'Invitation revoked');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to revoke invitation', 500);
  }
};
