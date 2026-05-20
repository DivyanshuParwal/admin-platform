import { useCallback, useEffect, useState } from 'react';
import api, { extractApiError } from '../api/client';
import EmptyState from '../components/EmptyState.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const PAGE_SIZE = 10;

const emptyForm = {
  name: '',
  slug: '',
  location: '',
  description: '',
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

export default function Sites() {
  const { hasRole } = useAuth();
  const canManage = hasRole('admin');
  const toast = useToast();

  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search, 300);

  const [modal, setModal] = useState({ open: false, mode: 'create', site: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      const { data: res } = await api.get('/sites', { params });
      setData(res);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load sites'));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, toast]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'create', site: null });
  };
  const openEdit = (site) => {
    setForm({
      name: site.name,
      slug: site.slug,
      location: site.location || '',
      description: site.description || '',
      isActive: site.isActive,
    });
    setModal({ open: true, mode: 'edit', site });
  };
  const close = () => setModal({ open: false, mode: 'create', site: null });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        location: form.location.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      };
      if (modal.mode === 'create') {
        await api.post('/sites', payload);
        toast.success('Site created');
      } else {
        await api.patch(`/sites/${modal.site._id}`, payload);
        toast.success('Site updated');
      }
      close();
      fetchSites();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not save site'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (site) => {
    if (!window.confirm(`Delete site "${site.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/sites/${site._id}`);
      toast.success('Site deleted');
      fetchSites();
    } catch (err) {
      toast.error(extractApiError(err, 'Could not delete site'));
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 18 }}>Sites</h2>
          <p>Logical containers that group users together.</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <button className="btn" onClick={openCreate}>+ New site</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <input
            className="input search"
            placeholder="Search sites by name, slug or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Slug</th>
                <th>Location</th>
                <th>Users</th>
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
                      title="No sites yet"
                      description={canManage ? 'Create your first site to start onboarding users.' : 'Ask an admin to set up sites.'}
                      action={canManage ? <button className="btn" onClick={openCreate}>+ New site</button> : null}
                    />
                  </td>
                </tr>
              )}
              {!loading && data.items.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{s.name}</div>
                    {s.description && <div className="muted" style={{ fontSize: 12 }}>{s.description}</div>}
                  </td>
                  <td><code className="badge">{s.slug}</code></td>
                  <td className="muted">{s.location || '—'}</td>
                  <td>
                    {s.userCount ?? 0}
                    <span className="muted" style={{ fontSize: 12 }}> ({s.activeUserCount ?? 0} active)</span>
                  </td>
                  <td>
                    <span className={`badge ${s.isActive ? 'success' : 'danger'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {canManage && (
                    <td className="actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Delete</button>
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

      <Modal open={modal.open} onClose={close} title={modal.mode === 'create' ? 'Create site' : 'Edit site'}>
        <form onSubmit={submit}>
          <div className="form-grid-2">
            <div className="form-row">
              <label>Name</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                maxLength={80}
              />
            </div>
            <div className="form-row">
              <label>Slug</label>
              <input
                className="input"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto from name"
                maxLength={80}
              />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / span 2' }}>
              <label>Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                maxLength={120}
              />
            </div>
            <div className="form-row" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                className="textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={250}
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
            <button type="button" className="btn btn-secondary" onClick={close} disabled={saving}>Cancel</button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Saving…' : modal.mode === 'create' ? 'Create site' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
