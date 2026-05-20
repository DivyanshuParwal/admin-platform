import { useCallback, useEffect, useState } from 'react';
import api, { extractApiError } from '../api/client';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const emptyForm = { name: '', description: '', permissions: [] };

export default function Roles() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');
  const toast = useToast();

  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'create', role: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/roles', { params });
      setRoles(data.items || []);
      setPermissions(data.availablePermissions || []);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load roles'));
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    const id = setTimeout(fetchRoles, 200);
    return () => clearTimeout(id);
  }, [fetchRoles]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'create', role: null });
  };
  const openEdit = (role) => {
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
    });
    setModal({ open: true, mode: 'edit', role });
  };
  const close = () => setModal({ open: false, mode: 'create', role: null });

  const togglePerm = (perm) => {
    setForm((prev) => {
      const has = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: has ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm],
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: form.permissions,
      };
      if (modal.mode === 'create') {
        await api.post('/roles', payload);
        toast.success('Role created');
      } else {
        await api.patch(`/roles/${modal.role._id}`, payload);
        toast.success('Role updated');
      }
      close();
      fetchRoles();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not save role'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await api.delete(`/roles/${role._id}`);
      toast.success('Role deleted');
      fetchRoles();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not delete role'));
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 18 }}>Roles & access</h2>
          <p>Reusable access levels. Assign one to every user.</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <button className="btn" onClick={openCreate}>+ New role</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <input
            className="input search"
            placeholder="Search roles…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Description</th>
                <th>Permissions</th>
                <th>Users</th>
                {canManage && <th></th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={canManage ? 5 : 4}>
                    <div className="loading-row"><span className="spinner" /> Loading…</div>
                  </td>
                </tr>
              )}
              {!loading && roles.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 5 : 4}>
                    <EmptyState
                      title="No roles defined"
                      description="Define at least one role so you can invite users."
                      action={canManage ? <button className="btn" onClick={openCreate}>+ New role</button> : null}
                    />
                  </td>
                </tr>
              )}
              {!loading && roles.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.name}
                      {r.isSystem && <span className="badge">system</span>}
                    </div>
                  </td>
                  <td className="muted">{r.description || '—'}</td>
                  <td>
                    {r.permissions?.length ? (
                      <div className="tag-list">
                        {r.permissions.slice(0, 4).map((p) => (
                          <span key={p} className="badge primary">{p}</span>
                        ))}
                        {r.permissions.length > 4 && (
                          <span className="badge">+{r.permissions.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <span className="muted">No permissions</span>
                    )}
                  </td>
                  <td>{r.userCount ?? 0}</td>
                  {canManage && (
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(r)}>Edit</button>
                      {!r.isSystem && (
                        <>
                          {' '}
                          <button className="btn btn-danger btn-sm" onClick={() => remove(r)}>Delete</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal.open} onClose={close} title={modal.mode === 'create' ? 'Create role' : 'Edit role'}>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              maxLength={50}
              disabled={modal.mode === 'edit' && modal.role?.isSystem}
            />
            {modal.mode === 'edit' && modal.role?.isSystem && (
              <span className="muted" style={{ fontSize: 12 }}>System role name cannot change.</span>
            )}
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={250}
            />
          </div>
          <div className="form-row">
            <label>Permissions</label>
            <div className="permission-grid">
              {permissions.map((p) => (
                <label key={p}>
                  <input
                    type="checkbox"
                    checked={form.permissions.includes(p)}
                    onChange={() => togglePerm(p)}
                  />
                  <code>{p}</code>
                </label>
              ))}
            </div>
            {permissions.length === 0 && <span className="muted">No permission keys available.</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={close} disabled={saving}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : modal.mode === 'create' ? 'Create role' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
