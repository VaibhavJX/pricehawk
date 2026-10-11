import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  Briefcase,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { getOpportunities } from '../api/opportunities';
import OpportunityCard from '../components/applypilot/OpportunityCard';

// ─── Filter options ────────────────────────────────────────────────────────────
// These match exactly what the backend returns for eligibility and priority.
const ELIGIBILITY_OPTIONS = ['All', 'Eligible', 'Unclear', 'Not Eligible'];
const PRIORITY_OPTIONS    = ['All', 'HIGH', 'NORMAL', 'LOW'];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-apple p-4 space-y-3">
    <div className="flex justify-between">
      <div className="space-y-1.5 flex-1">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
      <div className="skeleton h-5 w-12 rounded-full" />
    </div>
    <div className="flex gap-2">
      <div className="skeleton h-6 w-20 rounded-full" />
      <div className="skeleton h-6 w-24 rounded-full" />
    </div>
    <div className="flex gap-1.5">
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-5 w-16 rounded-full" />
      <div className="skeleton h-5 w-18 rounded-full" />
    </div>
    <div className="skeleton h-px w-full" />
    <div className="flex justify-between">
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-3 w-28 rounded" />
    </div>
  </div>
);

// ─── Filter pill ──────────────────────────────────────────────────────────────
const FilterPill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
      active
        ? 'bg-ios-blue text-white'
        : 'bg-white border border-gray-200 text-ios-gray-1 hover:border-ios-blue hover:text-ios-blue'
    }`}
  >
    {label === 'All' ? label : label === 'HIGH' ? 'High Priority'
     : label === 'NORMAL' ? 'Normal' : label === 'LOW' ? 'Low' : label}
  </button>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const Opportunities = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // Filter state — we filter on the frontend for quick UX,
  // but the raw data always comes from the backend unchanged.
  const [search,      setSearch]      = useState('');
  const [eligFilter,  setEligFilter]  = useState('All');
  const [prioFilter,  setPrioFilter]  = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOpportunities();
      setOpportunities(data);
    } catch {
      setError('Unable to load opportunities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Client-side filtering — only for display, not for computing eligibility
  const filtered = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesSearch =
        !search ||
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.company.toLowerCase().includes(search.toLowerCase());

      const matchesElig =
        eligFilter === 'All' || opp.eligibility === eligFilter;

      const matchesPrio =
        prioFilter === 'All' || opp.priority === prioFilter;

      return matchesSearch && matchesElig && matchesPrio;
    });
  }, [opportunities, search, eligFilter, prioFilter]);

  const hasActiveFilters = eligFilter !== 'All' || prioFilter !== 'All' || search;

  const clearFilters = () => {
    setSearch('');
    setEligFilter('All');
    setPrioFilter('All');
  };

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <h1 className="text-2xl font-black text-[var(--text-primary)]">
          Opportunities
        </h1>
        <p className="text-ios-gray-1 text-sm mt-0.5">
          {loading
            ? 'Loading...'
            : `${filtered.length} of ${opportunities.length} opportunities`}
        </p>
      </motion.div>

      {/* ── Search + Filter bar ──────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ios-gray-2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or company..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-[var(--text-primary)] placeholder:text-ios-gray-3 focus:outline-none focus:border-ios-blue focus:ring-2 focus:ring-ios-blue/10 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ios-gray-2 hover:text-ios-gray-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((f) => !f)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
            showFilters || hasActiveFilters
              ? 'bg-ios-blue text-white border-ios-blue'
              : 'bg-white border-gray-200 text-ios-gray-1 hover:border-ios-blue hover:text-ios-blue'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && !showFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80" />
          )}
        </button>
      </div>

      {/* ── Filter pills (expandable) ────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 bg-white rounded-xl border border-gray-100 shadow-apple p-4">
              {/* Eligibility */}
              <div>
                <p className="text-xs font-bold text-ios-gray-1 mb-2 uppercase tracking-wide">
                  Eligibility
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ELIGIBILITY_OPTIONS.map((opt) => (
                    <FilterPill
                      key={opt}
                      label={opt}
                      active={eligFilter === opt}
                      onClick={() => setEligFilter(opt)}
                    />
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-bold text-ios-gray-1 mb-2 uppercase tracking-wide">
                  Priority
                </p>
                <div className="flex gap-2 flex-wrap">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <FilterPill
                      key={opt}
                      label={opt}
                      active={prioFilter === opt}
                      onClick={() => setPrioFilter(opt)}
                    />
                  ))}
                </div>
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-ios-red font-semibold hover:opacity-70"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error state ──────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 font-medium flex-1">{error}</p>
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:opacity-70"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* ── Opportunity cards ────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((opp, i) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Briefcase className="w-12 h-12 text-ios-gray-4 mb-4" />
          <h2 className="text-base font-bold text-[var(--text-primary)] mb-1">
            No opportunities found
          </h2>
          <p className="text-sm text-ios-gray-1 max-w-xs">
            {hasActiveFilters
              ? 'Try adjusting your filters or search term.'
              : 'Check back later — new opportunities will appear here.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-ios-blue hover:opacity-70"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      )}

    </div>
  );
};

export default Opportunities;
