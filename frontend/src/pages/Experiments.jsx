import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { PlusIcon } from '../components/Icons';
import { useSocket } from '../hooks/useSocket';

const initialExperiment = {
  title: '',
  description: '',
  researchObjective: '',
  laboratory: '',
  requiredEquipment: [],
  startDate: '',
  endDate: '',
};

export default function Experiments() {
  const [items, setItems] = useState([]);
  const [labs, setLabs] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(initialExperiment);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/experiments')
      .then((r) => setItems(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load experiments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    Promise.all([api.get('/labs/laboratories'), api.get('/equipment')])
      .then(([lRes, eqRes]) => {
        setLabs(lRes.data);
        setEquipmentList(eqRes.data);
      })
      .catch(() => {});
  }, []);

  useSocket({
    'experiment:updated': load,
    'experiment:created': load,
    'experiment:deleted': load,
  });

  const create = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.post('/experiments', {
        ...form,
        laboratory: form.laboratory || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      setOpen(false);
      setForm(initialExperiment);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create experiment');
    }
  };

  const filtered = items.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.researchObjective && e.researchObjective.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter ? e.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RESEARCH OPERATIONS</span>
          <h2>Experiments</h2>
          <p className="muted">Plan, track, collaborate, and version research lifecycles.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          <PlusIcon /> New experiment
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search experiments by title or objective..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '13px',
            minWidth: '260px',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '13px',
          }}
        >
          <option value="">All statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Running">Running</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Experiment</th>
              <th>Laboratory</th>
              <th>Lead Researcher</th>
              <th>Status</th>
              <th>Version</th>
              <th>Start Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e._id}>
                <td>
                  <Link className="table-link" to={`/experiments/${e._id}`}>
                    {e.title}
                  </Link>
                  <small>{e.researchObjective || 'No objective stated'}</small>
                </td>
                <td>{e.laboratory?.name || '—'}</td>
                <td>{e.createdBy?.name || '—'}</td>
                <td>
                  <StatusBadge status={e.status} />
                </td>
                <td>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>v{e.version}</span>
                </td>
                <td>
                  <small>{e.startDate ? new Date(e.startDate).toLocaleDateString() : '—'}</small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="loading" style={{ minHeight: '100px' }}>Loading experiments…</div>}
        {!loading && !filtered.length && <div className="empty">No experiments found.</div>}
      </div>

      <Modal open={open} title="Create research experiment" onClose={() => setOpen(false)}>
        <form onSubmit={create} className="form-grid">
          <label className="span-2">
            Experiment Title
            <input
              required
              placeholder="e.g. Muon Beam Polarization Analysis"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>

          <label className="span-2">
            Research Objective
            <textarea
              required
              placeholder="Key scientific question, hypotheses, or milestones..."
              value={form.researchObjective}
              onChange={(e) => setForm({ ...form, researchObjective: e.target.value })}
            />
          </label>

          <label>
            Laboratory
            <select
              value={form.laboratory}
              onChange={(e) => setForm({ ...form, laboratory: e.target.value })}
            >
              <option value="">Select laboratory</option>
              {labs.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.code || 'Lab'})
                </option>
              ))}
            </select>
          </label>

          <label>
            Required Detector / Equipment
            <select
              value={form.requiredEquipment[0] || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  requiredEquipment: e.target.value ? [e.target.value] : [],
                })
              }
            >
              <option value="">Select primary instrument</option>
              {equipmentList.map((eq) => (
                <option key={eq._id} value={eq._id}>
                  {eq.name} ({eq.model || 'Instrument'})
                </option>
              ))}
            </select>
          </label>

          <label>
            Start Date
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>

          <label>
            End Date
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </label>

          <label className="span-2">
            Methodology & Detailed Description
            <textarea
              placeholder="Detailed experiment configuration, beam settings, protocols..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <button className="primary span-2" type="submit">
            Create experiment
          </button>
        </form>
      </Modal>
    </div>
  );
}
