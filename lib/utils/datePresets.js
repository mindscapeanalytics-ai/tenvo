import {
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  startOfYesterday,
  endOfYesterday,
  subMonths,
} from 'date-fns';

export const DATE_RANGE_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: 'mtd', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'ytd', label: 'Year to Date' },
];

export function getDateRangeFromPreset(presetKey, now = new Date()) {
  const end = endOfDay(now);

  switch (presetKey) {
    case 'today':
      return { from: startOfDay(now), to: end };
    case 'yesterday':
      return { from: startOfYesterday(), to: endOfYesterday() };
    case '7d':
      return { from: startOfDay(subDays(now, 6)), to: end };
    case '30d':
      return { from: startOfDay(subDays(now, 29)), to: end };
    case '90d':
      return { from: startOfDay(subDays(now, 89)), to: end };
    case 'mtd':
      return { from: startOfMonth(now), to: end };
    case 'last_month': {
      const prev = subMonths(now, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    case 'ytd':
      return { from: startOfYear(now), to: end };
    default:
      return null;
  }
}

export function isDateRangeEqual(a, b) {
  if (!a?.from || !a?.to || !b?.from || !b?.to) return false;
  return (
    startOfDay(a.from).getTime() === startOfDay(b.from).getTime() &&
    endOfDay(a.to).getTime() === endOfDay(b.to).getTime()
  );
}
