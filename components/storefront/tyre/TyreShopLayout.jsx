'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gauge, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TyreCategoryStrip } from '@/components/storefront/tyre/TyreCategoryStrip';
import {
  buildTyreFinderHref,
  TYRE_FINDER_PROFILES,
  TYRE_FINDER_RIMS,
  TYRE_FINDER_WIDTHS,
  TYRE_ACCENTS,
} from '@/lib/storefront/tyreStorefront';

/**
 * Tyre catalog shell — size finder, vehicle categories, and light shop chrome.
 */
export function TyreShopLayout({
  children,
  businessDomain,
  categories = [],
  settings = {},
  accent = TYRE_ACCENTS.accent,
  title = 'Shop tyres',
  subtitle = '',
  storeBase,
  className,
}) {
  const root = storeBase || `/store/${businessDomain}`;
  const router = useRouter();

  const handleFindBySize = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const width = form.width.value;
    const profile = form.profile.value;
    const rim = form.rim.value;
    router.push(buildTyreFinderHref(root, { width, profile, rim }));
  };

  return (
    <div className={cn('min-h-screen bg-zinc-50', className)} data-tyre-shop>
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:text-base">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <form
            onSubmit={handleFindBySize}
            className="flex flex-col gap-3 lg:flex-row lg:items-end"
          >
            <div className="grid flex-1 grid-cols-3 gap-2 sm:gap-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Width
                </span>
                <select
                  name="width"
                  defaultValue="205"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
                >
                  {TYRE_FINDER_WIDTHS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Profile
                </span>
                <select
                  name="profile"
                  defaultValue="55"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
                >
                  {TYRE_FINDER_PROFILES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Rim
                </span>
                <select
                  name="rim"
                  defaultValue="16"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-400"
                >
                  {TYRE_FINDER_RIMS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              <Gauge className="h-4 w-4" aria-hidden />
              Find tyres
            </button>
          </form>
        </div>
      </div>

      <TyreCategoryStrip businessDomain={businessDomain} categories={categories} accent={accent} />

      <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-900 to-zinc-800">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p className="text-sm text-zinc-200">
            Need fitting, balancing, or alignment? Book the bay with your size or vehicle details.
          </p>
          <Link
            href={`${root}/contact`}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-100 sm:text-sm"
          >
            <Phone className="h-4 w-4" aria-hidden />
            Book fitting bay
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
