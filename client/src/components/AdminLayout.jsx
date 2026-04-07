import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { heartbeatAdminChat, setAdminChatOffline } from '../services/api';
import Seo from './Seo';
import ThemeToggleButton from './ThemeToggleButton';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/residents', label: 'Residents' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/chat', label: 'Resident Chat' },
];

function AdminLayout() {
  const { admin, logout, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    heartbeatAdminChat(token).catch(() => {});
    const intervalId = window.setInterval(() => {
      heartbeatAdminChat(token).catch(() => {});
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token]);

  async function handleLogout() {
    if (token) {
      await setAdminChatOffline(token).catch(() => {});
    }

    logout();
    navigate('/hiyas-admin-access');
  }

  return (
    <div className="admin-shell min-h-screen text-slate-100">
      <Seo
        title="Admin Portal"
        description="Internal administration area for Sitio Hiyas Homeowners Association."
        path="/admin"
        robots="noindex,nofollow"
      />
      <div className="mx-auto flex min-h-screen max-w-400 gap-6 px-4 py-6 lg:px-6">
        <aside className="admin-sidebar hidden xl:flex">
          <div>
            <div className="brand-mark brand-mark--dark">
              <span className="brand-mark__icon" />
              <span>
                <strong>Sitio Hiyas HOA</strong>
                <small>Admin control center</small>
              </span>
            </div>

            <nav className="mt-8 space-y-2">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="admin-user-card">
            <p className="text-sm font-semibold text-white">{admin?.name || 'Homeowners Admin'}</p>
            <p className="text-xs text-slate-400">{admin?.username}</p>
            <button type="button" className="action-button action-button--secondary mt-4 w-full" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="surface-card mb-6 flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Admin workspace</p>
              <h1 className="text-2xl font-semibold text-white">Welcome back, {admin?.name || 'Administrator'}</h1>
              <p className="mt-2 text-sm text-slate-400">
                Manage resident records, dues, and property assignments from one control center.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ThemeToggleButton />
              <NavLink to="/" className="action-button action-button--ghost">
                View public site
              </NavLink>
              <button type="button" className="action-button action-button--secondary xl:hidden" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </header>

          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
