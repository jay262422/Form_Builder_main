const AuditLog = require('../models/AuditLog');
const {
  successResponse,
  errorResponse
} = require('../utils/responseHelper');

exports.getMyWorkspaceAuditLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const { action, entityType, userId, entityId } = req.query;
    const query = {};

    if (req.user?.workspaceId) {
      query.workspaceId = req.user.workspaceId;
    } else if (req.userId) {
      query.userId = req.userId;
    }

    if (action) query.action = action;
    if (entityType) query.entityType = entityType;
    if (userId) query.userId = userId;
    if (entityId) query.entityId = entityId;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return successResponse(res, {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: total > 0 ? Math.ceil(total / limit) : 1
      }
    }, 'Audit logs retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve audit logs', 500);
  }
};
