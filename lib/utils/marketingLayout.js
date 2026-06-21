/** Shared marketing site layout tokens — mobile-first, desktop via lg: breakpoints. */

/** Main content clearance for floating assistant + optional sticky bars (mobile). */
export const MARKETING_MAIN_BOTTOM =
  'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0';

/** Home page sticky CTA bar + assistant FAB clearance on mobile. */
export const MARKETING_MAIN_BOTTOM_STICKY =
  'pb-[calc(9.5rem+env(safe-area-inset-bottom))] lg:pb-0';

export const MARKETING_CONTAINER =
  'mx-auto w-full min-w-0 max-w-7xl px-4 min-[380px]:px-5 sm:px-6 lg:px-12';

export const MARKETING_CONTAINER_NARROW =
  'mx-auto w-full min-w-0 max-w-3xl px-4 min-[380px]:px-5 sm:px-6 lg:px-8';

export const MARKETING_SECTION =
  'py-10 sm:py-14 lg:py-16';

export const MARKETING_SECTION_TIGHT =
  'py-8 sm:py-10 lg:py-12';

export const MARKETING_SECTION_LOOSE =
  'py-12 sm:py-16 lg:py-24';

export const MARKETING_H1 =
  'text-balance text-3xl font-extrabold tracking-tight text-neutral-900 min-[400px]:text-4xl sm:text-5xl lg:text-6xl';

export const MARKETING_H2 =
  'text-balance text-2xl font-bold text-neutral-900 sm:text-3xl lg:text-4xl';

export const MARKETING_H3 =
  'text-xl font-bold text-neutral-900 sm:text-2xl';

export const MARKETING_LEAD =
  'text-pretty text-base font-medium leading-relaxed text-neutral-600 sm:text-lg';

export const MARKETING_EYEBROW =
  'text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary sm:text-[11px] sm:tracking-[0.22em]';

/** Compact marketing nav height (mobile). */
export const MARKETING_NAV_HEIGHT = 'h-14 min-h-14 lg:h-[4.5rem] lg:min-h-[4.5rem]';
