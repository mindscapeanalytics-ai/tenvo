import { describe, expect, it } from 'vitest';
import {
  resolvePosFunctionKey,
  shouldBlockPosHotkey,
  resolvePosHotkeyAction,
} from '@/lib/utils/posHotkeyHelpers';
import { POS_HOTKEY_MAP, nextPosPaymentMethod } from '@/lib/config/posHotkeys';
import { resolvePosVariant } from '@/lib/config/posDomains';

describe('resolvePosFunctionKey', () => {
  it('reads e.key', () => {
    expect(resolvePosFunctionKey({ key: 'F5', code: '' })).toBe('F5');
  });

  it('falls back to e.code', () => {
    expect(resolvePosFunctionKey({ key: 'Unidentified', code: 'F1' })).toBe('F1');
  });

  it('returns null for non-function keys', () => {
    expect(resolvePosFunctionKey({ key: 'Enter', code: 'Enter' })).toBeNull();
  });
});

describe('shouldBlockPosHotkey', () => {
  it('allows scan and number inputs', () => {
    expect(shouldBlockPosHotkey({
      tagName: 'INPUT',
      isContentEditable: false,
      getAttribute: () => 'text',
    })).toBe(false);

    expect(shouldBlockPosHotkey({
      tagName: 'INPUT',
      isContentEditable: false,
      getAttribute: (name) => (name === 'type' ? 'number' : null),
    })).toBe(false);
  });

  it('blocks textarea and password', () => {
    expect(shouldBlockPosHotkey({
      tagName: 'TEXTAREA',
      isContentEditable: false,
      getAttribute: () => null,
    })).toBe(true);

    expect(shouldBlockPosHotkey({
      tagName: 'INPUT',
      isContentEditable: false,
      getAttribute: (name) => (name === 'type' ? 'password' : null),
    })).toBe(true);
  });
});


describe('resolvePosHotkeyAction', () => {
  it('maps F5 to pay via canonical map', () => {
    expect(resolvePosHotkeyAction({ key: 'F5' })).toBe('pay');
    expect(POS_HOTKEY_MAP.F5).toBe('pay');
  });
});

describe('nextPosPaymentMethod', () => {
  it('cycles tender methods', () => {
    expect(nextPosPaymentMethod('cash')).toBe('card');
    expect(nextPosPaymentMethod('split')).toBe('cash');
  });
});

describe('resolvePosVariant aliases', () => {
  it('routes restaurant aliases to restaurant shell', () => {
    expect(resolvePosVariant('restaurant')).toBe('restaurant');
    expect(resolvePosVariant('cafe')).toBe('restaurant');
  });

  it('routes grocery to superstore', () => {
    expect(resolvePosVariant('grocery')).toBe('superstore');
  });
});
