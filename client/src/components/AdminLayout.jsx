import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/residents', label: 'Residents' },
  { to: '/admin/payments', label: 'Payments' },
];

function AdminLayout() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="admin-shell min-h-screen text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-6 lg:px-6">
        <aside className="admin-sidebar hidden xl:flex">
          <div>
            <div className="brand-mark brand-mark--dark">
              <span className="brand-mark__icon" />
              <span>
                <strong>Dashboard X HOA</strong>
                <small>Admin control center</small>
              </span>
            </div>

            <div className="mt-8">
              <input className="admin-search" type="text" placeholder="Search residents, blocks, lots..." />
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
                Manage residents, dues, and homeowner records from one control center.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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
