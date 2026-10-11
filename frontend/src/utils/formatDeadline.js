/**
 * formatDeadline
 * Converts an ISO datetime string from the backend into a human-readable
 * countdown string like "4h 32m" or "2d 14h" or "Expired".
 *
 * We display what the backend gives us — we don't compute eligibility or
 * priority from this value.
 */
export const formatDeadline = (isoString) => {
  if (!isoString) return 'No deadline';

  const now = Date.now();
  const target = new Date(isoString).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) return 'Expired';

  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (totalDays >= 1) {
    const remainingHours = totalHours % 24;
    return remainingHours > 0
      ? `${totalDays}d ${remainingHours}h`
      : `${totalDays}d`;
  }

  if (totalHours >= 1) {
    const remainingMinutes = totalMinutes % 60;
    return remainingMinutes > 0
      ? `${totalHours}h ${remainingMinutes}m`
      : `${totalHours}h`;
  }

  return `${totalMinutes}m`;
};
