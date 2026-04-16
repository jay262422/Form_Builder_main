const AuditLog = require('../models/AuditLog');

const getRequestIp = (req) => {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || '';
};

const logAuditEvent = async (req, payload = {}) => {
  try {
    const { action, entityType } = payload;
    if (!action || !entityType) {
      return null;
    }

    const user = req.user || {};

    const auditLog = new AuditLog({
      workspaceId: payload.workspaceId ?? user.workspaceId ?? null,
      userId: payload.userId ?? req.userId ?? user._id ?? null,
      userName: payload.userName || user.name || 'system',
      userEmail: payload.userEmail || user.email || '',
      action: String(action).trim(),
      entityType: String(entityType).trim(),
      entityId: payload.entityId ? String(payload.entityId) : '',
      metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {},
      ipAddress: getRequestIp(req),
      userAgent: req.headers?.['user-agent'] || ''
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Audit logger failed:', error.message);
    return null;
  }
};

module.exports = {
  logAuditEvent
};
