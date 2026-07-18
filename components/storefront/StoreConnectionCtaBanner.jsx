'use client';

import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StoreConnectionButtons } from '@/components/storefront/StoreConnectionButtons';
import { cn } from '@/lib/utils';

/**
 * Full-bleed connection CTA band (quote / call / mail) for B2B parts stores.
 */
export function StoreConnectionCtaBanner({
  business,
  settings,
  businessDomain,
  storeBase,
  title,
  subtitle,
  imageUrl,
  accent = '#0d9488',
  className,
  force = false,
}) {
  return (
    <section className={cn('relative overflow-hidden bg-[#001122] text-white', className)}>
      {imageUrl ? (
        <div className="absolute inset-0 opacity-40" aria-hidden>
          <SmartProductImage src={imageUrl} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001122] via-[#001122]/90 to-[#001122]/55" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-[#001122] via-[#0a1f33] to-[#001122]" aria-hidden />
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        {title ? (
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
        ) : null}
        {subtitle ? (
          <p className="mt-3 max-w-xl text-sm text-white/75 sm:text-base">{subtitle}</p>
        ) : null}
        <StoreConnectionButtons
          business={business}
          settings={settings}
          businessDomain={businessDomain}
          storeBase={storeBase}
          accent={accent}
          force={force}
          className="mt-8"
        />
      </div>
    </section>
  );
}
