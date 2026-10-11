import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Flame,
  ToggleLeft,
  ToggleRight,
  Pause,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Search,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import { getDashboard, getApplications, togglePilot } from '../api/applypilot';

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — Metric Cards  (PRD §4.1 Executive Pipeline Intelligence)
// ─────────────────────────────────────────────────────────────────────────────

const MetricCard = ({ icon: Icon, iconColor, iconBg, label, primary, secondary, badge, badgeColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 28, delay }}
    className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple p-4 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <Icon className="w-4.5 h-4.5" style={{ color: iconColor }} />
      </div>
      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${badgeColor}15`, color: badgeColor }}>
          {badge}
        </span>
      )}
    </div>
    <div>
      <p className="text-3xl font-black text-[var(--text-primary)] leading-none">{primary}</p>
      <p className="text-xs text-ios-gray-1 font-medium mt-1 leading-snug">{label}</p>
      {secondary && (
        <p className="text-xs text-ios-gray-2 mt-0.5">{secondary}</p>
      )}
    </div>
  </motion.div>
);

const MetricCardsRow = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple p-4 space-y-3">
            <div className="skeleton w-9 h-9 rounded-xl" />
            <div className="skeleton h-8 w-16 rounded" />
            <div className="skeleton h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
    );
  }
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Total Pipeline */}
      <MetricCard
        icon={TrendingUp}
        iconColor="#007AFF"
        iconBg="#007AFF18"
        label="Total Pipeline"
        primary={stats.totalPipeline.count}
        secondary={`${stats.totalPipeline.weeklyDelta} · ${stats.totalPipeline.velocity}% velocity`}
        badge="↑ Active"
        badgeColor="#007AFF"
        delay={0.05}
      />
      {/* Eligible & Approved */}
      <MetricCard
        icon={CheckCircle2}
        iconColor="#34C759"
        iconBg="#34C75918"
        label="Eligible & Approved"
        primary={stats.eligibleApproved.count}
        secondary={`${stats.eligibleApproved.sent} sent automatically | ${stats.eligibleApproved.queued} queued`}
        badge="Approved"
        badgeColor="#34C759"
        delay={0.10}
      />
      {/* Action Required */}
      <MetricCard
        icon={AlertTriangle}
        iconColor="#FF9500"
        iconBg="#FF950018"
        label="Action Required"
        primary={stats.actionRequired.count}
        secondary="Needs manual review before dispatch"
        badge="Needs Input"
        badgeColor="#FF9500"
        delay={0.15}
      />
      {/* Excluded */}
      <MetricCard
        icon={XCircle}
        iconColor="#FF3B30"
        iconBg="#FF3B3018"
        label="Excluded / Blocked"
        primary={stats.excluded.count}
        secondary="Filtered by autonomous screening rules"
        badge="Blocked"
        badgeColor="#FF3B30"
        delay={0.20}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — Pilot Engine Control Strip  (PRD §4.2)
// ─────────────────────────────────────────────────────────────────────────────

const PilotEngineStrip = ({ pilot, loading, onToggle }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple p-4">
        <div className="flex items-center gap-4">
          <div className="skeleton w-10 h-6 rounded-full" />
          <div className="skeleton h-4 w-64 rounded" />
          <div className="skeleton h-4 flex-1 rounded" />
        </div>
      </div>
    );
  }
  if (!pilot) return null;

  const quotaPct = Math.round((pilot.dailyQuota.used / pilot.dailyQuota.total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.25 }}
      className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple px-5 py-3.5"
    >
      <div className="flex items-center gap-4 flex-wrap">

        {/* Master Toggle */}
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-shrink-0"
          title={pilot.active ? 'Pause autopilot' : 'Resume autopilot'}
        >
          {pilot.active
            ? <ToggleRight className="w-8 h-8 text-ios-green" />
            : <ToggleLeft  className="w-8 h-8 text-ios-gray-2" />}
          <div>
            <p className={`text-xs font-black tracking-tight ${pilot.active ? 'text-ios-green' : 'text-ios-gray-1'}`}>
              AUTOPILOT {pilot.active ? 'ACTIVE' : 'PAUSED'}
            </p>
            <p className="text-[10px] text-ios-gray-2 font-medium">Click to {pilot.active ? 'pause' : 'resume'}</p>
          </div>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-8 bg-[var(--separator)]" />

        {/* Active Profile */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Zap className="w-3.5 h-3.5 text-ios-blue flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-ios-gray-2 font-medium uppercase tracking-wide">Active Profile</p>
            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{pilot.profile}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px h-8 bg-[var(--separator)]" />

        {/* Daily Quota */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div>
            <p className="text-[10px] text-ios-gray-2 font-medium uppercase tracking-wide mb-1">Daily Quota</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-ios-gray-5 dark:bg-ios-gray-1/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ios-blue rounded-full transition-all duration-500"
                  style={{ width: `${quotaPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[var(--text-primary)] tabular-nums">
                {pilot.dailyQuota.used} / {pilot.dailyQuota.total}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--separator)] text-xs font-semibold text-ios-gray-1 hover:border-ios-orange hover:text-ios-orange transition-colors">
            <Pause className="w-3 h-3" />
            Pause Queue
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--separator)] text-xs font-semibold text-ios-gray-1 hover:border-ios-blue hover:text-ios-blue transition-colors">
            <FileText className="w-3 h-3" />
            Dispatcher Logs
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — Application Table  (PRD §4.3)
// ─────────────────────────────────────────────────────────────────────────────

