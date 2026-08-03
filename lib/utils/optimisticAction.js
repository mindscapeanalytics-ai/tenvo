'use client';

/**
 * Optimistic Action Helper — Instant UI feedback for hub mutations.
 *
 * Wraps server actions in an optimistic pattern:
 * 1. Immediately apply optimistic state update
 * 2. Fire server action in background
 * 3. On failure: rollback state + show error toast
 * 4. On success: optionally patch state with server response + show compact toast
 *
 * This eliminates perceived latency on product saves, invoice creates,
 * POS checkouts, customer updates, and any other hub mutation.
 */
import notify from '@/lib/utils/appToast';

/**
 * @template T
 * @param {Object} options
 * @param {() => Promise<{ success: boolean; error?: string; [key: string]: any }>} options.action — Server action to execute
 * @param {() => T} options.getSnapshot — Capture current state before mutation (for rollback)
 * @param {() => void} options.optimisticUpdate — Apply optimistic state immediately
 * @param {(snapshot: T) => void} options.rollback — Revert state on failure
 * @param {(result: any) => void} [options.onSuccess] — Patch state with server response (optional)
 * @param {string} [options.successMessage='Saved'] — Toast message on success
 * @param {string} [options.errorMessage] — Override error message
 * @param {string} [options.toastId] — Stable toast ID to prevent stacking
 * @param {boolean} [options.silent=false] — Skip success toast
 * @returns {Promise<{ success: boolean; result?: any; error?: string }>}
 */
export async function optimisticAction({
  action,
  getSnapshot,
  optimisticUpdate,
  rollback,
  onSuccess,
  successMessage = 'Saved',
  errorMessage,
  toastId,
  silent = false,
}) {
  const snapshot = getSnapshot();

  // 1. Instant optimistic update
  try {
    optimisticUpdate();
  } catch (e) {
    console.warn('[optimisticAction] optimistic update threw:', e);
  }

  // 2. Fire server action
  try {
    const result = await action();

    if (result?.success === false) {
      // 3a. Server reported failure — rollback
      rollback(snapshot);
      const msg = errorMessage || result.error || 'Operation failed';
      notify.error(msg, toastId ? { id: toastId } : undefined);
      return { success: false, error: msg };
    }

    // 3b. Success — optionally patch with server data
    if (onSuccess) {
      try {
        onSuccess(result);
      } catch (e) {
        console.warn('[optimisticAction] onSuccess patch threw:', e);
      }
    }

    if (!silent) {
      notify.compactSave(successMessage, toastId ? { id: toastId } : undefined);
    }

    return { success: true, result };
  } catch (err) {
    // 3c. Network / unexpected error — rollback
    rollback(snapshot);
    const msg = errorMessage || err?.message || 'Connection error';
    notify.error(msg, toastId ? { id: toastId } : undefined);
    return { success: false, error: msg };
  }
}

/**
 * Simpler variant for fire-and-forget mutations that don't need optimistic state.
 * Shows loading → success/error toast automatically.
 *
 * @param {() => Promise<{ success: boolean; error?: string; [key: string]: any }>} action
 * @param {Object} [opts]
 * @param {string} [opts.successMessage='Done']
 * @param {string} [opts.loadingMessage='Processing...']
 * @param {string} [opts.toastId]
 * @returns {Promise<{ success: boolean; result?: any; error?: string }>}
 */
export async function instantAction(action, opts = {}) {
  const {
    successMessage = 'Done',
    loadingMessage = 'Processing...',
    toastId,
  } = opts;

  const tid = toastId || `instant-${Date.now()}`;
  notify.loading(loadingMessage, { id: tid });

  try {
    const result = await action();

    if (result?.success === false) {
      notify.error(result.error || 'Failed', { id: tid });
      return { success: false, error: result.error };
    }

    notify.compactSave(successMessage, { id: tid, duration: 1200 });
    return { success: true, result };
  } catch (err) {
    notify.error(err?.message || 'Connection error', { id: tid });
    return { success: false, error: err?.message };
  }
}

/**
 * Debounced action — prevents rapid-fire submissions (double-click protection).
 * Returns a function that ignores calls within the cooldown window.
 *
 * @param {Function} fn — The action function
 * @param {number} [cooldownMs=600] — Minimum time between executions
 * @returns {Function}
 */
export function debouncedAction(fn, cooldownMs = 600) {
  let lastCall = 0;
  let pending = false;

  return async (...args) => {
    const now = Date.now();
    if (pending || now - lastCall < cooldownMs) return;

    pending = true;
    lastCall = now;
    try {
      return await fn(...args);
    } finally {
      pending = false;
    }
  };
}
