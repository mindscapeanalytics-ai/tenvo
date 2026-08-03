/**
 * Intelligent WhatsApp chat open for hub reminders.
 *
 * Prefer the native app deep link (skips the wa.me browser landing page when
 * WhatsApp Desktop / mobile app is installed). Fall back to https://wa.me
 * if the app does not take focus. Messages are still confirmed with Send in
 * WhatsApp — Meta does not allow silent auto-send from the browser.
 */

/**
 * @param {string | null | undefined} url
 * @returns {{ phone: string, text: string, webUrl: string } | null}
 */
export function parseWhatsAppWebUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return null;

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'wa.me' && host !== 'api.whatsapp.com') return null;

    let phone = '';
    if (host === 'wa.me') {
      phone = u.pathname.replace(/^\//, '').replace(/\D/g, '');
    } else {
      phone = String(u.searchParams.get('phone') || '').replace(/\D/g, '');
    }
    if (!phone) return null;

    const text = u.searchParams.get('text') || '';
    const webUrl =
      text.length > 0
        ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
        : `https://wa.me/${phone}`;

    return { phone, text, webUrl };
  } catch {
    return null;
  }
}

/**
 * Native app protocol URL (Desktop / mobile WhatsApp).
 * @param {string} phoneDigits
 * @param {string} [text]
 */
export function buildWhatsAppAppUrl(phoneDigits, text = '') {
  const phone = String(phoneDigits || '').replace(/\D/g, '');
  if (!phone) return null;
  const q = new URLSearchParams();
  q.set('phone', phone);
  const body = String(text || '');
  if (body) q.set('text', body);
  return `whatsapp://send?${q.toString()}`;
}

/**
 * @param {string | null | undefined} webOrAppUrl
 */
export function toWhatsAppAppUrlFromWeb(webOrAppUrl) {
  const raw = String(webOrAppUrl || '').trim();
  if (!raw) return null;
  if (raw.startsWith('whatsapp://')) return raw;
  const parsed = parseWhatsAppWebUrl(raw);
  if (!parsed) return null;
  return buildWhatsAppAppUrl(parsed.phone, parsed.text);
}

function isLikelyMobileUa(ua = '') {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    String(ua)
  );
}

/**
 * Trigger a custom-protocol navigation without leaving the hub SPA.
 * @param {string} appUrl
 */
function invokeWhatsAppProtocol(appUrl) {
  if (typeof document === 'undefined') return false;
  try {
    const a = document.createElement('a');
    a.href = appUrl;
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    try {
      // Last resort for older engines
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'display:none;width:0;height:0;border:0';
      iframe.src = appUrl;
      document.body.appendChild(iframe);
      setTimeout(() => iframe.remove(), 2000);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Open WhatsApp chat intelligently.
 * @param {string | null | undefined} webUrl https://wa.me/... (preferred input from server)
 * @param {{
 *   preferApp?: boolean,
 *   fallbackDelayMs?: number,
 * }} [opts]
 * @returns {{ ok: boolean, mode: 'app' | 'web' | 'none', appUrl?: string | null, webUrl?: string | null }}
 */
export function openWhatsAppSmart(webUrl, opts = {}) {
  if (typeof window === 'undefined') {
    return { ok: false, mode: 'none', webUrl: webUrl || null };
  }

  const preferApp = opts.preferApp !== false;
  const fallbackDelayMs = Math.max(600, Number(opts.fallbackDelayMs) || 1400);
  const parsed = parseWhatsAppWebUrl(webUrl);
  const httpsUrl = parsed?.webUrl || String(webUrl || '').trim();
  if (!httpsUrl) return { ok: false, mode: 'none' };

  const appUrl = preferApp ? toWhatsAppAppUrlFromWeb(httpsUrl) : null;
  const mobile = isLikelyMobileUa(navigator.userAgent || '');

  // No app URL parseable — classic web tab.
  if (!appUrl) {
    window.open(httpsUrl, '_blank', 'noopener,noreferrer');
    return { ok: true, mode: 'web', webUrl: httpsUrl, appUrl: null };
  }

  // Mobile: deep link usually opens the WhatsApp app directly.
  // Keep a short wa.me fallback if the protocol handler is missing.
  if (mobile) {
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    document.addEventListener('visibilitychange', cancel, { once: true });
    window.addEventListener('pagehide', cancel, { once: true });
    invokeWhatsAppProtocol(appUrl);
    window.setTimeout(() => {
      if (cancelled || document.visibilityState === 'hidden') return;
      window.location.assign(httpsUrl);
    }, Math.min(fallbackDelayMs, 1600));
    return { ok: true, mode: 'app', appUrl, webUrl: httpsUrl };
  }

  // Desktop: try WhatsApp Desktop protocol first (skips browser landing page).
  // If the window stays focused/visible, fall back to wa.me in a new tab.
  let settled = false;
  const settleApp = () => {
    if (settled) return;
    settled = true;
    cleanup();
  };

  const fallback = () => {
    if (settled) return;
    settled = true;
    cleanup();
    window.open(httpsUrl, '_blank', 'noopener,noreferrer');
  };

  const onBlur = () => settleApp();
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') settleApp();
  };

  const cleanup = () => {
    window.clearTimeout(timer);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('visibilitychange', onVisibility);
  };

  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);
  const timer = window.setTimeout(fallback, fallbackDelayMs);

  invokeWhatsAppProtocol(appUrl);
  return { ok: true, mode: 'app', appUrl, webUrl: httpsUrl };
}
