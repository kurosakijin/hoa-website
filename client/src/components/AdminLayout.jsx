import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAdminChatThreads,
  heartbeatAdminChat,
  setAdminChatOffline,
} from '../services/api';
import Seo from './Seo';
import ThemeToggleButton from './ThemeToggleButton';
import { getAdminLoginPath, getPublicSiteUrl } from '../utils/siteHost';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/landing-page', label: 'Landing Page' },
  { to: '/admin/residents', label: 'Residents' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/chat', label: 'Resident Chat' },
];

function AdminLayout() {
  const { admin, logout, token } = useAuth();
  const navigate = useNavigate();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const previousUnreadCountRef = useRef(null);
  const notificationPermissionRequestedRef = useRef(false);

  async function refreshChatUnread({ notify = false } = {}) {
    if (!token) {
      return;
    }

    try {
      const data = await getAdminChatThreads(token);
      const unreadCount = data.threads.reduce(
        (sum, thread) => sum + (Number(thread.unreadForAdmin) || 0),
        0
      );

      setChatUnreadCount(unreadCount);

      const previousUnreadCount = previousUnreadCountRef.current;
      const canNotify =
        notify &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted';

      if (canNotify && unreadCount > 0) {
        if (previousUnreadCount === null || unreadCount > previousUnreadCount) {
          const latestThread = data.threads.find((thread) => thread.unreadForAdmin > 0) || data.threads[0];
          new window.Notification('Resident chat update', {
            body:
              previousUnreadCount === null
                ? `You have ${unreadCount} unread resident message${unreadCount === 1 ? '' : 's'}.`
                : `${latestThread?.residentName || 'A resident'} sent a new message.`,
          });
        }
      }

      previousUnreadCountRef.current = unreadCount;
    } catch (_error) {
      setChatUnreadCount(0);
    }
  }

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification.permission === 'default' &&
      !notificationPermissionRequestedRef.current
    ) {
      notificationPermissionRequestedRef.current = true;
      window.Notification.requestPermission().catch(() => {});
    }

    heartbeatAdminChat(token).catch(() => {});
    refreshChatUnread({ notify: true });

    const intervalId = window.setInterval(() => {
      heartbeatAdminChat(token).catch(() => {});
      refreshChatUnread({ notify: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [token]);

  async function handleLogout() {
    if (token) {
      await setAdminChatOffline(token).catch(() => {});
    }

    logout();
    navigate(getAdminLoginPath());
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
                  <span className="sidebar-link__content">
                    <span>{item.label}</span>
                    {item.to === '/admin/chat' && chatUnreadCount ? (
                      <strong className="sidebar-link__badge">{chatUnreadCount}</strong>
                    ) : null}
                  </span>
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
              <a href={getPublicSiteUrl('/') || '/'} className="action-button action-button--ghost">
                View public site
              </a>
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
