'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Search, MapPin, ChevronRight, ShoppingBag, LayoutGrid, Truck, X, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { SearchBar } from '@/components/storefront/SearchBar';
import { StorefrontBrandMark } from '@/components/storefront/StorefrontBrandMark';
import { formatCurrency } from '@/lib/currency';
import { resolveStoreContact } from '@/lib/storefront/businessContact';
import { resolveStoreTopBarConfig } from '@/lib/storefront/storeTopBar';
import { formatTelHref } from '@/lib/storefront/storeConnectionActions';
import {
  formatSupermarketStoreName,
  getSupermarketChromeTheme,
  getSupermarketConfig,
  resolveSupermarketSubNav,
} from '@/lib/storefront/supermarketStorefront';
import { SUPERMARKET_DELIVERY_NOTICE } from '@/lib/storefront/supermarketCatalogDefaults';
import { useSupermarketChrome } from '@/components/storefront/supermarket/SupermarketChromeContext';

/**
 * Naheed / DSM-style supermarket header — promo strip, search, cart (no public login).
 * Milk shops use dairy blue chrome via getSupermarketChromeTheme.
 */
export function SupermarketSiteHeader({ business, settings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isSearchOpen, openSearch, closeSearch, openSidebar } = useSupermarketChrome();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { businessDomain, currency, categories } = useStorefront();
  const { cart } = useCart();
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const theme = getSupermarketChromeTheme(settings, business?.category);
  const accent = theme.accent;
  const accentLight = theme.accentLight;
  const promoBar = theme.promoBar;
  const storeRoot = `/store/${businessDomain}`;
  const displayName = formatSupermarketStoreName(business?.business_name);
  const contact = resolveStoreContact({ business, settings });
  const topBar = resolveStoreTopBarConfig(settings);
  const topBarPhone = topBar.showPhone ? contact.phone : '';
  const topBarPhoneHref = topBarPhone ? formatTelHref(topBarPhone) : null;
  const topBarCity = topBar.showCity ? contact.city : '';
  const config = getSupermarketConfig(settings, businessDomain, business?.category);
  const freeShip = settings?.freeShippingThreshold;
  const deliveryNotice = config.deliveryNotice || settings?.announcement || SUPERMARKET_DELIVERY_NOTICE;
  const promoStripHref = config.promoStripHref || '/products';
  const promoStripLabel = config.promoStripLabel;
  const subNavLinks = resolveSupermarketSubNav(settings, storeRoot, {
    categories,
    businessDomain,
    businessCategory: business?.category,
  });
  const isHome = pathname === storeRoot || pathname === `${storeRoot}/`;

  const isNavLinkActive = (href) => {
    if (!href) return false;
    const [path, query = ''] = String(href).split('?');
    if (pathname !== path) return false;
    if (!query) return pathname === storeRoot ? href === storeRoot || href === `${storeRoot}/` : true;
    const expected = new URLSearchParams(query);
    for (const [key, value] of expected.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50"
      data-store-supermarket-header
      style={{
        '--sm-accent': accent,
        '--sm-accent-light': accentLight,
        '--sm-promo': promoBar,
      }}
    >
      <div className="text-white" style={{ backgroundColor: promoBar }}>
        <div className="mx-auto flex min-h-8 max-w-[1400px] items-center justify-between gap-2 px-3 py-1.5 text-[10px] font-medium sm:px-6 sm:text-[11px] lg:px-8">
          <span className="inline-flex min-w-0 items-center gap-1 truncate sm:max-w-[55%]">
            <Truck className="hidden h-3 w-3 shrink-0 sm:inline" aria-hidden />
            <span className="truncate">{deliveryNotice}</span>
          </span>
          <div className="flex shrink-0 items-center gap-3">
            {topBarPhone && topBarPhoneHref ? (
              <a href={topBarPhoneHref} className="hidden items-center gap-1 text-white/95 md:inline-flex">
                <Phone className="h-3 w-3" aria-hidden />
                {topBarPhone}
              </a>
            ) : null}
            {topBarCity ? (
              <span className="hidden items-center gap-1 text-white/95 md:inline-flex">
                <MapPin className="h-3 w-3" aria-hidden />
                {topBarCity}
              </span>
            ) : null}
            {typeof freeShip === 'number' && freeShip > 0 ? (
              <span className="hidden text-white/95 lg:inline">
                Free delivery over {formatCurrency(freeShip, currency || 'PKR', { maximumFractionDigits: 0 })}
              </span>
            ) : null}
            <Link href={`${storeRoot}${promoStripHref}`} className="font-semibold text-white hover:text-white/90">
              {promoStripLabel}
            </Link>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'border-b bg-white transition-shadow',
          isScrolled && 'shadow-md'
        )}
        style={{
          borderColor: `${accent}33`,
          boxShadow: isScrolled ? `0 4px 14px ${accent}14` : undefined,
        }}
      >
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2.5 lg:hidden">
            <button
              type="button"
              onClick={openSidebar}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: accentLight, color: accent }}
              aria-label="Browse departments"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <Link href={storeRoot} className="min-w-0 flex-1">
              <StorefrontBrandMark
                business={business}
                settings={settings}
                displayName={displayName}
                accent={accent}
                size="sm"
                className="mx-auto justify-center"
                nameClassName="truncate text-center text-sm font-bold text-slate-900"
                logoClassName="mx-auto h-7 w-auto max-w-[140px] object-contain"
              />
            </Link>
            <Link
              href={`${storeRoot}/cart`}
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartItemCount > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                  style={{ backgroundColor: accent }}
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              ) : null}
            </Link>
          </div>

          <button
            type="button"
            onClick={openSearch}
            className="mb-2.5 flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left lg:hidden"
            aria-label="Open search"
          >
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm text-slate-500">
              {config.searchPlaceholder}
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
          </button>

          <div className="hidden h-[68px] items-center gap-5 lg:flex">
            <Link href={storeRoot} className="flex shrink-0 items-center gap-2">
              <StorefrontBrandMark
                business={business}
                settings={settings}
                displayName={displayName}
                accent={accent}
                size="md"
                nameClassName="text-xl font-bold tracking-tight text-slate-900"
                logoClassName="h-9 w-auto object-contain"
              />
            </Link>

            <button
              type="button"
              onClick={openSidebar}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition hover:opacity-90"
              style={{
                borderColor: `${accent}55`,
                backgroundColor: accentLight,
                color: theme.accentDark || accent,
              }}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
              Categories
            </button>

            <div className="min-w-0 flex-1 max-w-2xl">
              <SearchBar businessDomain={businessDomain} />
            </div>

            <Link
              href={`${storeRoot}/cart`}
              className="relative ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-95"
              style={{ backgroundColor: accent }}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden />
              <span>My cart</span>
              {cartItemCount > 0 ? (
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {cartItemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <nav className="hidden border-b border-slate-100 bg-white lg:block" aria-label="Departments">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
            <Link
              href={storeRoot}
              className={cn(
                'shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                isHome ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
              style={isHome ? { backgroundColor: accent } : undefined}
            >
              Home
            </Link>
            {subNavLinks.map((link) => {
              const active = isNavLinkActive(link.href);
              return (
                <Link
                  key={link.id}
                  href={link.href}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold transition',
                    active ? '' : 'text-slate-600 hover:opacity-90'
                  )}
                  style={
                    active
                      ? { color: theme.accentDark || accent }
                      : undefined
                  }
                  onMouseEnter={(e) => {
                    if (active) return;
                    e.currentTarget.style.backgroundColor = accentLight;
                    e.currentTarget.style.color = theme.accentDark || accent;
                  }}
                  onMouseLeave={(e) => {
                    if (active) return;
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.color = '';
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <nav className="border-b border-slate-100 bg-white lg:hidden" aria-label="Quick shop">
        <div className="mx-auto max-w-[1400px] px-3">
          <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
            {subNavLinks.slice(0, 8).map((link) => (
              <Link
                key={link.id}
                href={link.href}
                className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 active:scale-[0.98]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {isSearchOpen ? (
        <div className="fixed inset-0 z-[70] bg-white lg:hidden">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-3">
            <div className="min-w-0 flex-1">
              <SearchBar businessDomain={businessDomain} onClose={closeSearch} />
            </div>
            <button
              type="button"
              onClick={closeSearch}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
