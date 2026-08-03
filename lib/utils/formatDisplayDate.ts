/**
 * Safe date formatting for React display — never pass raw Date objects to JSX.
 */

function toDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => unknown }).toDate === 'function') {
    return toDate((value as { toDate: () => unknown }).toDate());
  }
  const d = new Date(value as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDisplayDate(value: unknown, options?: Intl.DateTimeFormatOptions): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, options);
}

export function formatDisplayDateTime(value: unknown, options?: Intl.DateTimeFormatOptions): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleString(undefined, options);
}
