'use client';

import { HeroCarousel } from '@/components/storefront/sections/heroes/HeroCarousel';
import { formatRestaurantStoreName } from '@/lib/storefront/restaurantStorefront';
import {
  ELEVATED_CAROUSEL_HERO_CONTENT_SOLO,
  ELEVATED_CAROUSEL_HERO_HEIGHT,
} from '@/lib/storefront/elevatedCarouselHero';

/**
 * Elevated restaurant hero — cinematic full-viewport food carousel.
 */
export function RestaurantHero({ preset, accent, accentDark }) {
  const storeName = preset.storeName || formatRestaurantStoreName('');
  const slides = preset.slides || [];

  return (
    <section className="relative bg-zinc-100" data-restaurant-hero>
      <div className="relative isolate">
        <HeroCarousel
          slides={slides}
          accent={accent}
          accentDark={accentDark}
          variant="restaurant"
          storeName={storeName}
          minHeight={ELEVATED_CAROUSEL_HERO_HEIGHT}
          className="restaurant-hero-carousel"
          contentClassName={ELEVATED_CAROUSEL_HERO_CONTENT_SOLO}
        />
      </div>
    </section>
  );
}
