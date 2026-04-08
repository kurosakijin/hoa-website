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

function getIsPhoneAdminExperience() {
  if (typeof window === 'undefined') {
    return false;
  }

  const isNarrowViewport = window.matchMedia('(max-width: 820px)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const mobileUserAgent =
    navigator.userAgentData?.mobile ??
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return Boolean(mobileUserAgent || (isNarrowViewport && isCoarsePointer));
}

function AdminLayout() {
  const { admin, logout, token } = useAuth();
  const navigate = useNavigate();
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [isPhoneExperience, setIsPhoneExperience] = useState(getIsPhoneAdminExperience);
  const previousUnreadCountRef = useRef(null);
  const notificationPermissionRequestedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const viewportQuery = window.matchMedia('(max-width: 820px)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const updatePhoneExperience = () => {
      setIsPhoneExperience(getIsPhoneAdminExperience());
    };
    const addMediaListener = (query) => {
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', updatePhoneExperience);
        return () => query.removeEventListener('change', updatePhoneExperience);
      }

      query.addListener(updatePhoneExperience);
      return () => query.removeListener(updatePhoneExperience);
    };

    updatePhoneExperience();
    const removeViewportListener = addMediaListener(viewportQuery);
    const removeCoarsePointerListener = addMediaListener(coarsePointerQuery);

    return () => {
      removeViewportListener();
      removeCoarsePointerListener();
    };
  }, []);

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

    if (isPhoneExperience) {
      setChatUnreadCount(0);
      previousUnreadCountRef.current = null;
      setAdminChatOffline(token).catch(() => {});
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
  }, [token, isPhoneExperience]);

  async function handleLogout() {
    if (token) {
      await setAdminChatOffline(token).catch(() => {});
    }

    logout();
    navigate(getAdminLoginPath());
  }

  if (isPhoneExperience) {
    return (
      <div className="admin-shell min-h-screen text-slate-100">
        <Seo
          title="Admin Portal"
          description="Internal administration area for Sitio Hiyas Homeowners Association."
          path="/admin"
          robots="noindex,nofollow"
        />
        <div className="admin-mobile-block">
          <div className="admin-mobile-block__card">
            <div className="brand-mark brand-mark--dark">
              <span className="brand-mark__icon" />
              <span>
                <strong>Sitio Hiyas HOA</strong>
                <small>Admin control center</small>
              </span>
            </div>

            <p className="eyebrow">Desktop required</p>
            <h1>This admin UI is not available on phone.</h1>
            <p className="admin-mobile-block__message">
              Please use a PC or computer to manage resident records, payments, landing page content, and resident chat.
            </p>

            <div className="admin-mobile-block__actions">
              <a href={getPublicSiteUrl('/') || '/'} className="action-button action-button--ghost">
                View public site
              </a>
              <button type="button" className="action-button action-button--secondary" onClick={handleLogout}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

        <div className="admin-shell__main flex-1">
          <header className="admin-shell__header surface-card mb-4 flex flex-col gap-4 p-5 lg:mb-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="eyebrow">Admin workspace</p>
              <h1 className="text-2xl font-semibold text-white">Welcome back, {admin?.name || 'Administrator'}</h1>
              <p className="mt-2 text-sm text-slate-400">
                Manage resident records, dues, and property assignments from one control center.
              </p>
            </div>

            <div className="admin-shell__header-actions">
              <ThemeToggleButton compact />
              <a href={getPublicSiteUrl('/') || '/'} className="action-button action-button--ghost admin-shell__header-link">
                View public site
              </a>
              <button
                type="button"
                className="action-button action-button--secondary admin-shell__header-link xl:hidden"
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </header>

          <nav className="admin-shell__mobile-nav xl:hidden" aria-label="Admin sections">
            <div className="admin-shell__mobile-nav-track">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `admin-mobile-link ${isActive ? 'admin-mobile-link--active' : ''}`
                  }
                >
                  <span>{item.label}</span>
                  {item.to === '/admin/chat' && chatUnreadCount ? (
                    <strong className="admin-mobile-link__badge">{chatUnreadCount}</strong>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </nav>

          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
