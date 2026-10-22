import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  Squares2X2Icon,
  BeakerIcon,
  CpuChipIcon,
  CalendarDaysIcon,
  CircleStackIcon,
  ChartBarIcon,
  UsersIcon,
  BellIcon,
  BuildingOffice2Icon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  CheckIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
} from '../components/Icons';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket, useSocketConnection } from '../hooks/useSocket';
import CommandPalette from '../components/CommandPalette';

const commonLinks = [['/', 'Dashboard', Squares2X2Icon]];
const mainLinks = [
  ['/experiments', 'Experiments', BeakerIcon],
  ['/equipment', 'Equipment', CpuChipIcon],
  ['/reservations', 'Schedule', CalendarDaysIcon],
  ['/datasets', 'Datasets', CircleStackIcon],
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const live = useSocketConnection();

  const loadNotifications = () => {
    api
      .get('/notifications')
      .then((r) => setNotifications(r.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useSocket({
    'notification:new': (payload) => {
      loadNotifications();
      addToast({
        title: 'New Notification',
        message: 'You have a new institutional notification.',
        type: 'info',
      });
    },
    'notification:read': loadNotifications,
    'notification:all-read': loadNotifications,
    'reservation:changed': (payload) => {
      loadNotifications();
      addToast({
        title: 'Schedule Change',
        message: `Reservation status updated to ${payload?.status || 'Active'}.`,
        type: 'info',
      });
    },
    'experiment:updated': (payload) => {
      addToast({
        title: 'Experiment Updated',
        message: `Experiment status shifted to ${payload?.status || 'Updated'}.`,
        type: 'info',
      });
    },
    'dataset:uploaded': (payload) => {
      addToast({
        title: 'New Detector Dataset',
        message: `Dataset "${payload?.name || 'run.csv'}" was catalogued.`,
        type: 'success',
      });
    },
  });

  const unreadCount = notifications.filter((x) => !x.read).length;

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      await loadNotifications();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      await loadNotifications();
    } catch {}
  };

  const navItems = [
    ...commonLinks,
    ...mainLinks,
    ...(user.role !== 'researcher' ? [['/analytics', 'Intelligence', ChartBarIcon]] : []),
    ...(user.role === 'institution_admin'
      ? [
          ['/users', 'People', UsersIcon],
          ['/labs', 'Institution', BuildingOffice2Icon],
          ['/audit', 'Audit Trail', ShieldCheckIcon],
        ]
      : []),
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span>ResearchFlow</span>
        </div>
        <div className="role-chip">{user.role.replace('_', ' ')}</div>

        <nav>
          {navItems.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => (isActive ? 'nav active' : 'nav')}
            >
              <Icon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav" onClick={toggle} title="Toggle Dark/Light Mode">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <button className="nav" onClick={logout} title="Sign out of ResearchFlow">
            <ArrowRightOnRectangleIcon />
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">RESEARCH OPERATIONS</span>
            <h1>
              Good{' '}
              {new Date().getHours() < 12
                ? 'morning'
                : new Date().getHours() < 17
                ? 'afternoon'
                : 'evening'}
              , {user.name.split(' ')[1] || user.name}
            </h1>
          </div>

          <div className="top-actions">
            {/* Quick Command Palette Trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--muted)',
                fontSize: '13px',
                cursor: 'pointer',
              }}
              title="Search anything (Ctrl+K)"
            >
              <MagnifyingGlassIcon style={{ width: 16, height: 16 }} />
              <span>Search...</span>
              <kbd
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  background: 'var(--surface2)',
                  padding: '2px 5px',
                  borderRadius: '4px',
                }}
              >
                Ctrl K
              </kbd>
            </button>

            <span className="live-indicator">
              <i style={{ background: live ? 'var(--good)' : 'var(--muted)' }} />{' '}
              {live ? 'LIVE' : 'CONNECTING'}
            </span>

            <button
              className="icon-btn"
              onClick={() => setOpen((x) => !x)}
              aria-label="Notifications"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <i className="notification-dot">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </i>
              )}
            </button>

            <div className="avatar">
              {user.name
                .split(' ')
                .map((x) => x[0])
                .slice(0, 2)
                .join('')}
            </div>
          </div>
        </header>

        {open && (
          <div className="notification-popover card">
            <div className="section-head">
              <div>
                <h3>Notifications</h3>
                <p>{unreadCount} unread</p>
              </div>
              {unreadCount > 0 && (
                <button className="text-btn" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length ? (
              notifications.slice(0, 12).map((x) => (
                <button
                  key={x._id}
                  className={`notification-item ${x.read ? 'read' : ''}`}
                  onClick={() => !x.read && markRead(x._id)}
                >
                  <span>
                    <strong>{x.title}</strong>
                    <small>{x.message}</small>
                    <em>{new Date(x.createdAt).toLocaleString()}</em>
                  </span>
                  {!x.read && <CheckIcon />}
                </button>
              ))
            ) : (
              <p className="muted">You're all caught up.</p>
            )}
          </div>
        )}

        <section className="content">
          <Outlet />
        </section>
      </main>

      {/* Global Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
