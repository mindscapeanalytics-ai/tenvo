'use client';

import {
  Anchor,
  Sparkles,
  Dumbbell,
  Gem,
  Leaf,
  ShoppingBag,
  Hexagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { resolveStorefrontBrandMark } from '@/lib/storefront/storefrontBrandMark';

const ICON_MAP = {
  anchor: Anchor,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  gem: Gem,
  leaf: Leaf,
  bag: ShoppingBag,
  hexagon: Hexagon,
};

const SIZE = {
  sm: {
    logo: 'h-8 w-8',
    iconBox: 'h-8 w-8',
    icon: 'h-4 w-4',
    img: 32,
    text: 'text-sm',
    gap: 'gap-2',
  },
  md: {
    logo: 'h-9 w-9',
    iconBox: 'h-9 w-9',
    icon: 'h-4.5 w-4.5',
    img: 36,
    text: 'text-sm sm:text-base',
    gap: 'gap-2.5',
  },
  lg: {
    logo: 'h-11 w-11',
    iconBox: 'h-11 w-11',
    icon: 'h-5 w-5',
    img: 44,
    text: 'text-base sm:text-lg',
    gap: 'gap-3',
  },
};

/**
 * Consistent store brand mark for header, footer, and mobile chrome.
 *
 * @param {{
 *   business?: object | null,
 *   settings?: object | null,
 *   displayName?: string | null,
 *   accent?: string,
 *   size?: 'sm' | 'md' | 'lg',
 *   className?: string,
 *   nameClassName?: string,
 *   logoClassName?: string,
 *   iconClassName?: string,
 *   hideText?: boolean,
 * }} props
 */
export function StorefrontBrandMark({
  business,
  settings,
  displayName,
  accent = '#1e3a5f',
  size = 'md',
  className,
  nameClassName,
  logoClassName,
  iconClassName,
  hideText = false,
  compact = false,
}) {
  const mark = resolveStorefrontBrandMark({ business, settings, displayName });
  const sz = SIZE[size] || SIZE.md;
  const showText = mark.showText && !hideText && !(compact && (mark.showLogo || mark.showIcon));

  return (
    <span className={cn('inline-flex min-w-0 items-center', sz.gap, className)}>
      {mark.showLogo && mark.logoUrl ? (
        <SmartProductImage
          src={mark.logoUrl}
          alt={showText ? '' : mark.displayName}
          width={sz.img}
          height={sz.img}
          className={cn(sz.logo, 'shrink-0 rounded-lg object-contain', logoClassName)}
        />
      ) : null}

      {mark.showIcon && !mark.showLogo ? (
        mark.iconUrl ? (
          <SmartProductImage
            src={mark.iconUrl}
            alt={showText ? '' : mark.displayName}
            width={sz.img}
            height={sz.img}
            className={cn(sz.logo, 'shrink-0 rounded-lg object-contain', iconClassName)}
          />
        ) : (
          <span
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-lg text-white',
              sz.iconBox,
              iconClassName
            )}
            style={{ backgroundColor: accent }}
            aria-hidden={showText}
          >
            {mark.iconKey === 'initial' || !ICON_MAP[mark.iconKey] ? (
              <span className={cn('font-bold', size === 'sm' ? 'text-sm' : 'text-base')}>
                {mark.initial}
              </span>
            ) : (
              (() => {
                const Icon = ICON_MAP[mark.iconKey];
                return <Icon className={sz.icon} strokeWidth={2} />;
              })()
            )}
          </span>
        )
      ) : null}

      {showText ? (
        <span
          className={cn(
            'min-w-0 truncate',
            sz.text,
            mark.textClassName,
            nameClassName
          )}
        >
          {mark.displayName}
        </span>
      ) : null}
    </span>
  );
}
