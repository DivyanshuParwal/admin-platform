import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦', title: 'Dashboard', subtitle: 'System overview' },
  { to: '/users', label: 'Users', icon: '◉', title: 'Users', subtitle: 'Manage people across sites' },
  { to: '/sites', label: 'Sites', icon: '⌂', title: 'Sites', subtitle: 'Tenant containers for your users' },
  { to: '/roles', label: 'Roles', icon: '✦', title: 'Roles & Access', subtitle: 'Define what users can do' },
];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';
}

export default function Layout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const active = NAV.find((n) => pathname.startsWith(n.to)) || NAV[0];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">A</span>
          <span>Admin Platform</span>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={false}>
              <span aria-hidden style={{ width: 18, display: 'inline-block' }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          v1.0 · Multi-tenant admin
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{active.title}</h1>
            <p>{active.subtitle}</p>
          </div>
          <div className="topbar-user">
            <div className="user-chip" title={user?.email}>
              <span className="avatar">{initials(user?.name)}</span>
              <span className="meta">
                <strong>{user?.name}</strong>
                <span>
                  {user?.role?.name} · {user?.site?.name}
                </span>
              </span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
