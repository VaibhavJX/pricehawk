import { useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Compass,
  GitCompare,
  Settings,
  Bell,
  Sun,
  Moon,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import useStore from '../store/useStore';
import AddTrackerModal from './AddTrackerModal';
import PriceDropBanner from './PriceDropBanner';
import useWebSocket from '../hooks/useWebSocket';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Layout — main app shell with top nav, sidebar (desktop), bottom tab bar (mobile),
 * notification panel, and page transition wrapper.
 */
const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const clearNotifications = useStore((s) => s.clearNotifications);
  const user = useStore((s) => s.user);

  const [modalOpen, setModalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Connect WebSocket if user is logged in
  useWebSocket(user?.id);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    enter: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      <PriceDropBanner />

      {/* ── Top Navigation Bar ─────────────────────────────── */}
      <header className="sticky top-0 z-40 glass border-b border-[var(--separator)]">
        <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 select-none">
            <span className="text-2xl">🦅</span>
            <span className="font-black text-xl text-gradient-blue">PriceHawk</span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Add Tracker */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setModalOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-ios-blue text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-glow"
            >
              <Plus className="w-4 h-4" />
              Add Tracker
            </motion.button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative w-9 h-9 rounded-full bg-ios-gray-6 dark:bg-ios-gray-1/20 flex items-center justify-center hover:bg-ios-gray-5 transition-colors"
              >
                <Bell className="w-4 h-4 text-[var(--text-primary)]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-ios-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute right-0 top-11 w-80 glass dark:bg-[#1c1c1e]/95 rounded-apple shadow-apple-xl z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
                      <p className="font-bold text-[var(--text-primary)]">Notifications</p>
                      <div className="flex items-center gap-2">
                        {notifications.length > 0 && (
                          <button
                            onClick={clearNotifications}
                            className="text-xs text-ios-red font-medium hover:opacity-70"
                          >
                            Clear all
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)}>
                          <X className="w-4 h-4 text-ios-gray-1" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-8 h-8 text-ios-gray-3 mx-auto mb-2" />
                          <p className="text-sm text-ios-gray-1">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`px-4 py-3 border-b border-[var(--separator)] last:border-none cursor-pointer transition-colors hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/10 ${
                              !n.read ? 'bg-ios-blue/5' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-base flex-shrink-0">
                                {n.type === 'price_drop' ? '📉' : n.type === 'info' ? 'ℹ️' : '🔔'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-[var(--text-primary)]">{n.title}</p>
                                <p className="text-xs text-ios-gray-1 mt-0.5 line-clamp-2">{n.body}</p>
                              </div>
                              {!n.read && (
                                <div className="w-2 h-2 bg-ios-blue rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full bg-ios-gray-6 dark:bg-ios-gray-1/20 flex items-center justify-center hover:bg-ios-gray-5 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-ios-orange" />
              ) : (
                <Moon className="w-4 h-4 text-ios-indigo" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ──────────────────────────────── */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* ── Sidebar (Desktop) ─────────────────────────── */}
        <aside
          className={`hidden md:flex flex-col py-6 border-r border-[var(--separator)] transition-all duration-300 ${
            sidebarCollapsed ? 'w-16 px-2' : 'w-60 px-4'
          }`}
        >
          {/* Nav items */}
          <nav className="flex-1 space-y-1">
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all text-sm ${
                    isActive
                      ? 'bg-ios-blue text-white shadow-glow'
                      : 'text-[var(--text-secondary)] hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/20'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Add tracker sidebar button */}
          {!sidebarCollapsed && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-ios-blue/10 hover:bg-ios-blue/20 text-ios-blue font-semibold text-sm transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Tracker
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="mt-4 flex items-center justify-center w-8 h-8 rounded-full bg-ios-gray-6 dark:bg-ios-gray-1/20 text-ios-gray-1 hover:text-ios-blue transition-colors mx-auto"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </aside>

        {/* ── Page Content ──────────────────────────────── */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.25 }}
              className="h-full"
            >
              <div className="px-4 py-5 max-w-5xl">
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Bottom Tab Bar (Mobile) ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-[var(--separator)] pb-safe">
        <div className="grid grid-cols-5 h-14">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  isActive ? 'text-ios-blue' : 'text-ios-gray-1'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}

          {/* FAB in tab bar center slot */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5"
          >
            <div className="w-10 h-10 bg-ios-blue rounded-full flex items-center justify-center shadow-glow -mt-4">
              <Plus className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-medium text-ios-blue mt-0.5">Add</span>
          </button>
        </div>
      </nav>

      {/* ── Add Tracker Modal ──────────────────────────── */}
      <AddTrackerModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default Layout;
