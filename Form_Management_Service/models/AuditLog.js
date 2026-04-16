const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  userName: {
    type: String,
    default: 'system'
  },
  userEmail: {
    type: String,
    default: ''
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  entityType: {
    type: String,
    required: true,
    trim: true
  },
  entityId: {
    type: String,
    default: ''
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

auditLogSchema.index({ workspaceId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