// Status badge config — maps backend status string to display styles
const STATUS_CONFIG = {
  'Eligible': {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  'Interview Scheduled': {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  'Submitted': {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  'Needs Input': {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  'Not Eligible': {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
};

// Work mode badge colors
const WORK_MODE_CONFIG = {
  'Remote':  { bg: 'bg-green-50',  text: 'text-green-700'  },
  'Hybrid':  { bg: 'bg-purple-50', text: 'text-purple-700' },
  'On-site': { bg: 'bg-blue-50',   text: 'text-blue-700'   },
};

// Match score coloring (display only — value comes from backend)
const matchScoreStyle = (score) => {
  if (score >= 90) return 'bg-green-50 text-green-700';
  if (score >= 75) return 'bg-blue-50 text-blue-700';
  if (score >= 60) return 'bg-amber-50 text-amber-700';
  return 'bg-gray-100 text-gray-500';
};

const StatusBadge = ({ status, detail, atsTarget }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Needs Input'];
  return (
    <div>
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
        {status}
      </span>
      {detail && <p className="text-[10px] text-ios-gray-1 mt-0.5">{detail}</p>}
      {atsTarget && <p className="text-[10px] text-ios-gray-1 mt-0.5">via {atsTarget}</p>}
    </div>
  );
};

const CompanyAvatar = ({ company }) => (
  <div
    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0"
    style={{ background: company.color }}
  >
    {company.initials}
  </div>
);

const ApplicationRow = ({ app, index }) => {
  const workMode = WORK_MODE_CONFIG[app.workMode] ?? WORK_MODE_CONFIG['Remote'];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: index * 0.03 }}
      className="flex items-center gap-4 px-4 py-3 border-b border-[var(--separator)] last:border-none hover:bg-ios-gray-6/50 dark:hover:bg-ios-gray-1/5 transition-colors cursor-default"
    >
      {/* Company */}
      <div className="flex items-center gap-3 w-40 flex-shrink-0">
        <CompanyAvatar company={app.company} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--text-primary)] truncate">{app.company.name}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${workMode.bg} ${workMode.text}`}>
            {app.workMode}
          </span>
        </div>
      </div>

      {/* Role + Location */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{app.title}</p>
        <p className="text-[10px] text-ios-gray-1 flex items-center gap-0.5 mt-0.5">
          <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
          <span className="truncate">{app.location}</span>
        </p>
      </div>

      {/* Compensation */}
      <div className="hidden lg:block w-32 flex-shrink-0 text-right">
        <p className="text-xs font-bold text-[var(--text-primary)]">{app.compensation.base}</p>
        <p className="text-[10px] text-ios-gray-1">{app.compensation.equity}</p>
      </div>

      {/* Match Score */}
      <div className="flex-shrink-0">
        <span className={`text-xs font-black px-2 py-1 rounded-lg tabular-nums ${matchScoreStyle(app.matchScore)}`}>
          {app.matchScore}%
        </span>
      </div>

      {/* Status */}
      <div className="w-36 flex-shrink-0">
        <StatusBadge
          status={app.status}
          detail={app.interviewDetail ?? app.inputReason ?? app.exclusionReason}
          atsTarget={app.atsTarget}
        />
      </div>

      {/* Priority */}
      <div className="flex-shrink-0 w-10 text-center">
        {app.priority === 'HIGH' && (
          <Flame className="w-4 h-4 text-orange-500 mx-auto" title="High Priority" />
        )}
      </div>

      {/* View arrow */}
      <button className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/10 flex items-center justify-center text-ios-gray-2 hover:text-ios-blue transition-colors">
        <ArrowUpRight className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

// Table column header
const TableHeader = () => (
  <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[var(--separator)] bg-ios-gray-6/50 dark:bg-ios-gray-1/5">
    <div className="w-40 flex-shrink-0">
      <p className="text-[10px] font-bold text-ios-gray-2 uppercase tracking-wider">Company</p>
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-bold text-ios-gray-2 uppercase tracking-wider">Role / Location</p>
    </div>
    <div className="hidden lg:block w-32 flex-shrink-0 text-right">
      <p className="text-[10px] font-bold text-ios-gray-2 uppercase tracking-wider">Compensation</p>
    </div>
    <div className="flex-shrink-0 w-12">
      <p className="text-[10px] font-bold text-ios-gray-2 uppercase tracking-wider">Match</p>
    </div>
    <div className="w-36 flex-shrink-0">
      <p className="text-[10px] font-bold text-ios-gray-2 uppercase tracking-wider">Status</p>
    </div>
    <div className="flex-shrink-0 w-10" />
    <div className="flex-shrink-0 w-7" />
  </div>
);

// Segmented control tabs (PRD §4.3 Segmented Filter Tabs)
const TABS = [
  { id: 'all',        label: 'All',         countKey: 'all' },
  { id: 'eligible',   label: 'Eligible',    countKey: 'eligible' },
  { id: 'needsInput', label: 'Needs Input', countKey: 'needsInput' },
  { id: 'interviews', label: 'Interviews',  countKey: 'interviews' },
  { id: 'highPriority',label: 'High Priority', countKey: 'highPriority' },
];

const ApplicationTable = ({ applications, tabCounts, loading }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = applications;

    // Tab filter (display-side only; raw data unchanged)
    if (activeTab === 'eligible')    list = list.filter((a) => a.status === 'Eligible');
    if (activeTab === 'needsInput')  list = list.filter((a) => a.status === 'Needs Input');
    if (activeTab === 'interviews')  list = list.filter((a) => a.status === 'Interview Scheduled');
    if (activeTab === 'highPriority')list = list.filter((a) => a.priority === 'HIGH');

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.company.name.toLowerCase().includes(q)
      );
    }

    return list;
  }, [applications, activeTab, search]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple overflow-hidden">
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-2">
              <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-2 w-1/5 rounded" />
              </div>
              <div className="skeleton h-3 w-20 rounded" />
              <div className="skeleton h-6 w-10 rounded-lg" />
              <div className="skeleton h-5 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.3 }}
      className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple overflow-hidden"
    >
      {/* Table header bar */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--separator)]">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Candidate Pipeline</h2>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ios-gray-2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles or companies..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[var(--separator)] bg-ios-gray-6 dark:bg-ios-gray-1/10 text-[var(--text-primary)] placeholder:text-ios-gray-3 focus:outline-none focus:border-ios-blue focus:ring-2 focus:ring-ios-blue/10 transition-all"
            />
          </div>
        </div>

        {/* Segmented control tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-ios-blue text-white shadow-sm'
                  : 'text-ios-gray-1 hover:bg-ios-gray-6 dark:hover:bg-ios-gray-1/10'
              }`}
            >
              {tab.label}
              {tabCounts && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/25 text-white'
                    : 'bg-ios-gray-5 dark:bg-ios-gray-1/20 text-ios-gray-1'
                }`}>
                  {tabCounts[tab.countKey] ?? 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <TableHeader />
          <AnimatePresence>
            {filtered.length > 0 ? (
              filtered.map((app, i) => (
                <ApplicationRow key={app.id} app={app} index={i} />
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-ios-gray-1">No applications match this filter.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — Right Contextual Drawer  (PRD §4.4)
// ─────────────────────────────────────────────────────────────────────────────

// Audit event type → icon + color
const AUDIT_CONFIG = {
  submitted: { color: '#34C759', label: 'Submitted' },
  scraped:   { color: '#007AFF', label: 'Scraped' },
  flagged:   { color: '#FF9500', label: 'Flagged' },
  filtered:  { color: '#8E8E93', label: 'Filtered' },
};

const MilestonesPanel = ({ milestones, loading }) => (
  <motion.div
    initial={{ opacity: 0, x: 14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.35 }}
    className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple overflow-hidden"
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-ios-blue" />
        <h3 className="text-xs font-bold text-[var(--text-primary)]">Upcoming Milestones</h3>
      </div>
      <button className="text-[10px] font-semibold text-ios-blue hover:opacity-70">
        Sync Calendar →
      </button>
    </div>

    <div className="divide-y divide-[var(--separator)]">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-2.5 w-1/2 rounded" />
                <div className="skeleton h-2.5 w-1/3 rounded" />
              </div>
            </div>
          ))
        : milestones?.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 hover:bg-ios-gray-6/40 dark:hover:bg-ios-gray-1/5 transition-colors group">
              {/* Date badge */}
              <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border border-[var(--separator)] bg-ios-gray-6 dark:bg-ios-gray-1/10">
                <span className="text-[8px] font-bold text-ios-gray-2 uppercase leading-none">
                  {m.date.split(' ')[0]}
                </span>
                <span className="text-sm font-black text-[var(--text-primary)] leading-none">
                  {m.date.split(' ')[1]}
                </span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div
                    className="w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ background: m.companyColor }}
                  />
                  <p className="text-[10px] font-bold text-ios-gray-1">{m.company}</p>
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)] leading-snug">{m.title}</p>
                <p className="text-[10px] text-ios-gray-1 mt-0.5 truncate">{m.host}</p>
                <p className="text-[10px] font-semibold text-ios-blue flex items-center gap-1 mt-1">
                  <Clock className="w-2.5 h-2.5" />
                  {m.time}
                </p>
              </div>

              {/* Launch icon (one-click study room) */}
              <button className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-lg bg-ios-blue flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
    </div>
  </motion.div>
);

