/**
 * Recover from stale or flaky Next.js / Turbopack chunk loads.
 *
 * Causes we see in production:
 * - Deploy skew: HTML/runtime still points at old hashed chunks after a push
 * - Transient CDN / HTTP2 drops (net::ERR_HTTP2_PING_FAILED)
 *
 * Soft React remount does NOT help — the dynamic import promise is already rejected.
 * A one-shot full reload fetches the current build's chunks.
 */

const RELOAD_FLAG = 'tenvo:chunk-reload';

export function isChunkLoadError(error) {
  if (!error) return false;
  const name = String(error.name || '');
  const message = String(error.message || error || '');
  return (
    name === 'ChunkLoadError' ||
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w/-]+ failed/i.test(message) ||
    /Failed to load chunk/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message)
  );
}

/**
 * @returns {boolean} true if a reload was triggered
 */
export function reloadForStaleChunkOnce() {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === '1') {
      sessionStorage.removeItem(RELOAD_FLAG);
      return false;
    }
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    // sessionStorage blocked — still attempt one reload; loop risk is low
  }
  window.location.reload();
  return true;
}

export function clearChunkReloadFlag() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // ignore
  }
}

/**
 * Retry a dynamic import a few times before surfacing ChunkLoadError.
 * Helps transient HTTP2 / network blips without a full page reload.
 */
export function withChunkLoadRetry(loader, { retries = 2, delayMs = 400 } = {}) {
  return async () => {
    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const mod = await loader();
        clearChunkReloadFlag();
        return mod;
      } catch (error) {
        lastError = error;
        if (!isChunkLoadError(error) || attempt === retries) break;
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }
    throw lastError;
  };
}
