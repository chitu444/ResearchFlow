import { useEffect, useState } from 'react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import { PlusIcon, CheckIcon, XMarkIcon, CalendarDaysIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';

export default function Reservations() {
  const [items, setItems] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'table'
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    equipment: '',
    experiment: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const { user } = useAuth();
  const isPrivileged = ['lab_manager', 'institution_admin'].includes(user.role);
  const nowIso = new Date().toISOString().slice(0, 16);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/reservations'), api.get('/equipment'), api.get('/experiments')])
      .then(([r, e, exp]) => {
        setItems(r.data);
        setEquipment(e.data);
        setExperiments(exp.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Could not load reservations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useSocket({
    'reservation:changed': load,
    'equipment:availability': load,
  });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    try {
      await api.post('/reservations', form);
      setOpen(false);
      setForm({ equipment: '', experiment: '', startTime: '', endTime: '', notes: '' });
      setMsg('Reservation request submitted successfully.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Reservation failed');
    }
  };

  const review = async (id, status) => {
    setError('');
    setMsg('');
    try {
      await api.patch(`/reservations/${id}/review`, { status });
      setMsg(`Reservation marked as ${status}.`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Review failed');
    }
  };

  const cancelReservation = async (id) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    setError('');
    setMsg('');
    try {
      await api.patch(`/reservations/${id}/cancel`);
      setMsg('Reservation cancelled successfully.');
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Cancellation failed');
    }
  };

  const shiftDate = (deltaDays) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + deltaDays);
    setSelectedDate(current.toISOString().slice(0, 10));
  };

  // Timeline hours from 08:00 to 20:00 (12 hours span)
  const timelineStartHour = 8;
  const timelineTotalHours = 12;
  const hoursMarks = Array.from({ length: 13 }, (_, i) => timelineStartHour + i);

  // Filter reservations occurring on selectedDate
  const reservationsOnDate = items.filter((r) => {
    const startStr = new Date(r.startTime).toISOString().slice(0, 10);
    const endStr = new Date(r.endTime).toISOString().slice(0, 10);
    return startStr === selectedDate || endStr === selectedDate;
  });

  const openBookingForEquipment = (eqId) => {
    setForm({
      equipment: eqId,
      experiment: '',
      startTime: `${selectedDate}T09:00`,
      endTime: `${selectedDate}T12:00`,
      notes: '',
    });
    setOpen(true);
  };

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">FACILITY SCHEDULE & LEASE LOCKING</span>
          <h2>Instrument Time & Schedule</h2>
          <p className="muted">
            Interactive timeline and conflict-aware booking manager with distributed concurrency locks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface2)', padding: '3px', borderRadius: '10px' }}>
            <button
              onClick={() => setViewMode('timeline')}
              style={{
                border: 0,
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '12px',
                background: viewMode === 'timeline' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'timeline' ? 'var(--accent)' : 'var(--muted)',
                boxShadow: viewMode === 'timeline' ? 'var(--shadow)' : 'none',
              }}
            >
              Visual Timeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                border: 0,
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '12px',
                background: viewMode === 'table' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'table' ? 'var(--accent)' : 'var(--muted)',
                boxShadow: viewMode === 'table' ? 'var(--shadow)' : 'none',
              }}
            >
              List View
            </button>
          </div>

          <button className="primary" onClick={() => setOpen(true)}>
            <PlusIcon /> Request time
          </button>
        </div>
      </div>

      {msg && <div className="notice">{msg}</div>}
      {error && <div className="error">{error}</div>}

      {/* Visual Timeline View */}
      {viewMode === 'timeline' && (
        <section className="card" style={{ padding: '24px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button className="icon-btn" onClick={() => shiftDate(-1)} title="Previous Day">
                ←
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '7px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontWeight: 600,
                }}
              />
              <button className="icon-btn" onClick={() => shiftDate(1)} title="Next Day">
                →
              </button>
              <button
                className="text-btn"
                onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              >
                Today
              </button>
            </div>

            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--good)' }} /> Approved
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--lavender)' }} /> Pending Review
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--danger)' }} /> Maintenance
              </span>
            </div>
          </div>

          <div style={{ minWidth: '780px' }}>
            {/* Hour Markers */}
            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', borderBottom: '2px solid var(--line)', paddingBottom: '8px' }}>
              <strong style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Instrument Lane
              </strong>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px', fontSize: '11px', color: 'var(--muted)', fontFamily: 'monospace' }}>
                {hoursMarks.map((hr) => (
                  <span key={hr}>{hr < 10 ? `0${hr}:00` : `${hr}:00`}</span>
                ))}
              </div>
            </div>

            {/* Equipment Rows */}
            {equipment.map((eq) => {
              const eqReservations = reservationsOnDate.filter(
                (r) => r.equipment?._id === eq._id && ['Approved', 'Pending'].includes(r.status)
              );

              return (
                <div
                  key={eq._id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    borderBottom: '1px solid var(--line)',
                    minHeight: '64px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ paddingRight: '12px' }}>
                    <strong style={{ fontSize: '13px', display: 'block' }}>{eq.name}</strong>
                    <small style={{ color: 'var(--muted)' }}>
                      {eq.status === 'Maintenance' ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 700 }}>In Maintenance</span>
                      ) : (
                        `${eq.model || 'Instrument'} · ${eq.laboratory?.name || 'Lab'}`
                      )}
                    </small>
                  </div>

                  {/* Schedule Track */}
                  <div
                    style={{
                      position: 'relative',
                      height: '42px',
                      background: 'var(--surface2)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: eq.status === 'Maintenance' ? 'not-allowed' : 'pointer',
                    }}
                    onClick={(e) => {
                      if (eq.status !== 'Maintenance' && e.target === e.currentTarget) {
                        openBookingForEquipment(eq._id);
                      }
                    }}
                    title={eq.status !== 'Maintenance' ? 'Click empty track to book this instrument' : 'Instrument under maintenance'}
                  >
                    {eqReservations.map((r) => {
                      const start = new Date(r.startTime);
                      const end = new Date(r.endTime);

                      const startDecimal = start.getHours() + start.getMinutes() / 60;
                      const endDecimal = end.getHours() + end.getMinutes() / 60;

                      const leftPercent = Math.max(0, ((startDecimal - timelineStartHour) / timelineTotalHours) * 100);
                      const widthPercent = Math.min(
                        100 - leftPercent,
                        Math.max(4, ((endDecimal - startDecimal) / timelineTotalHours) * 100)
                      );

                      const isApproved = r.status === 'Approved';

                      return (
                        <div
                          key={r._id}
                          style={{
                            position: 'absolute',
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            top: '3px',
                            bottom: '3px',
                            background: isApproved
                              ? 'color-mix(in srgb, var(--good) 28%, var(--surface))'
                              : 'color-mix(in srgb, var(--lavender) 38%, var(--surface))',
                            border: `1px solid ${isApproved ? 'var(--good)' : 'var(--accent)'}`,
                            borderRadius: '6px',
                            padding: '4px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            fontSize: '11px',
                            color: 'var(--text)',
                            zIndex: 2,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                          }}
                          title={`${r.requestedBy?.name || 'User'} (${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}): ${r.notes || r.experiment?.title || 'Instrument Run'}`}
                        >
                          <strong style={{ fontSize: '11px' }}>
                            {r.requestedBy?.name?.split(' ')[1] || r.requestedBy?.name || 'Run'}
                          </strong>
                          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* List Table View */}
      {viewMode === 'table' && (
        <div className="card table-card">
          <table>
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Researcher</th>
                <th>Experiment</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => {
                const isOwner = r.requestedBy?._id === user.id || r.requestedBy === user.id;
                const canCancel = (isOwner || isPrivileged) && ['Pending', 'Approved'].includes(r.status);

                return (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.equipment?.name || '—'}</strong>
                      <small>{r.equipment?.model}</small>
                    </td>
                    <td>
                      <strong>{r.requestedBy?.name || '—'}</strong>
                      <small>{r.requestedBy?.email}</small>
                    </td>
                    <td>
                      <span>{r.experiment?.title || 'General access'}</span>
                    </td>
                    <td>
                      <strong>{new Date(r.startTime).toLocaleDateString()}</strong>
                      <small>{new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>
                      <strong>{new Date(r.endTime).toLocaleDateString()}</strong>
                      <small>{new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <div className="row-actions" style={{ alignItems: 'center' }}>
                        {isPrivileged && r.status === 'Pending' && (
                          <>
                            <button
                              className="icon-btn"
                              title="Approve Reservation"
                              onClick={() => review(r._id, 'Approved')}
                              style={{ color: 'var(--good)' }}
                            >
                              <CheckIcon />
                            </button>
                            <button
                              className="icon-btn"
                              title="Reject Reservation"
                              onClick={() => review(r._id, 'Rejected')}
                              style={{ color: 'var(--danger)' }}
                            >
                              <XMarkIcon />
                            </button>
                          </>
                        )}

                        {canCancel && (
                          <button
                            className="text-btn danger"
                            onClick={() => cancelReservation(r._id)}
                            style={{ fontSize: '12px' }}
                          >
                            Cancel
                          </button>
                        )}

                        {!isPrivileged && !canCancel && <span className="muted">—</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {loading && <div className="loading" style={{ minHeight: '100px' }}>Loading reservations…</div>}
          {!loading && !items.length && <div className="empty">No reservations recorded yet.</div>}
        </div>
      )}

      {/* Booking Modal */}
      <Modal open={open} title="Request instrument time" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="form-grid">
          <label className="span-2">
            Equipment Instrument
            <select
              required
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            >
              <option value="">Select equipment</option>
              {equipment
                .filter((x) => !['Maintenance', 'Retired'].includes(x.status))
                .map((x) => (
                  <option key={x._id} value={x._id}>
                    {x.name} ({x.model || 'Instrument'}) — {x.status}
                  </option>
                ))}
            </select>
          </label>

          <label className="span-2">
            Associated Experiment (Optional)
            <select
              value={form.experiment}
              onChange={(e) => setForm({ ...form, experiment: e.target.value })}
            >
              <option value="">General research run / No experiment</option>
              {experiments.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.title} ({x.status})
                </option>
              ))}
            </select>
          </label>

          <label>
            Start Time
            <input
              required
              type="datetime-local"
              min={nowIso}
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </label>

          <label>
            End Time
            <input
              required
              type="datetime-local"
              min={form.startTime || nowIso}
              value={form.endTime}
              onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            />
          </label>

          <label className="span-2">
            Run Notes & Calibration Requirements
            <textarea
              placeholder="Beam settings, sample requirements, detector configuration..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <button className="primary span-2" type="submit">
            Submit request
          </button>
        </form>
      </Modal>
    </div>
  );
}
