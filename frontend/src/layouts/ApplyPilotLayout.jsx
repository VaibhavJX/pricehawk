import { useState } from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Rss,
  Zap,
  BarChart2,
  Settings,
  Bell,
  Sun,
  Moon,
  Plus,
  Search,
  ChevronRight,
  Command,
  X,
} from 'lucide-react';
import useStore from '../store/useStore';

// ─── Navigation items (PRD §3.1 Persistent Left Workspace Sidebar) ────────────
const NAV_ITEMS = [
  { path: '/',            label: 'Dashboard',       icon: LayoutDashboard, exact: true },
  { path: '/applications',label: 'Applications',    icon: Briefcase },
  { path: '/match-feed',  label: 'Match Feed',      icon: Rss },
  { path: '/auto-apply',  label: 'Auto-Apply Queue',icon: Zap },
  { path: '/analytics',   label: 'Analytics',       icon: BarChart2 },
];

// ─── macOS Traffic Light Dots (PRD §3.1 Window control cues) ─────────────────
const TrafficLights = () => (
  <div className="flex items-center gap-1.5 select-none">
    <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]" title="Close" />
    <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D4A017]" title="Minimize" />
    <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1DAD2B]" title="Maximize" />
  </div>
);

// ─── ApplyPilot Layout ────────────────────────────────────────────────────────
const ApplyPilotLayout = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const theme     = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const user      = useStore((s) => s.user);
  const notifications = useStore((s) => s.notifications);

  const [notifOpen,  setNotifOpen]  = useState(false);
  const [cmdOpen,    setCmdOpen]    = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  // Determine active nav item (exact match for '/', prefix match for others)
  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">

      {/* ── Top Command Bar (PRD §3.1 Top Command Bar) ──────────── */}
      <header className="h-12 flex-shrink-0 flex items-center px-4 gap-4 bg-white dark:bg-[#1c1c1e] border-b border-[var(--separator)] z-40">

        {/* Left: macOS dots + Brand */}
        <div className="flex items-center gap-4 min-w-[220px]">
          <TrafficLights />
          <Link to="/" className="flex items-center gap-2 select-none">
            <div className="w-6 h-6 bg-ios-blue rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-black">AP</span>
            </div>
            <span className="font-black text-sm text-[var(--text-primary)] tracking-tight">
              ApplyPilot
            </span>
          </Link>
        </div>

        {/* Center: Campaign switcher badge */}
        <div className="flex-1 flex items-center justify-center">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ios-gray-6 dark:bg-ios-gray-1/10 hover:bg-ios-gray-5 dark:hover:bg-ios-gray-1/20 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-ios-green animate-pulse" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              Design Lead Search
            </span>
            <span className="text-[10px] font-medium text-ios-gray-1 border border-ios-gray-4 rounded px-1">
              Active Campaign
            </span>
            <ChevronRight className="w-3 h-3 text-ios-gray-2" />
          </button>
        </div>

        {/* Right: ⌘K + CTA + Bell + Theme + Avatar */}
        <div className="flex items-center gap-2 min-w-[220px] justify-end">

          {/* Command Palette hint */}
          <button
            onClick={() => setCmdOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ios-gray-6 dark:bg-ios-gray-1/10 text-xs text-ios-gray-1 hover:bg-ios-gray-5 dark:hover:bg-ios-gray-1/20 transition-colors"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
            <span className="text-ios-gray-3 ml-1">Search anything...</span>
          </button>

          {/* New Application CTA */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/applications')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ios-blue text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Application</span>
          </motion.button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-8 h-8 rounded-lg bg-ios-gray-6 dark:bg-ios-gray-1/10 flex items-center justify-center hover:bg-ios-gray-5 transition-colors"
            >
              <Bell className="w-4 h-4 text-[var(--text-primary)]" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-ios-red text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute right-0 top-10 w-72 bg-white dark:bg-[#1c1c1e] rounded-xl border border-[var(--separator)] shadow-apple-xl z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
                    <p className="text-sm font-bold text-[var(--text-primary)]">Notifications</p>
                    <button onClick={() => setNotifOpen(false)}>
                      <X className="w-4 h-4 text-ios-gray-1" />
                    </button>
                  </div>
                  <div className="py-8 text-center">
                    <Bell className="w-6 h-6 text-ios-gray-3 mx-auto mb-2" />
                    <p className="text-xs text-ios-gray-1">No new notifications</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-ios-gray-6 dark:bg-ios-gray-1/10 flex items-center justify-center hover:bg-ios-gray-5 transition-colors"
          >
            {theme === 'dark'
              ? <Sun  className="w-4 h-4 text-ios-orange" />
              : <Moon className="w-4 h-4 text-ios-indigo" />}
          </button>

          {/* Profile Avatar */}
          <button className="w-8 h-8 rounded-full bg-ios-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0 hover:opacity-90 transition-opacity">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
          </button>
        </div>
      </header>

      {/* ── Body: Sidebar + Main Content ─────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Persistent Left Workspace Sidebar (PRD §3.1) ───────── */}
        <aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-white dark:bg-[#1c1c1e] border-r border-[var(--separator)] overflow-y-auto">

          {/* Workspace Nav */}
          <div className="flex-1 px-3 py-4">
            <p className="text-[10px] font-bold text-ios-gray-2 uppercase tracking-widest px-2 mb-2">
              Workspace
            </p>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
                const active = isActive({ path, exact });
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-ios-blue text-white shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Preferences + API Quota (PRD §3.1 Preferences section) */}
          <div className="px-3 py-4 border-t border-[var(--separator)] space-y-4">
            <p className="text-[10px] font-bold text-ios-gray-2 uppercase tracking-widest px-2">
              Account
            </p>

            <Link
              to="/settings"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/10 transition-colors"
            >
              <Settings className="w-4 h-4" strokeWidth={1.8} />
              Preferences
            </Link>

            {/* API Quota Telemetry */}
            <div className="px-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ios-gray-1 font-medium">API Quota</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">84%</span>
              </div>
              <div className="h-1.5 bg-ios-gray-5 dark:bg-ios-gray-1/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ios-blue rounded-full transition-all duration-500"
                  style={{ width: '84%' }}
                />
              </div>
              <p className="text-[10px] text-ios-gray-2">4,200 / 5,000 runs</p>
            </div>
          </div>
        </aside>

        {/* ── Main Page Content (Outlet) ───────────────────────────── */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── ⌘K Command Palette Overlay ──────────────────────────────── */}
      <AnimatePresence>
        {cmdOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-white dark:bg-[#1c1c1e] rounded-2xl shadow-apple-xl border border-[var(--separator)] overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--separator)]">
                <Search className="w-4 h-4 text-ios-gray-1 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search roles, companies, audit events..."
                  className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none placeholder:text-ios-gray-3"
                />
                <button
                  onClick={() => setCmdOpen(false)}
                  className="text-[10px] font-semibold text-ios-gray-1 border border-ios-gray-4 rounded px-1.5 py-0.5"
                >
                  ESC
                </button>
              </div>
              <div className="py-8 text-center">
                <p className="text-sm text-ios-gray-1">Start typing to search the pipeline...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#1c1c1e] border-t border-[var(--separator)] pb-safe">
        <div className="grid grid-cols-5 h-14">
          {NAV_ITEMS.map(({ path, label, icon: Icon, exact }) => {
            const active = isActive({ path, exact });
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-ios-blue' : 'text-ios-gray-1'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.8} />
                <span className="text-[9px] font-medium truncate px-1">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ApplyPilotLayout;
