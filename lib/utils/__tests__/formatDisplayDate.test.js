import { describe, it, expect } from 'vitest';
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/utils/formatDisplayDate';

describe('formatDisplayDate', () => {
  it('formats ISO strings', () => {
    expect(formatDisplayDate('2026-01-15')).toMatch(/2026/);
  });

  it('formats Date objects', () => {
    expect(formatDisplayDate(new Date('2026-01-15T12:00:00Z'))).toMatch(/2026/);
  });

  it('returns em dash for invalid values', () => {
    expect(formatDisplayDate(null)).toBe('—');
    expect(formatDisplayDate(undefined)).toBe('—');
    expect(formatDisplayDate('not-a-date')).toBe('—');
  });
});

describe('formatDisplayDateTime', () => {
  it('formats datetime', () => {
    const out = formatDisplayDateTime(new Date('2026-01-15T14:30:00Z'));
    expect(out).not.toBe('—');
    expect(out.length).toBeGreaterThan(4);
  });
});
