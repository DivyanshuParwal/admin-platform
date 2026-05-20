import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { extractApiError } from '../api/client';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_SIZE = 10;

const emptyForm = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  siteId: '',
  isActive: true,
};

function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export default function Users() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin', 'manager');
  const toast = useToast();

  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);
  const [siteId, setSiteId] = useState('');
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('');

  const [sites, setSites] = useState([]);
  const [roles, setRoles] = useState([]);

  const [modal, setModal] = useState({ open: false, mode: 'create', user: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Load lookup data (sites + roles) once.
  useEffect(() => {
    (async () => {
      try {
        const [sitesRes, rolesRes] = await Promise.all([
          api.get('/sites/all'),
          api.get('/roles'),
        ]);
        setSites(sitesRes.data.items || []);
        setRoles(rolesRes.data.items || []);
      } catch (err) {
        toast.error(extractApiError(err, 'Failed to load lookups'));
      }
    })();
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (siteId) params.siteId = siteId;
      if (roleId) params.roleId = roleId;
      if (status) params.status = status;
      const { data: res } = await api.get('/users', { params });
      setData(res);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load users'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, siteId, roleId, status, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to page 1 whenever a filter changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, siteId, roleId, status]);

  const openCreate = () => {
    setForm({ ...emptyForm, roleId: roles[0]?._id || '', siteId: sites[0]?._id || '' });
    setModal({ open: true, mode: 'create', user: null });
  };

  const openEdit = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      roleId: user.role?._id || '',
      siteId: user.site?._id || '',
      isActive: user.isActive,
    });
    setModal({ open: true, mode: 'edit', user });
  };

  const close = () => setModal({ open: false, mode: 'create', user: null });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await api.post('/users', {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          roleId: form.roleId,
          siteId: form.siteId,
          isActive: form.isActive,
        });
        toast.success('User created');
      } else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          roleId: form.roleId,
          siteId: form.siteId,
          isActive: form.isActive,
        };
        if (form.password) payload.password = form.password;
        await api.patch(`/users/${modal.user._id}`, payload);
        toast.success('User updated');
      }
      close();
      fetchUsers();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not save user'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    try {
      await api.patch(`/users/${user._id}/${action}`);
      toast.success(`User ${action}d`);
      fetchUsers();
    } catch (err) {
      toast.error(extractApiError(err, `Could not ${action} user`));
    }
  };

  const filtersActive = useMemo(
    () => Boolean(search || siteId || roleId || status),
    [search, siteId, roleId, status]
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 18 }}>Users</h2>
          <p>Search and manage users across all sites.</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <button className="btn" onClick={openCreate} disabled={!sites.length || !roles.length}>
              + New user
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <input
            className="input search"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" value={siteId} onChange={(e) => setSiteId(e.target.value)}>
            <option value="">All sites</option>
            {sites.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <select className="select" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            <option value="">All roles</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {filtersActive && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch('');
                setSiteId('');
                setRoleId('');
                setStatus('');
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Site</th>
                <th>Status</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={canManage ? 6 : 5}>
                    <div className="loading-row"><span className="spinner" /> Loading…</div>
                  </td>
                </tr>
              )}
              {!loading && data.items.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 6 : 5}>
                    <EmptyState
                      title="No users match your filters"
                      description={filtersActive ? 'Try clearing some filters.' : 'Get started by creating your first user.'}
                      action={canManage && !filtersActive ? (
                        <button className="btn" onClick={openCreate}>+ New user</button>
                      ) : null}
                    />
                  </td>
                </tr>
              )}
              {!loading && data.items.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{u.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{u.lastLoginAt ? `Last login ${new Date(u.lastLoginAt).toLocaleDateString()}` : 'Never signed in'}</div>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td><span className="badge primary">{u.role?.name || '—'}</span></td>
                  <td>{u.site?.name || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'success' : 'danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                        Edit
                      </button>{' '}
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => toggleActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={data.page || page}
          totalPages={data.totalPages || 1}
          total={data.total || 0}
          onChange={setPage}
        />
      </div>

      <Modal open={modal.open} onClose={close} title={modal.mode === 'create' ? 'Create user' : 'Edit user'}>
        <form onSubmit={submit}>
          <div className="form-grid-2">
            <div className="form-row">
              <label>Full name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                minLength={1}
                maxLength={80}
              />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <label>Site</label>
              <select
                className="select"
                value={form.siteId}
                onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                required
              >
                {sites.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Role</label>
              <select
                className="select"
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                required
              >
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>{modal.mode === 'edit' ? 'New password (optional)' : 'Password'}</label>
              <input
                className="input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                required={modal.mode === 'create'}
                placeholder={modal.mode === 'edit' ? 'Leave blank to keep current' : 'At least 6 characters'}
              />
            </div>
            <div className="form-row">
              <label>Status</label>
              <select
                className="select"
                value={form.isActive ? 'active' : 'inactive'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={close} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : modal.mode === 'create' ? 'Create user' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
