import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { CloudArrowUpIcon, TrashIcon } from '../components/Icons';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

export default function Datasets() {
  const [items, setItems] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    experiment: '',
    equipment: '',
    detectorModel: '',
    temperature: '',
    voltage: '',
    sampleType: '',
    location: '',
    runNumber: '',
    notes: '',
  });

  const { user } = useAuth();
  const isPrivileged = ['lab_manager', 'institution_admin'].includes(user.role);

  const load = () => {
    setLoading(true);
    api
      .get('/datasets')
      .then((r) => setItems(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load datasets'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    Promise.all([api.get('/experiments'), api.get('/equipment')])
      .then(([e, q]) => {
        setExperiments(e.data);
        setEquipment(q.data);
      })
      .catch(() => {});
  }, []);

  useSocket({
    'dataset:uploaded': load,
    'dataset:deleted': load,
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('experiment', form.experiment);
    if (form.equipment) fd.append('equipment', form.equipment);

    const { detectorModel, temperature, voltage, sampleType, location, runNumber, notes } = form;
    fd.append(
      'metadata',
      JSON.stringify({
        detectorModel,
        temperature: Number(temperature) || undefined,
        voltage: Number(voltage) || undefined,
        sampleType,
        location,
        runNumber,
        notes,
      })
    );

    try {
      await api.post('/datasets', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOpen(false);
      setFile(null);
      setMsg('Dataset uploaded and catalogued successfully.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Dataset upload failed');
    }
  };

  const deleteDataset = async (dataset) => {
    if (!confirm(`Are you sure you want to delete dataset "${dataset.originalName}"?`)) return;
    setError('');
    setMsg('');
    try {
      await api.delete(`/datasets/${dataset._id}`);
      setMsg('Dataset deleted successfully.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete dataset');
    }
  };

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">DETECTOR EVIDENCE</span>
          <h2>Dataset Repository</h2>
          <p className="muted">
            Uploaded detector runs, telemetry, and raw instrument evidence linked to experiments.
          </p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          <CloudArrowUpIcon /> Upload dataset
        </button>
      </div>

      {msg && <div className="notice">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Experiment</th>
              <th>Detector / Instrument</th>
              <th>Size</th>
              <th>Uploaded By</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => {
              const isOwner = d.uploadedBy?._id === user.id || d.uploadedBy === user.id;
              const canDelete = isOwner || isPrivileged;

              return (
                <tr key={d._id}>
                  <td>
                    <Link className="table-link" to={`/datasets/${d._id}`}>
                      {d.originalName}
                    </Link>
                    <small>{d.mimeType || 'raw dataset'}</small>
                  </td>
                  <td>
                    <span>{d.experiment?.title || 'General run'}</span>
                  </td>
                  <td>
                    <span>{d.equipment?.name || '—'}</span>
                    {d.equipment?.model && <small>{d.equipment.model}</small>}
                  </td>
                  <td>
                    <span>{(d.size / 1024).toFixed(1)} KB</span>
                  </td>
                  <td>
                    <small>{d.uploadedBy?.name || 'Researcher'}</small>
                  </td>
                  <td>
                    <small>{new Date(d.createdAt).toLocaleDateString()}</small>
                  </td>
                  <td>
                    {canDelete ? (
                      <button
                        className="icon-btn"
                        title="Delete Dataset"
                        onClick={() => deleteDataset(d)}
                      >
                        <TrashIcon />
                      </button>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {loading && <div className="loading" style={{ minHeight: '100px' }}>Loading repository…</div>}
        {!loading && !items.length && <div className="empty">No datasets uploaded yet.</div>}
      </div>

      <Modal open={open} title="Upload detector dataset" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="form-grid">
          <label className="span-2">
            Dataset File (.csv, .json, .tsv, .dat, .txt, .tif)
            <input
              required
              type="file"
              accept=".csv,.json,.txt,.tsv,.dat,.log,.png,.jpg,.jpeg,.webp,.tif,.tiff"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <label>
            Experiment
            <select
              required
              value={form.experiment}
              onChange={(e) => setForm({ ...form, experiment: e.target.value })}
            >
              <option value="">Select experiment</option>
              {experiments.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.title} ({x.status})
                </option>
              ))}
            </select>
          </label>

          <label>
            Equipment / Detector
            <select
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            >
              <option value="">Unspecified detector</option>
              {equipment.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name} ({x.model || 'Detector'})
                </option>
              ))}
            </select>
          </label>

          {['detectorModel', 'temperature', 'voltage', 'sampleType', 'location', 'runNumber'].map((k) => (
            <label key={k}>
              {k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              <input
                value={form[k]}
                placeholder={k === 'temperature' ? 'e.g. 24.5' : k === 'voltage' ? 'e.g. 400' : ''}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              />
            </label>
          ))}

          <label className="span-2">
            Run Notes & Context
            <textarea
              placeholder="Beam conditions, sample orientation, gain settings..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <button className="primary span-2" disabled={!file} type="submit">
            Upload and catalog
          </button>
        </form>
      </Modal>
    </div>
  );
}
