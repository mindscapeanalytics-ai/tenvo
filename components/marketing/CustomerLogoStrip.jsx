'use client';

import { cn } from '@/lib/utils';
import { MARKETING_CONTAINER } from '@/lib/utils/marketingLayout';

/**
 * Customer/partner logo marquee strip for social proof.
 * Shows rotating logos of businesses using TENVO (or partner integrations).
 */

const CUSTOMER_LOGOS = [
  {
    name: 'Fashion Boutique',
    logo: '/logos/customer-boutique.svg',
    alt: 'Pakistani fashion boutique powered by TENVO',
  },
  {
    name: 'Pharmacy Chain',
    logo: '/logos/customer-pharmacy.svg',
    alt: 'Pharmacy chain using TENVO inventory',
  },
  {
    name: 'Restaurant Group',
    logo: '/logos/customer-restaurant.svg',
    alt: 'Restaurant group POS powered by TENVO',
  },
  {
    name: 'Auto Parts Dealer',
    logo: '/logos/customer-autoparts.svg',
    alt: 'Auto parts distributor on TENVO',
  },
  {
    name: 'Furniture Store',
    logo: '/logos/customer-furniture.svg',
    alt: 'Furniture retailer using TENVO storefront',
  },
  {
    name: 'Fitness Center',
    logo: '/logos/customer-fitness.svg',
    alt: 'Gym membership managed via TENVO',
  },
];

export default function CustomerLogoStrip({ variant = 'default' }) {
  const isCompact = variant === 'compact';

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-neutral-200/80 bg-neutral-50',
        isCompact ? 'py-6 sm:py-8' : 'py-8 sm:py-12 lg:py-16'
      )}
    >
      <div className={MARKETING_CONTAINER}>
        <p className="mb-6 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400 sm:mb-8 sm:text-[11px]">
          Trusted by growing businesses across Pakistan
        </p>

        {/* Logo Grid - Static for now, can be animated marquee */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-6 md:gap-8">
          {CUSTOMER_LOGOS.map((customer) => (
            <div
              key={customer.name}
              className="flex items-center justify-center rounded-xl border border-neutral-200/80 bg-white p-4 opacity-60 transition-all duration-300 hover:opacity-100 hover:shadow-sm sm:p-6"
            >
              {/* Placeholder - replace with actual logos */}
              <div className="h-8 w-24 rounded bg-neutral-200/60" aria-label={customer.alt} title={customer.name} />
              {/* Future: <Image src={customer.logo} alt={customer.alt} width={96} height={32} /> */}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs font-medium text-neutral-500 sm:mt-8">
          From single-outlet startups to multi-location enterprises
        </p>
      </div>
    </section>
  );
}
