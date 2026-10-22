import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { useSocket } from '../hooks/useSocket';

const emptyDept = { name: '', code: '', description: '' };
const emptyLab = { name: '', code: '', department: '', location: '', description: '' };

export default function Labs() {
  const [departments, setDepartments] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [dept, setDept] = useState(emptyDept);
  const [lab, setLab] = useState(emptyLab);
  const [deptOpen, setDeptOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () =>
    Promise.all([api.get('/labs/departments'), api.get('/labs/laboratories')])
      .then(([a, b]) => {
        setDepartments(a.data);
        setLaboratories(b.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Could not load institution structure'));

  useEffect(() => {
    load();
  }, []);

  useSocket({
    'institution:changed': load,
  });

  const saveDept = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      if (dept._id) {
        await api.patch(`/labs/departments/${dept._id}`, dept);
        setMsg(`Department "${dept.name}" updated.`);
      } else {
        await api.post('/labs/departments', dept);
        setMsg(`Department "${dept.name}" created.`);
      }
      setDept(emptyDept);
      setDeptOpen(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Department save failed');
    }
  };

  const saveLab = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    try {
      if (lab._id) {
        await api.patch(`/labs/laboratories/${lab._id}`, lab);
        setMsg(`Laboratory "${lab.name}" updated.`);
      } else {
        await api.post('/labs/laboratories', lab);
        setMsg(`Laboratory "${lab.name}" created.`);
      }
      setLab(emptyLab);
      setLabOpen(false);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Laboratory save failed');
    }
  };

  const remove = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    setError('');
    setMsg('');
    try {
      await api.delete(`/labs/${type === 'department' ? 'departments' : 'laboratories'}/${id}`);
      setMsg(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted.`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">INSTITUTION STRUCTURE</span>
          <h2>Departments & Laboratories</h2>
          <p className="muted">Manage the institutional hierarchy used by experiments and equipment.</p>
        </div>
        <div className="row-actions">
          <button
            className="primary"
            onClick={() => {
              setDept(emptyDept);
              setDeptOpen(true);
            }}
          >
            New department
          </button>
          <button
            className="primary"
            disabled={!departments.length}
            onClick={() => {
              setLab({ ...emptyLab, department: departments[0]?._id || '' });
              setLabOpen(true);
            }}
          >
            New laboratory
          </button>
        </div>
      </div>

      {msg && <div className="notice">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div className="grid-2">
        {departments.map((x) => (
          <section className="card" key={x._id}>
            <div className="section-head">
              <div>
                <h3>{x.name}</h3>
                <p>
                  Code: {x.code || 'None'}
                  {x.description ? ` · ${x.description}` : ''}
                </p>
              </div>
              <div className="row-actions">
                <button
                  className="text-btn"
                  onClick={() => {
                    setDept({ ...x });
                    setDeptOpen(true);
                  }}
                >
                  Edit
                </button>
                <button className="text-btn danger" onClick={() => remove('department', x._id)}>
                  Delete
                </button>
              </div>
            </div>

            <div style={{ marginTop: '14px' }}>
              {laboratories
                .filter((y) => y.department?._id === x._id)
                .map((y) => (
                  <div className="list-row" key={y._id}>
                    <div>
                      <strong>{y.name}</strong>
                      <span>
                        {y.code || 'No code'} · {y.location || 'Location unassigned'}
                      </span>
                    </div>
                    <div className="row-actions">
                      <button
                        className="text-btn"
                        onClick={() => {
                          setLab({ ...y, department: y.department?._id || '' });
                          setLabOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button className="text-btn danger" onClick={() => remove('laboratory', y._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              {!laboratories.some((y) => y.department?._id === x._id) && (
                <div className="empty" style={{ padding: '20px 0' }}>
                  No laboratories assigned to this department yet.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Department Modal */}
      <Modal open={deptOpen} title={dept._id ? 'Edit department' : 'Create department'} onClose={() => setDeptOpen(false)}>
        <form onSubmit={saveDept} className="form-grid">
          <label>
            Department Name
            <input
              required
              placeholder="e.g. Experimental Physics"
              value={dept.name}
              onChange={(e) => setDept({ ...dept, name: e.target.value })}
            />
          </label>
          <label>
            Department Code
            <input
              placeholder="e.g. PHY"
              value={dept.code}
              onChange={(e) => setDept({ ...dept, code: e.target.value })}
            />
          </label>
          <label className="span-2">
            Description
            <textarea
              placeholder="Mission, domain, research facilities..."
              value={dept.description || ''}
              onChange={(e) => setDept({ ...dept, description: e.target.value })}
            />
          </label>
          <button className="primary span-2" type="submit">
            Save department
          </button>
        </form>
      </Modal>

      {/* Laboratory Modal */}
      <Modal open={labOpen} title={lab._id ? 'Edit laboratory' : 'Create laboratory'} onClose={() => setLabOpen(false)}>
        <form onSubmit={saveLab} className="form-grid">
          <label>
            Laboratory Name
            <input
              required
              placeholder="e.g. Detector Systems Lab"
              value={lab.name}
              onChange={(e) => setLab({ ...lab, name: e.target.value })}
            />
          </label>
          <label>
            Lab Code
            <input
              placeholder="e.g. DSL-01"
              value={lab.code}
              onChange={(e) => setLab({ ...lab, code: e.target.value })}
            />
          </label>
          <label>
            Parent Department
            <select
              required
              value={lab.department}
              onChange={(e) => setLab({ ...lab, department: e.target.value })}
            >
              {departments.map((x) => (
                <option key={x._id} value={x._id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Facility Location
            <input
              placeholder="e.g. Building A / Floor 2"
              value={lab.location || ''}
              onChange={(e) => setLab({ ...lab, location: e.target.value })}
            />
          </label>
          <label className="span-2">
            Description
            <textarea
              placeholder="Equipment capacity, radiation shielding, temperature control..."
              value={lab.description || ''}
              onChange={(e) => setLab({ ...lab, description: e.target.value })}
            />
          </label>
          <button className="primary span-2" type="submit">
            Save laboratory
          </button>
        </form>
      </Modal>
    </div>
  );
}
