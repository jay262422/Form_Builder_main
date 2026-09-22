const mongoose = require('mongoose');

const workspaceMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['active', 'invited'],
    default: 'active'
  },
  inviteToken: {
    type: String,
    default: null
  },
  inviteExpiresAt: {
    type: Date,
    default: null
  },
  invitedAt: {
    type: Date,
    default: null
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { _id: false });

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  members: {
    type: [workspaceMemberSchema],
    default: []
  }
}, {
  timestamps: true
});

workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ 'members.email': 1 });
workspaceSchema.index({ 'members.userId': 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);
module.exports = Workspace;
