import { useEffect, useState } from 'react';
import api from '../services/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [filterAction, setFilterAction] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (page = 1) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      page: String(page),
      limit: '25',
    });
    if (filterAction) params.append('action', filterAction);
    if (filterResource) params.append('resourceType', filterResource);

    api
      .get(`/audit?${params.toString()}`)
      .then((res) => {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load audit trail');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
  }, [filterAction, filterResource]);

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">COMPLIANCE & GOVERNANCE</span>
          <h2>Audit Trail</h2>
          <p className="muted">
            Immutable system activity log recording all user access, instrument bookings, and research changes.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="Filter by action (e.g. login, created)..."
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '13px',
            minWidth: '220px',
          }}
        />
        <select
          value={filterResource}
          onChange={(e) => setFilterResource(e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '13px',
          }}
        >
          <option value="">All resource types</option>
          <option value="User">User</option>
          <option value="Experiment">Experiment</option>
          <option value="Reservation">Reservation</option>
          <option value="Equipment">Equipment</option>
          <option value="Dataset">Dataset</option>
          <option value="Department">Department</option>
          <option value="Laboratory">Laboratory</option>
        </select>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP / Origin</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>
                  <strong style={{ fontSize: '13px' }}>
                    {new Date(log.createdAt).toLocaleDateString()}
                  </strong>
                  <small>{new Date(log.createdAt).toLocaleTimeString()}</small>
                </td>
                <td>
                  {log.actor ? (
                    <div>
                      <strong>{log.actor.name}</strong>
                      <small>{log.actor.email}</small>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>System</span>
                  )}
                </td>
                <td>
                  <span className="status" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                    {log.action}
                  </span>
                </td>
                <td>
                  <strong>{log.resourceType || '—'}</strong>
                  {log.resourceId && <small>{log.resourceId}</small>}
                </td>
                <td>
                  <small style={{ fontFamily: 'monospace' }}>{log.ip || '127.0.0.1'}</small>
                </td>
                <td style={{ maxWidth: '300px' }}>
                  <small style={{ wordBreak: 'break-all' }}>
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="loading" style={{ minHeight: '120px' }}>Loading audit records…</div>}
        {!loading && !logs.length && <div className="empty">No audit records found matching criteria.</div>}
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span className="muted" style={{ fontSize: '13px' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="text-btn"
              disabled={pagination.page <= 1}
              onClick={() => load(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="text-btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => load(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
