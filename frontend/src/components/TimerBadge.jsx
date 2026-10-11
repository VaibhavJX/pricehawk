import { useEffect, useRef, useState } from 'react';

/**
 * TimerBadge — shows "Next check in Xm Xs" with an SVG circular progress ring.
 * @param {Date|string} nextCheckAt - ISO date string or Date object for next check time
 * @param {number} intervalMinutes - Check interval in minutes (used to compute full circle duration)
 */
const TimerBadge = ({ nextCheckAt, intervalMinutes = 60 }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [progress, setProgress] = useState(1);
  const intervalRef = useRef(null);

  const RADIUS = 10;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  useEffect(() => {
    const compute = () => {
      const now = Date.now();
      const target = new Date(nextCheckAt).getTime();
      const totalMs = intervalMinutes * 60 * 1000;
      const remaining = target - now;

      if (remaining <= 0) {
        setTimeLeft('Checking...');
        setProgress(0);
        return;
      }

      const fraction = remaining / totalMs;
      setProgress(Math.min(1, Math.max(0, fraction)));

      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);

      if (mins > 0) {
        setTimeLeft(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
      } else {
        setTimeLeft(`${secs}s`);
      }
    };

    compute();
    intervalRef.current = setInterval(compute, 1000);
    return () => clearInterval(intervalRef.current);
  }, [nextCheckAt, intervalMinutes]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ios-gray-6 dark:bg-ios-gray-1/20">
      {/* SVG Ring */}
      <svg width="22" height="22" className="-rotate-90">
        {/* Background track */}
        <circle
          cx="11"
          cy="11"
          r={RADIUS}
          fill="none"
          stroke="rgba(142,142,147,0.3)"
          strokeWidth="2"
        />
        {/* Progress arc */}
        <circle
          cx="11"
          cy="11"
          r={RADIUS}
          fill="none"
          stroke="#007AFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.9s ease' }}
        />
      </svg>
      <span className="text-xs font-medium text-ios-gray-1 dark:text-ios-gray-3 whitespace-nowrap">
        {timeLeft || '—'}
      </span>
    </div>
  );
};

export default TimerBadge;
