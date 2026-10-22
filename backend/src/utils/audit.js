import AuditLog from '../models/AuditLog.js';

export async function audit(req, action, resourceType, resourceId, details = {}) {
  try {
    await AuditLog.create({
      actor: req.user?._id,
      action,
      resourceType,
      resourceId: resourceId?.toString(),
      details,
      ip: req.ip || req.connection?.remoteAddress,
    });
  } catch (error) {
    console.error('Audit recording failure:', error.message);
  }
}
