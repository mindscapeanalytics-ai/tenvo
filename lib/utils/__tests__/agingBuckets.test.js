import { describe, it, expect } from 'vitest';
import { bucketAgingRows, toAgingAsOfDate } from '../agingBuckets.js';

describe('agingBuckets', () => {
  it('buckets outstanding balance into exclusive age ranges', () => {
    const { items, summary, count } = bucketAgingRows([
      { id: 'a', balance: 100, days_overdue: 0 },
      { id: 'b', balance: 50, days_overdue: 15 },
      { id: 'c', balance: 25, days_overdue: 45 },
      { id: 'd', balance: 10, days_overdue: 75 },
      { id: 'e', balance: 5, days_overdue: 120 },
    ]);

    expect(count).toBe(5);
    expect(summary.total_balance).toBe(190);
    expect(summary.total_current).toBe(100);
    expect(summary.total_1_30).toBe(50);
    expect(summary.total_31_60).toBe(25);
    expect(summary.total_61_90).toBe(10);
    expect(summary.total_over_90).toBe(5);

    expect(items[0].current_amount).toBe(100);
    expect(items[0].days_1_30).toBe(0);
    expect(items[1].days_1_30).toBe(50);
    expect(items[1].current_amount).toBe(0);
  });

  it('never puts balance into more than one bucket', () => {
    const { items } = bucketAgingRows([{ balance: 80, days_overdue: 30 }]);
    const row = items[0];
    const filled = [
      row.current_amount,
      row.days_1_30,
      row.days_31_60,
      row.days_61_90,
      row.days_over_90,
    ].filter((v) => v > 0);
    expect(filled).toEqual([80]);
  });

  it('normalizes as-of dates', () => {
    expect(toAgingAsOfDate('2026-07-18T12:00:00.000Z')).toBe('2026-07-18');
    expect(toAgingAsOfDate(new Date('2026-01-05T00:00:00.000Z'))).toBe('2026-01-05');
  });
});