const AuditFeedPanel = ({ feed, velocity, loading }) => (
  <motion.div
    initial={{ opacity: 0, x: 14 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.42 }}
    className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[var(--separator)] shadow-apple overflow-hidden"
  >
    {/* Audit Feed header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-ios-green animate-pulse" />
        <h3 className="text-xs font-bold text-[var(--text-primary)]">Live Audit Feed</h3>
      </div>
      <button className="text-[10px] font-semibold text-ios-blue hover:opacity-70">
        View all logs →
      </button>
    </div>

    <div className="divide-y divide-[var(--separator)]">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-2.5 px-4 py-2.5">
              <div className="skeleton w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="skeleton h-2.5 w-full rounded" />
                <div className="skeleton h-2 w-1/4 rounded" />
              </div>
            </div>
          ))
        : feed?.map((event) => {
            const cfg = AUDIT_CONFIG[event.type] ?? AUDIT_CONFIG.filtered;
            return (
              <div key={event.id} className="flex items-start gap-2.5 px-4 py-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: cfg.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--text-primary)] font-medium leading-snug">
                    {event.text}
                  </p>
                  <p className="text-[10px] text-ios-gray-2 mt-0.5">{event.time}</p>
                </div>
              </div>
            );
          })}
    </div>

    {/* Weekly Dispatch Velocity (PRD §4.4) */}
    {velocity && (
      <div className="px-4 py-3 border-t border-[var(--separator)] bg-ios-gray-6/40 dark:bg-ios-gray-1/5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold text-ios-gray-1 uppercase tracking-wide">
            Weekly Dispatch Velocity
          </p>
          <span className="text-[10px] font-bold text-[var(--text-primary)] tabular-nums">
            {velocity.dispatched} / {velocity.cap}
          </span>
        </div>
        <div className="h-1.5 bg-ios-gray-5 dark:bg-ios-gray-1/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-ios-green rounded-full transition-all duration-500"
            style={{ width: `${Math.round((velocity.dispatched / velocity.cap) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-ios-gray-2 mt-1 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-ios-green inline-block" />
          Safe cadence active
        </p>
      </div>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PAGE ROOT — ApplyPilotDashboard
// ─────────────────────────────────────────────────────────────────────────────

const ApplyPilotDashboard = () => {
  const [dashData,      setDashData]      = useState(null);
  const [applications,  setApplications]  = useState([]);
  const [dashLoading,   setDashLoading]   = useState(true);
  const [appsLoading,   setAppsLoading]   = useState(true);
  const [error,         setError]         = useState(null);
  const [pilotActive,   setPilotActive]   = useState(true);

  const loadDash = async () => {
    setDashLoading(true);
    setError(null);
    try {
      const data = await getDashboard();
      setDashData(data);
      setPilotActive(data.pilot.active);
    } catch {
      setError('Unable to load dashboard. Please try again.');
    } finally {
      setDashLoading(false);
    }
  };

  const loadApps = async () => {
    setAppsLoading(true);
    try {
      const data = await getApplications();
      setApplications(data);
    } catch {
      // table falls back to empty state
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    loadDash();
    loadApps();
  }, []);

  const handleTogglePilot = async () => {
    const newState = !pilotActive;
    setPilotActive(newState);                    // Optimistic update
    try {
      await togglePilot(newState);
    } catch {
      setPilotActive(!newState);                 // Revert on failure
    }
  };

  return (
    <div className="p-5 lg:p-6 space-y-5 pb-24 md:pb-6">

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3.5">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex-1">{error}</p>
          <button
            onClick={loadDash}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:opacity-70"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ── 1. Metric Cards ──────────────────────────────────────── */}
      <MetricCardsRow stats={dashData?.stats} loading={dashLoading} />

      {/* ── 2. Pilot Engine Control Strip ───────────────────────── */}
      <PilotEngineStrip
        pilot={dashData ? { ...dashData.pilot, active: pilotActive } : null}
        loading={dashLoading}
        onToggle={handleTogglePilot}
      />

      {/* ── 3 + 4. Table + Right Drawer (side-by-side on lg+) ───── */}
      <div className="flex gap-5 items-start">

        {/* Left: Application Table */}
        <div className="flex-1 min-w-0">
          <ApplicationTable
            applications={applications}
            tabCounts={dashData?.tabCounts}
            loading={appsLoading}
          />
        </div>

        {/* Right: Contextual Drawer */}
        <div className="hidden xl:flex flex-col gap-4 w-72 flex-shrink-0">
          <MilestonesPanel milestones={dashData?.milestones} loading={dashLoading} />
          <AuditFeedPanel
            feed={dashData?.auditFeed}
            velocity={dashData?.weeklyVelocity}
            loading={dashLoading}
          />
        </div>
      </div>

      {/* Right drawer below table on smaller screens */}
      <div className="xl:hidden grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MilestonesPanel milestones={dashData?.milestones} loading={dashLoading} />
        <AuditFeedPanel
          feed={dashData?.auditFeed}
          velocity={dashData?.weeklyVelocity}
          loading={dashLoading}
        />
      </div>

    </div>
  );
};

export default ApplyPilotDashboard;
