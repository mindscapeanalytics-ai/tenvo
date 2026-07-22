/**
 * Shared screen-aware height for elevated HeroCarousel stores
 * (furniture / pharmacy / tiles / restaurant / electronics).
 */
export const ELEVATED_CAROUSEL_HERO_HEIGHT =
  'h-[min(100svh,980px)] min-h-[560px] sm:min-h-[640px] lg:h-[100svh] lg:min-h-[100svh]';

/** Content inset so copy clears chrome + overlapping search docks. */
export const ELEVATED_CAROUSEL_HERO_CONTENT =
  'justify-end pb-24 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] sm:pb-28 sm:pt-24 lg:justify-center lg:pb-40 lg:pt-20';

/** Restaurant has no search dock — slightly less bottom padding. */
export const ELEVATED_CAROUSEL_HERO_CONTENT_SOLO =
  'justify-end pb-14 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] sm:pb-16 sm:pt-24 lg:justify-center lg:pb-20 lg:pt-20';
