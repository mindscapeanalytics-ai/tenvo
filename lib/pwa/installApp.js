/**
 * Lightweight installability helpers — no service worker, no network.
 * Safe for hub UX; never blocks paint or data pipelines.
 */

export const INSTALL_DISMISS_KEY = 'tenvo:pwa-install-dismissed-at';
export const INSTALL_DISMISS_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
export const INSTALL_PROMPT_DELAY_MS = 6500;

export function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    if (window.matchMedia?.('(display-mode: window-controls-overlay)').matches) {
      return true;
    }
    // iOS Safari
    if (typeof navigator !== 'undefined' && navigator.standalone === true) return true;
  } catch {
    return false;
  }
  return false;
}

export function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const notChrome = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return iOS && webkit && notChrome;
}

export function wasInstallDismissedRecently(now = Date.now()) {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(INSTALL_DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return now - at < INSTALL_DISMISS_MS;
  } catch {
    return true;
  }
}

export function dismissInstallPrompt(now = Date.now()) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INSTALL_DISMISS_KEY, String(now));
  } catch {
    // ignore quota / private mode
  }
}

export function shouldOfferInstall({ hasDeferredPrompt = false } = {}) {
  if (typeof window === 'undefined') return false;
  if (isStandaloneDisplay()) return false;
  if (wasInstallDismissedRecently()) return false;
  if (hasDeferredPrompt) return true;
  if (isIosSafari()) return true;
  return false;
}
