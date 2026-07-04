/** Shared compact form tokens for mobile app-like data entry. */

import { cn } from '@/lib/utils';
import { MOBILE_BTN, MOBILE_INPUT, MOBILE_LABEL } from '@/lib/utils/typography';

/** ≥16px on mobile — prevents iOS Safari auto-zoom on focus */
export const MOBILE_NO_ZOOM_TEXT = 'text-base sm:text-sm';

export const MOBILE_INPUT_CLASS = `h-10 max-lg:h-11 rounded-lg border-gray-200 ${MOBILE_INPUT}`;
export const MOBILE_LABEL_CLASS = MOBILE_LABEL;
export const MOBILE_SELECT_TRIGGER = `h-10 max-lg:h-11 rounded-lg ${MOBILE_INPUT}`;

export const MOBILE_FORM_BODY = 'min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4';
export const MOBILE_FORM_HEADER =
  'shrink-0 border-b bg-white px-3 py-3 sm:px-5 sm:py-4';
export const MOBILE_FORM_FOOTER =
  'shrink-0 border-t border-gray-100 bg-white px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-3';

/** Dialog shell for full-height forms on mobile */
export const MOBILE_DIALOG_SHELL =
  'flex max-h-[min(92dvh,900px)] w-[calc(100vw-1rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full sm:max-w-2xl sm:rounded-2xl';

export const MOBILE_DIALOG_SHELL_WIDE =
  'flex max-h-[min(92dvh,900px)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-full sm:rounded-2xl';

/** Fixed overlay card for legacy full-screen forms */
export const MOBILE_OVERLAY = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4';
export const MOBILE_OVERLAY_CARD =
  'flex w-full max-h-[100dvh] sm:max-h-[min(92vh,900px)] flex-col overflow-hidden rounded-none border-0 shadow-2xl sm:max-w-5xl sm:rounded-2xl sm:border';

export const MOBILE_LINE_TABLE_WRAP = '-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0';
export const MOBILE_GRID_FIELDS = 'grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4';
export const MOBILE_TAB_LIST = 'mb-3 flex h-9 w-full gap-0.5 overflow-x-auto rounded-lg bg-gray-100/80 p-0.5 scrollbar-none sm:grid sm:overflow-visible';

export const MOBILE_BTN_PRIMARY = `h-10 rounded-xl px-4 ${MOBILE_BTN} sm:h-10`;
export const MOBILE_BTN_SECONDARY = `h-10 rounded-xl px-3 text-xs font-semibold sm:h-10`;

/** Standard hub dialog — mobile bottom sheet shell, desktop centered modal */
export function hubDialogContentClass(options = {}) {
  const { wide = false, maxWidth } = options;
  const shell = wide ? MOBILE_DIALOG_SHELL_WIDE : MOBILE_DIALOG_SHELL;
  const desktopMax = maxWidth || (wide ? 'lg:max-w-3xl' : 'lg:max-w-lg');
  return cn(
    shell,
    desktopMax,
    'lg:max-h-[90vh] lg:overflow-y-auto lg:p-6 lg:gap-4 lg:rounded-lg'
  );
}

/** Full-height entity viewer/editor (customer, product, invoice details) */
export const HUB_ENTITY_DIALOG = cn(
  MOBILE_DIALOG_SHELL_WIDE,
  'flex flex-col gap-0 overflow-hidden p-0 lg:max-h-[85vh] lg:max-w-2xl lg:rounded-[1.5rem]'
);
