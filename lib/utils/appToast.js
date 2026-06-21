'use client';

/**
 * Theme-aware, de-duplicated toasts for the hub.
 * Pass a stable `id` so react-hot-toast replaces an in-flight toast instead of stacking duplicates.
 */
import toast from 'react-hot-toast';

export const TOAST_IDS = Object.freeze({
  AUTH_WELCOME: 'tenvo-auth-welcome',
  BILLING_RETURN: 'tenvo-billing-return',
  BUSINESS_SWITCH: 'tenvo-business-switch',
});

/** Shared surface styles — reads design tokens from globals.css (light + .dark). */
export function getToastSurfaceStyle() {
  return {
    background: 'var(--card)',
    color: 'var(--card-foreground)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg, 0.75rem)',
    padding: '12px 16px',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
    fontSize: '0.875rem',
    lineHeight: '1.35',
    maxWidth: '24rem',
  };
}

export const toastIconThemes = {
  success: {
    primary: 'var(--success, #10b981)',
    secondary: '#ffffff',
  },
  error: {
    primary: 'var(--error, #ef4444)',
    secondary: '#ffffff',
  },
};

function mergeOptions(options = {}) {
  const base = getToastSurfaceStyle();
  return {
    duration: 4000,
    ...options,
    style: { ...base, ...(options.style || {}) },
  };
}

export const notify = {
  success(message, options) {
    return toast.success(message, mergeOptions(options));
  },
  error(message, options) {
    return toast.error(message, mergeOptions(options));
  },
  info(message, options) {
    return toast(message, mergeOptions({ icon: 'ℹ️', ...options }));
  },
  loading(message, options) {
    return toast.loading(message, mergeOptions(options));
  },
  dismiss(toastId) {
    toast.dismiss(toastId);
  },
  promise(promise, messages, options) {
    return toast.promise(promise, messages, mergeOptions(options));
  },
};

export default notify;
