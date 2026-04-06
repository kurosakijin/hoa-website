import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/residents', label: 'Residents' },
  { to: '/payments', label: 'Payments' },
  { to: '/admin', label: 'Admin' },
];

function Layout() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:flex-row lg:gap-6 lg:px-6">
        <aside className="glass-panel mb-6 w-full shrink-0 overflow-hidden lg:mb-0 lg:w-72">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">Sitio Hiyas</p>
            <h1 className="mt-3 font-display text-3xl text-white">Homeowners Portal</h1>
            <p className="mt-3 text-sm text-stone-300">
              Manage residents, monitor collections, and operate the HOA from one dashboard.
            </p>
          </div>

          <nav className="space-y-2 px-4 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-2xl px-4 py-3 text-sm transition ${
                    isActive
                      ? 'bg-emerald-400 text-stone-950 shadow-lg shadow-emerald-500/20'
                      : 'text-stone-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mx-4 mb-4 rounded-3xl bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Operations</p>
            <p className="mt-2 text-sm text-stone-200">247 active lots</p>
            <p className="text-sm text-stone-400">Monthly dues and resident records are synced with the admin panel.</p>
          </div>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
