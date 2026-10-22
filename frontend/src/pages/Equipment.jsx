import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { WrenchScrewdriverIcon } from '../components/Icons';

const emptyEquipment = {
  name: '',
  detectorType: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  laboratory: '',
  location: '',
  status: 'Purchased',
  utilization: 0,
  nextCalibration: '',
};

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [labs, setLabs] = useState([]);
  const [form, setForm] = useState(emptyEquipment);
  const [open, setOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [selectedEq, setSelectedEq] = useState(null);
  const [maintForm, setMaintForm] = useState({ description: '', status: 'Active', nextCalibration: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const { user } = useAuth();
  const canEdit = ['lab_manager', 'institution_admin'].includes(user.role);

  const load = () =>
    Promise.all([api.get('/equipment'), api.get('/labs/laboratories')])
      .then(([equipmentResponse, labsResponse]) => {
        setItems(equipmentResponse.data);
        setLabs(labsResponse.data);
      })
      .catch((e) =>
        setError(e.response?.data?.message || 'Could not load equipment')
      );

  useEffect(() => {
    load();
  }, []);

  useSocket({
    'equipment:availability': load,
    'institution:changed': load,
  });

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setMsg('');

    try {
      const payload = {
        ...form,
        utilization: Number(form.utilization),
        nextCalibration: form.nextCalibration || undefined,
      };

      if (form._id) {
        await api.patch(`/equipment/${form._id}`, payload);
        setMsg(`Equipment "${form.name}" updated successfully.`);
      } else {
        await api.post('/equipment', payload);
        setMsg(`Equipment "${form.name}" created successfully.`);
      }

      setOpen(false);
      setForm(emptyEquipment);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Equipment save failed');
    }
  };

  const handleMaintenance = async (event) => {
    event.preventDefault();
    if (!selectedEq) return;
    setError('');
    setMsg('');

    try {
      await api.post(`/equipment/${selectedEq._id}/maintenance`, maintForm);
      setMsg(`Maintenance record logged for "${selectedEq.name}".`);
      setMaintOpen(false);
      setSelectedEq(null);
      setMaintForm({ description: '', status: 'Active', nextCalibration: '' });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Maintenance log failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this equipment?')) return;
    setError('');
    setMsg('');

    try {
      await api.delete(`/equipment/${id}`);
      setMsg('Equipment deleted.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  const edit = (equipment) => {
    setForm({
      ...equipment,
      laboratory: equipment.laboratory?._id || '',
      nextCalibration: equipment.nextCalibration
        ? equipment.nextCalibration.slice(0, 10)
        : '',
    });
    setOpen(true);
  };

  const openMaintenanceModal = (equipment) => {
    setSelectedEq(equipment);
    setMaintForm({
      description: '',
      status: equipment.status,
      nextCalibration: equipment.nextCalibration ? equipment.nextCalibration.slice(0, 10) : '',
    });
    setMaintOpen(true);
  };

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">INSTRUMENTATION</span>
          <h2>Equipment & Detectors</h2>
          <p className="muted">
            Detector inventory, lifecycle, maintenance logs, automated calibration alerts and utilization.
          </p>
        </div>

        {canEdit && (
          <button
            className="primary"
            onClick={() => {
              setForm(emptyEquipment);
              setOpen(true);
            }}
          >
            New equipment
          </button>
        )}
      </div>

      {msg && <div className="notice">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="equipment-grid">
        {items.map((equipment) => {
          const util = equipment.computedUtilization ?? equipment.utilization ?? 0;

          return (
            <article className="equipment-card" key={equipment._id}>
              <div className="equipment-icon">◌</div>

              <div className="section-head">
                <div>
                  <h3>{equipment.name}</h3>
                  <p>
                    {equipment.manufacturer || '—'} · {equipment.model || '—'}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <StatusBadge status={equipment.status} />
                  {equipment.calibrationAlert && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 7px',
                        borderRadius: '99px',
                        background: equipment.calibrationStatus === 'expired' ? 'color-mix(in srgb, var(--danger) 18%, transparent)' : 'color-mix(in srgb, var(--brown) 18%, transparent)',
                        color: equipment.calibrationStatus === 'expired' ? 'var(--danger)' : 'var(--brown)',
                      }}
                    >
                      {equipment.calibrationStatus === 'expired' ? '⚠ Calibration Expired' : '⏱ Calibration Due Soon'}
                    </span>
                  )}
                </div>
              </div>

              <div className="equipment-meta">
                <span>
                  Serial
                  <strong>{equipment.serialNumber || '—'}</strong>
                </span>
                <span>
                  Laboratory
                  <strong>{equipment.laboratory?.name || '—'}</strong>
                </span>
              </div>

              <div className="util">
                <div>
                  <span>Monthly Facility Utilization</span>
                  <strong>{util}%</strong>
                </div>
                <div className="bar">
                  <i style={{ width: `${util}%` }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--muted)', marginTop: '8px' }}>
                <span>
                  Next calibration:{' '}
                  {equipment.nextCalibration
                    ? new Date(equipment.nextCalibration).toLocaleDateString()
                    : 'Not scheduled'}
                </span>
                <span>
                  {equipment.maintenanceHistory?.length || 0} service logs
                </span>
              </div>

              {canEdit && (
                <div className="row-actions" style={{ marginTop: 16 }}>
                  <button
                    className="text-btn"
                    onClick={() => openMaintenanceModal(equipment)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <WrenchScrewdriverIcon style={{ width: '15px' }} /> Service
                  </button>
                  <button
                    className="text-btn"
                    onClick={() => edit(equipment)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-btn danger"
                    onClick={() => remove(equipment._id)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {!items.length && (
        <div className="card empty">No equipment has been registered yet.</div>
      )}

      {/* Equipment Edit/Create Modal */}
      <Modal
        open={open}
        title={form._id ? 'Edit equipment' : 'Create equipment'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="form-grid">
          <label>
            Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label>
            Detector type
            <input
              value={form.detectorType || ''}
              onChange={(e) =>
                setForm({ ...form, detectorType: e.target.value })
              }
            />
          </label>

          <label>
            Manufacturer
            <input
              value={form.manufacturer || ''}
              onChange={(e) =>
                setForm({ ...form, manufacturer: e.target.value })
              }
            />
          </label>

          <label>
            Model
            <input
              value={form.model || ''}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
            />
          </label>

          <label>
            Serial number
            <input
              value={form.serialNumber || ''}
              onChange={(e) =>
                setForm({ ...form, serialNumber: e.target.value })
              }
            />
          </label>

          <label>
            Laboratory
            <select
              value={form.laboratory || ''}
              onChange={(e) =>
                setForm({ ...form, laboratory: e.target.value })
              }
            >
              <option value="">Unassigned</option>
              {labs.map((lab) => (
                <option key={lab._id} value={lab._id}>
                  {lab.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {[
                'Purchased',
                'Installed',
                'Calibrated',
                'Active',
                'Maintenance',
                'Retired',
              ].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            Base Utilization %
            <input
              type="number"
              min="0"
              max="100"
              value={form.utilization}
              onChange={(e) =>
                setForm({ ...form, utilization: e.target.value })
              }
            />
          </label>

          <label>
            Next calibration
            <input
              type="date"
              value={form.nextCalibration || ''}
              onChange={(e) =>
                setForm({ ...form, nextCalibration: e.target.value })
              }
            />
          </label>

          <label>
            Location
            <input
              value={form.location || ''}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>

          <button className="primary span-2" type="submit">Save equipment</button>
        </form>
      </Modal>

      {/* Log Maintenance Modal */}
      <Modal
        open={maintOpen}
        title={`Log service / calibration for ${selectedEq?.name || ''}`}
        onClose={() => setMaintOpen(false)}
      >
        <form onSubmit={handleMaintenance} className="form-grid">
          <label className="span-2">
            Service Description & Findings
            <textarea
              required
              placeholder="e.g. Recalibrated PMT detectors; replaced cooling sensor; baseline noise normalized..."
              value={maintForm.description}
              onChange={(e) => setMaintForm({ ...maintForm, description: e.target.value })}
            />
          </label>

          <label>
            Updated Status
            <select
              value={maintForm.status}
              onChange={(e) => setMaintForm({ ...maintForm, status: e.target.value })}
            >
              {['Calibrated', 'Active', 'Maintenance', 'Retired'].map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </label>

          <label>
            Next Calibration Due Date
            <input
              type="date"
              value={maintForm.nextCalibration}
              onChange={(e) => setMaintForm({ ...maintForm, nextCalibration: e.target.value })}
            />
          </label>

          <button className="primary span-2" type="submit">Record maintenance</button>
        </form>
      </Modal>
    </div>
  );
}
