const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

const WORKSPACE_MUTATION_ROLES = ['owner', 'admin', 'editor'];
const WORKSPACE_ADMIN_ROLES = ['owner', 'admin'];

const generateWorkspaceName = (name, email) => {
  if (name && name.trim()) {
    return `${name.trim()}'s Workspace`;
  }
  if (email) {
    const localPart = email.split('@')[0];
    return `${localPart}'s Workspace`;
  }
  return 'My Workspace';
};

const ensureUserWorkspace = async (user) => {
  if (!user) {
    throw new Error('User is required');
  }

  if (user.workspaceId) {
    const existingWorkspace = await Workspace.findById(user.workspaceId);
    if (existingWorkspace) {
      return existingWorkspace;
    }
  }

  const workspace = new Workspace({
    name: generateWorkspaceName(user.name, user.email),
    ownerId: user._id,
    members: [
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: 'owner',
        status: 'active',
        joinedAt: new Date()
      }
    ]
  });

  await workspace.save();

  user.workspaceId = workspace._id;
  user.workspaceRole = 'owner';
  await user.save();

  return workspace;
};

const buildScopedFormQuery = (req, baseQuery = {}) => {
  const query = { ...baseQuery };

  if (req.user?.workspaceId) {
    query.$or = [
      { workspaceId: req.user.workspaceId },
      { workspaceId: null, userId: req.userId }
    ];
  } else if (req.userId) {
    query.userId = req.userId;
  }

  return query;
};

const hasWorkspaceRole = (user, allowedRoles = []) => {
  if (!user) return false;
  if (!allowedRoles.length) return true;
  return allowedRoles.includes(user.workspaceRole || 'viewer');
};

const sameId = (left, right) => Boolean(left) && Boolean(right) && left.toString() === right.toString();

const userCanAccessForm = (form, user) => {
  if (!form || !user) return false;

  const userId = user._id || user.id || user.userId;
  if (form.workspaceId) {
    return sameId(form.workspaceId, user.workspaceId);
  }

  return sameId(form.userId, userId);
};

const generateInviteToken = () => crypto.randomBytes(24).toString('hex');

const updateUserWorkspaceContext = async (userId, workspaceId, workspaceRole) => {
  await User.findByIdAndUpdate(userId, {
    $set: {
      workspaceId,
      workspaceRole
    }
  });
};

module.exports = {
  WORKSPACE_MUTATION_ROLES,
  WORKSPACE_ADMIN_ROLES,
  ensureUserWorkspace,
  buildScopedFormQuery,
  hasWorkspaceRole,
  userCanAccessForm,
  generateInviteToken,
  updateUserWorkspaceContext
};
