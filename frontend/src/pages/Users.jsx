import { useEffect, useState } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '../components/Icons';

const initialUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'researcher',
  department: '',
  laboratory: '',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [laboratories, setLaboratories] = useState([]);
  const [form, setForm] = useState(initialUserForm);
  const [editUser, setEditUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/users'), api.get('/labs/departments'), api.get('/labs/laboratories')])
      .then(([usersRes, deptsRes, labsRes]) => {
        setUsers(usersRes.data);
        setDepartments(deptsRes.data);
        setLaboratories(labsRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load user records');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    try {
      await api.post('/auth/register', form);
      setMsg(`Account created for ${form.name}`);
      setForm(initialUserForm);
      setCreateOpen(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setError('');
    setMsg('');

    try {
      await api.patch(`/users/${editUser._id}`, {
        name: editUser.name,
        role: editUser.role,
        department: editUser.department || null,
        laboratory: editUser.laboratory || null,
        active: editUser.active,
      });
      setMsg(`User "${editUser.name}" updated successfully.`);
      setEditOpen(false);
      setEditUser(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update user');
    }
  };

  const toggleActive = async (user) => {
    setError('');
    setMsg('');
    try {
      await api.patch(`/users/${user._id}`, { active: !user.active });
      setMsg(`User ${user.name} is now ${!user.active ? 'active' : 'deactivated'}.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to remove or deactivate user "${user.name}"?`)) return;
    setError('');
    setMsg('');
    try {
      const res = await api.delete(`/users/${user._id}`);
      setMsg(res.data.message || 'User deleted');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">ACCESS CONTROL</span>
          <h2>People & Access</h2>
          <p className="muted">
            Manage institutional users, department assignments, role authorization, and account status.
          </p>
        </div>
        <button className="primary" onClick={() => setCreateOpen(true)}>
          <PlusIcon /> New user
        </button>
      </div>

      {msg && <div className="notice">{msg}</div>}
      {error && <div className="error">{error}</div>}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '13px',
            minWidth: '240px',
          }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{
            padding: '9px 12px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '13px',
          }}
        >
          <option value="">All roles</option>
          <option value="researcher">Researcher</option>
          <option value="lab_manager">Lab Manager</option>
          <option value="institution_admin">Institution Admin</option>
        </select>
      </div>

      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Department / Lab</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u._id}>
                <td>
                  <strong>{u.name}</strong>
                  <small>{u.email}</small>
                </td>
                <td>
                  <span className={`status status-${u.role === 'institution_admin' ? 'completed' : u.role === 'lab_manager' ? 'under-review' : 'active'}`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  <span>{u.department?.name || '—'}</span>
                  {u.laboratory && <small>{u.laboratory.name}</small>}
                </td>
                <td>
                  <button
                    onClick={() => toggleActive(u)}
                    className="text-btn"
                    style={{
                      fontSize: '11px',
                      color: u.active ? 'var(--good)' : 'var(--danger)',
                      fontWeight: 700,
                    }}
                    title="Click to toggle account status"
                  >
                    {u.active ? '● Active' : '○ Inactive'}
                  </button>
                </td>
                <td>
                  <small>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </small>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-btn"
                      title="Edit User"
                      onClick={() => {
                        setEditUser({
                          ...u,
                          department: u.department?._id || '',
                          laboratory: u.laboratory?._id || '',
                        });
                        setEditOpen(true);
                      }}
                    >
                      <PencilIcon />
                    </button>
                    <button
                      className="icon-btn"
                      title="Remove User"
                      onClick={() => handleDelete(u)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <div className="loading" style={{ minHeight: '100px' }}>Loading accounts…</div>}
        {!loading && !filtered.length && <div className="empty">No users found.</div>}
      </div>

      {/* Create User Modal */}
      <Modal open={createOpen} title="Create institutional account" onClose={() => setCreateOpen(false)}>
        <form onSubmit={handleCreate} className="form-grid">
          <label>
            Full Name
            <input
              required
              placeholder="e.g. Dr. Alex Mercer"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              placeholder="user@researchflow.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label>
            Temporary Password
            <input
              required
              minLength="8"
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
          <label>
            Role
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="researcher">Researcher</option>
              <option value="lab_manager">Lab Manager</option>
              <option value="institution_admin">Institution Admin</option>
            </select>
          </label>
          <label>
            Department
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            >
              <option value="">None / Unassigned</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code || 'No code'})
                </option>
              ))}
            </select>
          </label>
          <label>
            Laboratory
            <select
              value={form.laboratory}
              onChange={(e) => setForm({ ...form, laboratory: e.target.value })}
            >
              <option value="">None / Unassigned</option>
              {laboratories.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <button className="primary span-2" type="submit">
            Create account
          </button>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={editOpen} title="Edit user profile" onClose={() => setEditOpen(false)}>
        {editUser && (
          <form onSubmit={handleEdit} className="form-grid">
            <label>
              Full Name
              <input
                required
                value={editUser.name}
                onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
              />
            </label>
            <label>
              Email (read-only)
              <input disabled value={editUser.email} />
            </label>
            <label>
              Role
              <select
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                <option value="researcher">Researcher</option>
                <option value="lab_manager">Lab Manager</option>
                <option value="institution_admin">Institution Admin</option>
              </select>
            </label>
            <label>
              Active Status
              <select
                value={editUser.active ? 'true' : 'false'}
                onChange={(e) => setEditUser({ ...editUser, active: e.target.value === 'true' })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive / Suspended</option>
              </select>
            </label>
            <label>
              Department
              <select
                value={editUser.department || ''}
                onChange={(e) => setEditUser({ ...editUser, department: e.target.value })}
              >
                <option value="">None / Unassigned</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.code || 'No code'})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Laboratory
              <select
                value={editUser.laboratory || ''}
                onChange={(e) => setEditUser({ ...editUser, laboratory: e.target.value })}
              >
                <option value="">None / Unassigned</option>
                {laboratories.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary span-2" type="submit">
              Save changes
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
}
