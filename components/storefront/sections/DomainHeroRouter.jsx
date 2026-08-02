'use client';

import { PartsFinderHero } from './heroes/PartsFinderHero';
import { MarinePartsFinderHero } from './heroes/MarinePartsFinderHero';
import {
  PharmacyFinderHero,
  FashionFinderHero,
  GroceryFinderHero,
  RestaurantFinderHero,
} from './heroes/CommerceFinderHero';
import { CommerceCarouselHero } from './heroes/CommerceCarouselHero';
import { FashionEditorialHero } from './heroes/FashionEditorialHero';
import { DealershipHero } from './dealership/DealershipHero';
import { MarketplaceHero } from './marketplace/MarketplaceHero';
import { PharmacyHero } from './pharmacy/PharmacyHero';
import { FurnitureHero } from './furniture/FurnitureHero';
import { TilesHero } from './tiles/TilesHero';
import { TyreHero } from './tyre/TyreHero';
import { FootwearHero } from './footwear/FootwearHero';
import { ElectronicsHero } from './electronics/ElectronicsHero';
import { RestaurantHero } from './restaurant/RestaurantHero';
import { FitnessHero } from './fitness/FitnessHero';
import { SupermarketHero } from './supermarket/SupermarketHero';
import { JewelleryHero } from './heroes/JewelleryHero';

/**
 * Renders the domain-appropriate immersive hero (parts finder, pharmacy, fashion, etc.).
 * @param {{ preset: object; businessDomain: string; accent: string; accentDark: string }} props
 */
export function DomainHeroRouter({
  preset,
  businessDomain,
  accent,
  accentDark,
  business = null,
  settings = null,
}) {
  if (!preset?.type) return null;

  switch (preset.type) {
    case 'parts-finder':
      return (
        <PartsFinderHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          business={business}
          settings={settings}
        />
      );
    case &apos;marine-parts-finder&apos;:
      return (
        <MarinePartsFinderHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          business={business}
          settings={settings}
        />
      );
    case &apos;pharmacy-finder&apos;:
      return (
        <PharmacyFinderHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
        />
      );
    case &apos;pharmacy-elevated&apos;:
      return (
        <PharmacyHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;tiles-elevated&apos;:
      return (
        <TilesHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;tyre-elevated&apos;:
      return (
        <TyreHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;footwear-elevated&apos;:
      return (
        <FootwearHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;electronics-elevated&apos;:
      return (
        <ElectronicsHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;furniture-elevated&apos;:
      return (
        <FurnitureHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;restaurant-elevated&apos;:
      return (
        <RestaurantHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;fitness-elevated&apos;:
      return (
        <FitnessHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
          meetingUrl={preset.meetingUrl}
        />
      );
    case &apos;fashion-editorial&apos;:
      return (
        <FashionEditorialHero
          preset={preset}
          accent={accent}
        />
      );
    case &apos;auto-dealership&apos;:
      return (
        <DealershipHero
          preset={preset}
          accent={accent}
        />
      );
    case &apos;auto-marketplace&apos;:
      return (
        <MarketplaceHero
          preset={preset}
          accent={accent}
          accentDark={accentDark}
          settings={preset.settings}
        />
      );
    case &apos;fashion-finder&apos;:
      return (
        <FashionFinderHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
        />
      );
    case &apos;supermarket-elevated&apos;:
      return (
        <SupermarketHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
          contactCity={preset.contactCity}
        />
      );
    case &apos;grocery-finder&apos;:
      return (
        <GroceryFinderHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
        />
      );
    case &apos;restaurant-finder&apos;:
      return (
        <RestaurantFinderHero
          preset={preset}
          businessDomain={businessDomain}
          accent={accent}
          accentDark={accentDark}
        />
      );
    case &apos;jewellery-elevated&apos;:
      return (
        <JewelleryHero
          preset={preset}
          accent={accent}
        />
      );
    case &apos;commerce-carousel&apos;:
    default:
      return (
        <CommerceCarouselHero
          preset={preset}
          accent={accent}
          accentDark={accentDark}
        />
      );
  }
}
