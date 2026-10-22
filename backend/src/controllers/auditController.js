import AuditLog from '../models/AuditLog.js';

export async function listAuditLogs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.action) {
      filter.action = new RegExp(req.query.action, 'i');
    }
    if (req.query.resourceType) {
      filter.resourceType = req.query.resourceType;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actor', 'name email role')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter)
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
}
