import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, CheckCircle2, Circle, AlertCircle, Flame } from 'lucide-react';
import { formatDeadline } from '../../utils/formatDeadline';

// ─── Eligibility badge ────────────────────────────────────────────────────────
// Maps the backend's eligibility string to a colour + icon.
// We never derive eligibility ourselves — we just display what the backend says.
const ELIGIBILITY_CONFIG = {
  Eligible: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    dot: 'bg-green-500',
  },
  Unclear: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  'Not Eligible': {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    dot: 'bg-red-400',
  },
};

const EligibilityBadge = ({ status }) => {
  const cfg = ELIGIBILITY_CONFIG[status] ?? ELIGIBILITY_CONFIG['Unclear'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

// ─── Skill chip ───────────────────────────────────────────────────────────────
const SkillChip = ({ name, met }) => (
  <span
    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
      met
        ? 'bg-green-50 text-green-700'
        : 'bg-gray-100 text-gray-400'
    }`}
  >
    {met ? (
      <CheckCircle2 className="w-3 h-3" />
    ) : (
      <Circle className="w-3 h-3" />
    )}
    {name}
  </span>
);

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * OpportunityCard
 * Displays a single opportunity. Receives all data from the backend via props.
 * Does NOT compute matchScore, eligibility, or priority itself.
 *
 * Props:
 *   opportunity: {
 *     id, title, company, matchScore, eligibility,
 *     priority, deadline, skills
 *   }
 *   index: number  — used for staggered animation delay
 *   compact: bool  — when true, hides skills (used in Dashboard high-priority section)
 */
const OpportunityCard = ({ opportunity, index = 0, compact = false }) => {
  const navigate = useNavigate();
  const {
    id,
    title,
    company,
    matchScore,
    eligibility,
    priority,
    deadline,
    skills = [],
  } = opportunity;

  const isHighPriority = priority === 'HIGH';
  const deadlineText = formatDeadline(deadline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 28,
        delay: index * 0.05,
      }}
      className="bg-white rounded-xl border border-gray-100 shadow-apple hover:shadow-apple-lg transition-shadow duration-200 p-4 flex flex-col gap-3"
    >
      {/* ── Row 1: Title + Priority indicator ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-[var(--text-primary)] text-sm leading-snug truncate">
            {title}
          </h3>
          <p className="text-xs text-ios-gray-1 mt-0.5 truncate">{company}</p>
        </div>

        {isHighPriority && (
          <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100">
            <Flame className="w-2.5 h-2.5" />
            HIGH
          </span>
        )}
      </div>

      {/* ── Row 2: Eligibility + Match score ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <EligibilityBadge status={eligibility} />

        <span className="text-xs font-semibold text-ios-blue bg-ios-blue/8 px-2.5 py-1 rounded-full">
          {matchScore.toFixed(1)}% Match
        </span>
      </div>

      {/* ── Row 3: Skills (hidden in compact mode) ── */}
      {!compact && skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <SkillChip key={skill.name} name={skill.name} met={skill.met} />
          ))}
        </div>
      )}

      {/* ── Row 4: Deadline + CTA ── */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-auto">
        <span className="flex items-center gap-1 text-xs text-ios-gray-1 font-medium">
          <Clock className="w-3.5 h-3.5" />
          {deadlineText}
        </span>

        <button
          onClick={() => navigate(`/opportunities/${id}`)}
          className="flex items-center gap-1 text-xs font-semibold text-ios-blue hover:text-ios-indigo transition-colors"
        >
          View Opportunity
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

export default OpportunityCard;
