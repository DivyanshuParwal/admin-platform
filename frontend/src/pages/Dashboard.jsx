import { useEffect, useState } from 'react';
import api, { extractApiError } from '../api/client';
import BarChart from '../components/BarChart.jsx';
import { useToast } from '../context/ToastContext.jsx';

function StatCard({ label, value, hint, tone }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={tone === 'success' ? { color: 'var(--color-success)' } : undefined}>
        {value}
      </div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/dashboard/summary');
        if (!cancelled) setData(res.data);
      } catch (err) {
        toast.error(extractApiError(err, 'Could not load dashboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="loading-row">
        <span className="spinner" /> Loading dashboard…
      </div>
    );
  }
  if (!data) return null;

  const { counters, usersPerSite, usersPerRole, recentUsers } = data;
  const activeRatio = counters.totalUsers > 0
    ? Math.round((counters.activeUsers / counters.totalUsers) * 100)
    : 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h2 style={{ fontSize: 18 }}>System overview</h2>
          <p>A high-level snapshot of users, sites and access roles.</p>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Users" value={counters.totalUsers} hint={`${activeRatio}% active`} />
        <StatCard label="Active Users" value={counters.activeUsers} hint={`${counters.inactiveUsers} inactive`} tone="success" />
        <StatCard label="Sites" value={counters.totalSites} hint={`${counters.activeSites} active`} />
        <StatCard label="Roles" value={counters.totalRoles} hint="Reusable across users" />
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-header">
            <h2>Users by site</h2>
            <span className="muted" style={{ fontSize: 12 }}>Top {usersPerSite.length}</span>
          </div>
          <div className="card-body">
            <BarChart
              data={usersPerSite.map((s) => ({ name: s.siteName || 'Unassigned', value: s.total }))}
            />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h2>Users by role</h2>
          </div>
          <div className="card-body">
            <BarChart
              data={usersPerRole.map((r) => ({ name: r.roleName || 'Unassigned', value: r.total }))}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Recently added users</h2>
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
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                    No users yet.
                  </td>
                </tr>
              )}
              {recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="muted">{u.email}</td>
                  <td><span className="badge primary">{u.role || '—'}</span></td>
                  <td>{u.site || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'success' : 'danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="muted">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
