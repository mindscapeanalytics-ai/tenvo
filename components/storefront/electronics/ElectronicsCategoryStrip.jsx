'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ELECTRONICS_BLUE,
  resolveElectronicsSidebarDepartments,
} from '@/lib/storefront/electronicsStorefront';

/**
 * Horizontal department chips for electronics /products shop.
 */
export function ElectronicsCategoryStrip({
  businessDomain,
  settings = {},
  accent = ELECTRONICS_BLUE,
  storeBase,
}) {
  const root = storeBase || `/store/${businessDomain}`;
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const onSale = searchParams.get('onSale') === 'true';
  const departments = resolveElectronicsSidebarDepartments(settings, root, {
    businessDomain,
  }).filter((d) => d.id !== 'deals' || true);

  return (
    <div className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-4 py-3 scrollbar-hide sm:px-6 lg:px-8">
        <Link
          href={`${root}/products`}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
            !activeCategory && !onSale
              ? 'text-white'
              : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
          )}
          style={!activeCategory && !onSale ? { backgroundColor: accent } : undefined}
        >
          All products
        </Link>
        {departments.map((dept) => {
          const active =
            (dept.hrefSuffix?.includes('onSale') && onSale) ||
            (dept.slug && activeCategory === dept.slug);
          return (
            <Link
              key={dept.id}
              href={dept.href}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                active
                  ? 'text-white'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white'
              )}
              style={active ? { backgroundColor: accent } : undefined}
            >
              {dept.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
