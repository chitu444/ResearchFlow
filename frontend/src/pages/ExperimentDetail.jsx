import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { CheckIcon, PlusIcon, TrashIcon, DocumentTextIcon } from '../components/Icons';
import { generateExperimentPdf } from '../utils/generatePdfReport';

export default function ExperimentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [comment, setComment] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get(`/experiments/${id}`)
      .then((r) => {
        setData(r.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load experiment');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  useSocket({
    'experiment:updated': (p) => p?.id === id && load(),
    'experiment:comment': (p) => p?.experiment === id && load(),
    'experiment:task': (p) => p?.experiment === id && load(),
  });

  if (loading) {
    return <div className="loading">Loading experiment details…</div>;
  }
  if (error || !data) {
    return (
      <div className="page">
        <div className="error">{error || 'Experiment not found'}</div>
      </div>
    );
  }

  const e = data.experiment;
  const isOwner = e.createdBy?._id === user.id || e.createdBy === user.id;
  const isPrivileged = ['lab_manager', 'institution_admin'].includes(user.role);

  const addComment = async (ev) => {
    ev.preventDefault();
    if (!comment.trim()) return;
    try {
      await api.post(`/experiments/${id}/comments`, { body: comment });
      setComment('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Comment failed');
    }
  };

  const changeStatus = async (nextStatus) => {
    if (!nextStatus) return;
    try {
      await api.patch(`/experiments/${id}`, { status: nextStatus });
      setStatus('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Status update failed');
    }
  };

  const addTask = async (ev) => {
    ev.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      await api.post(`/experiments/${id}/tasks`, { title: taskTitle });
      setTaskTitle('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Task creation failed');
    }
  };

  const toggleTaskStatus = async (task) => {
    const next = task.status === 'Done' ? 'Todo' : 'Done';
    try {
      await api.patch(`/experiments/${id}/tasks/${task._id}`, { status: next });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update task');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete experiment "${e.title}"?`)) return;
    try {
      await api.delete(`/experiments/${id}`);
      navigate('/experiments');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete experiment');
    }
  };

  const exportPdf = () => {
    generateExperimentPdf(e, data.history, data.tasks, data.comments);
  };

  const allowedStatuses = (
    user.role === 'researcher'
      ? ['Submitted']
      : ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Running', 'Completed', 'Archived']
  ).filter((s) => s !== e.status);

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">
            EXPERIMENT / VERSION {e.version}
          </span>
          <h2>{e.title}</h2>
          <p className="muted">{e.researchObjective || 'No research objective stated.'}</p>
        </div>

        <div className="row-actions" style={{ alignItems: 'center', gap: '10px' }}>
          <StatusBadge status={e.status} />

          <button
            className="primary"
            onClick={exportPdf}
            title="Download publication-ready scientific audit report (PDF)"
            style={{ fontSize: '13px' }}
          >
            <DocumentTextIcon style={{ width: 17, height: 17 }} /> Export PDF
          </button>

          {(isPrivileged || (user.role === 'researcher' && e.status === 'Draft')) && allowedStatuses.length > 0 && (
            <select
              value={status}
              onChange={(ev) => {
                setStatus(ev.target.value);
                changeStatus(ev.target.value);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '9px',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '13px',
              }}
            >
              <option value="">Move status to…</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {(isPrivileged || (isOwner && e.status === 'Draft')) && (
            <button
              className="text-btn danger"
              onClick={handleDelete}
              title="Delete experiment"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <TrashIcon style={{ width: '16px', height: '16px' }} /> Delete
            </button>
          )}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="grid-2">
        <section className="card">
          <h3>Research brief</h3>
          <p style={{ lineHeight: '1.6', margin: '12px 0 20px' }}>{e.description || 'No detailed description.'}</p>
          <div className="detail-grid">
            <span>
              Laboratory
              <strong>{e.laboratory?.name || '—'}</strong>
            </span>
            <span>
              Lead Researcher
              <strong>{e.createdBy?.name || '—'}</strong>
            </span>
            <span>
              Start Date
              <strong>{e.startDate ? new Date(e.startDate).toLocaleDateString() : '—'}</strong>
            </span>
            <span>
              End Date
              <strong>{e.endDate ? new Date(e.endDate).toLocaleDateString() : '—'}</strong>
            </span>
          </div>
        </section>

        <section className="card">
          <h3>Version history</h3>
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {data.history.map((v) => (
              <div className="timeline" key={v._id}>
                <strong>Version {v.version}</strong>
                <span>
                  {v.changedBy?.name || 'System'} · {new Date(v.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
            {!data.history.length && <p className="muted">No version history yet.</p>}
          </div>
        </section>
      </div>

      {/* Tasks Section with Interactive Status */}
      <section className="card" style={{ marginTop: '18px' }}>
        <div className="section-head">
          <div>
            <h3>Milestones & Tasks</h3>
            <p>Click any task to toggle between Todo and Done.</p>
          </div>
          <span className="muted" style={{ fontSize: '13px' }}>
            {data.tasks.filter((t) => t.status === 'Done').length} of {data.tasks.length} completed
          </span>
        </div>

        <div style={{ margin: '14px 0' }}>
          {data.tasks.map((t) => (
            <div
              className="list-row"
              key={t._id}
              onClick={() => toggleTaskStatus(t)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              title="Click to toggle status"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="checkbox"
                  checked={t.status === 'Done'}
                  onChange={() => {}}
                  style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                />
                <div>
                  <strong style={{ textDecoration: t.status === 'Done' ? 'line-through' : 'none', opacity: t.status === 'Done' ? 0.6 : 1 }}>
                    {t.title}
                  </strong>
                  <span>{t.assignee?.name ? `Assigned: ${t.assignee.name}` : 'Unassigned'}</span>
                </div>
              </div>
              <span
                className={`status ${t.status === 'Done' ? 'status-completed' : 'status-pending'}`}
                style={{ fontSize: '11px' }}
              >
                {t.status}
              </span>
            </div>
          ))}
          {!data.tasks.length && <p className="muted">No tasks defined yet.</p>}
        </div>

        <form onSubmit={addTask} className="comment-box">
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Add a new milestone or action item…"
          />
          <button className="primary" type="submit">
            <PlusIcon /> Add task
          </button>
        </form>
      </section>

      {/* Collaboration / Comments Section */}
      <section className="card" style={{ marginTop: '18px' }}>
        <h3>Collaboration & Notes</h3>
        <div style={{ maxHeight: '350px', overflowY: 'auto', margin: '14px 0' }}>
          {data.comments.map((c) => (
            <div className="comment" key={c._id}>
              <strong>{c.author?.name || 'Collaborator'}</strong>
              <span>{new Date(c.createdAt).toLocaleString()}</span>
              <p>{c.body}</p>
            </div>
          ))}
          {!data.comments.length && <p className="muted">No research notes posted yet.</p>}
        </div>

        <form onSubmit={addComment} className="comment-box">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Post a research observation, peer feedback, or note…"
          />
          <button className="primary" type="submit">
            Post note
          </button>
        </form>
      </section>
    </div>
  );
}
