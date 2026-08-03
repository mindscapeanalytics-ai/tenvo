import { describe, it, expect } from 'vitest';
import {
  getDateRangeFromPreset,
  getDefaultDateRange,
  inferDatePresetKey,
  isDateRangeEqual,
} from '../datePresets.js';

describe('datePresets', () => {
  const now = new Date(2026, 6, 15); // mid-month so 7d ≠ mtd

  it('default range matches 30d preset', () => {
    const def = getDefaultDateRange(now);
    const thirty = getDateRangeFromPreset('30d', now);
    expect(isDateRangeEqual(def, thirty)).toBe(true);
  });

  it('infers exact presets without MTD stealing 7d mid-month', () => {
    const seven = getDateRangeFromPreset('7d', now);
    expect(inferDatePresetKey(seven, now)).toBe('7d');
    const mtd = getDateRangeFromPreset('mtd', now);
    expect(inferDatePresetKey(mtd, now)).toBe('mtd');
  });

  it('honors preferKey when 7d and mtd windows collide early in month', () => {
    const day7 = new Date(2026, 6, 7);
    const seven = getDateRangeFromPreset('7d', day7);
    const mtd = getDateRangeFromPreset('mtd', day7);
    expect(isDateRangeEqual(seven, mtd)).toBe(true);
    expect(inferDatePresetKey(seven, day7, '7d')).toBe('7d');
    expect(inferDatePresetKey(mtd, day7, 'mtd')).toBe('mtd');
  });
});
