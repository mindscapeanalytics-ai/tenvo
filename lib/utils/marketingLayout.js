/** Shared marketing site layout tokens — mobile-first, desktop via lg: breakpoints. */

import {
  MARKETING_BODY,
  MARKETING_DISPLAY,
  MARKETING_EYEBROW,
  MARKETING_H1,
  MARKETING_H2,
  MARKETING_H3,
  MARKETING_H4,
  MARKETING_LEAD,
  MARKETING_PAGE_TITLE,
  MARKETING_SECTION_HEADING,
  MARKETING_STAT_LABEL,
  MARKETING_STAT_VALUE,
} from '@/lib/utils/typography';

/** Main content clearance for floating assistant + optional sticky bars (mobile). */
export const MARKETING_MAIN_BOTTOM =
  'pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-0';

/** Home page sticky CTA bar + assistant FAB clearance on mobile. */
export const MARKETING_MAIN_BOTTOM_STICKY =
  'pb-[calc(9.5rem+env(safe-area-inset-bottom))] lg:pb-0';

/**
 * Site-wide marketing content column — nav, footer, and every homepage section
 * share these left/right edges (screenshot-aligned ~1440px shell).
 */
export const MARKETING_CONTAINER =
  'mx-auto w-full min-w-0 max-w-[1440px] px-4 min-[380px]:px-5 sm:px-6 lg:px-10 xl:px-12';

/** Nav/footer: same column as MARKETING_CONTAINER, plus safe-area insets. */
export const MARKETING_CONTAINER_CHROME =
  'mx-auto w-full min-w-0 max-w-[1440px] pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] min-[380px]:pl-[max(1.25rem,env(safe-area-inset-left))] min-[380px]:pr-[max(1.25rem,env(safe-area-inset-right))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] lg:pl-[max(2.5rem,env(safe-area-inset-left))] lg:pr-[max(2.5rem,env(safe-area-inset-right))] xl:pl-[max(3rem,env(safe-area-inset-left))] xl:pr-[max(3rem,env(safe-area-inset-right))]';

export const MARKETING_CONTAINER_NARROW =
  'mx-auto w-full min-w-0 max-w-3xl px-4 min-[380px]:px-5 sm:px-6 lg:px-8';

export const MARKETING_SECTION =
  'py-10 sm:py-14 lg:py-16';

export const MARKETING_SECTION_TIGHT =
  'py-8 sm:py-10 lg:py-12';

export const MARKETING_SECTION_LOOSE =
  'py-12 sm:py-16 lg:py-24';

export {
  MARKETING_BODY,
  MARKETING_DISPLAY,
  MARKETING_EYEBROW,
  MARKETING_H1,
  MARKETING_H2,
  MARKETING_H3,
  MARKETING_H4,
  MARKETING_LEAD,
  MARKETING_PAGE_TITLE,
  MARKETING_SECTION_HEADING,
  MARKETING_STAT_LABEL,
  MARKETING_STAT_VALUE,
};

/** Compact marketing nav height (mobile). */
export const MARKETING_NAV_HEIGHT = 'h-14 min-h-14 lg:h-[4.5rem] lg:min-h-[4.5rem]';
