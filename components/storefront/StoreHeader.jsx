'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag, Search, Menu, User, Heart,
  Phone, MapPin, X, ChevronDown,
  Shield, FileUp,
  Gauge, Percent, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { useCart } from '@/lib/hooks/storefront/useCart';
import { useWishlist } from '@/lib/hooks/storefront/useWishlist';
import { SearchBar } from './SearchBar';
import { MobileNav } from './MobileNav';
import { FashionMobileNav } from './FashionMobileNav';
import { JewelleryMobileNav } from './JewelleryMobileNav';
import { getDomainConfig, getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { getStoreHomeCopy } from '@/lib/storefront/storeCopy';
import { isFashionEditorialStore, resolveFashionSearchPlaceholder } from '@/lib/storefront/fashionEditorial';
import { isJewelleryStore, resolveJewellerySearchPlaceholder } from '@/lib/storefront/jewelleryStorefront';
import { isAutoDealershipStore, getDealershipNavLinks, getDealershipNavGroups } from '@/lib/storefront/autoDealership';
import { StorefrontBrandMark } from '@/components/storefront/StorefrontBrandMark';
import { isAutoMarketplaceStore, getMarketplaceNavLinks } from '@/lib/storefront/autoMarketplace';
import { isPharmacyElevatedStore, getPharmacyNavLinks, formatPharmacyStoreName } from '@/lib/storefront/pharmacyStorefront';
import { resolveDomainKey } from '@/lib/config/domainKeyAliases';
import { resolveStoreContact } from '@/lib/storefront/businessContact';
import { resolveStoreTopBarConfig } from '@/lib/storefront/storeTopBar';
import { formatTelHref } from '@/lib/storefront/storeConnectionActions';

function EditorialMenuIcon({ className }) {
  return (
    <span className={cn('flex flex-col justify-center gap-[5px]', className)} aria-hidden>
      <span className="block h-[1.5px] w-[18px] bg-current" />
      <span className="block h-[1.5px] w-[18px] bg-current" />
    </span>
  );
}

export function StoreHeader({ business, categories, settings }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [dealershipMoreOpen, setDealershipMoreOpen] = useState(false);
  const categoryRef = useRef(null);
  const dealershipMoreRef = useRef(null);

  const { cart } = useCart();
  const { wishlistCount } = useWishlist();
  const { businessDomain, currency } = useStorefront();

  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Derive accent color, settings override > domain default
  const accent = getStoreAccentColor(settings, business?.category);
  const domainCfg = getDomainConfig(business?.category);
  const storeCopy = getStoreHomeCopy(business, domainCfg);

  // Top bar settings
  const topBar = resolveStoreTopBarConfig(settings);
  const topBarEnabled = topBar.enabled;
  const showServiceStrip = settings?.storefront?.showServiceStrip !== false;
  const announcement = settings?.announcement || domainCfg.bannerText;
  const contact = resolveStoreContact({ business, settings });
  const contactPhone = topBar.showPhone ? contact.phone : '';
  const contactPhoneHref = contactPhone ? formatTelHref(contactPhone) : null;
  const contactCity = topBar.showCity ? (contact.city || settings?.contact?.city) : '';

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryMenuOpen(false);
      }
      if (dealershipMoreRef.current && !dealershipMoreRef.current.contains(e.target)) {
        setDealershipMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const pathname = usePathname();
  const isActive = (href) => pathname === href || pathname.startsWith(href + '?');
  const storeRoot = `/store/${businessDomain}`;
  const isHome = pathname === storeRoot || pathname === `${storeRoot}/`;
  const editorialNav = isFashionEditorialStore(business?.category);
  const jewelleryNav = isJewelleryStore(business?.category);
  const dealershipNav = isAutoDealershipStore(business?.category);
  const marketplaceNav = isAutoMarketplaceStore(business?.category);
  const pharmacyNav = isPharmacyElevatedStore(business?.category);
  const searchPlaceholder = jewelleryNav
    ? resolveJewellerySearchPlaceholder(settings, businessDomain, business?.category)
    : editorialNav
      ? resolveFashionSearchPlaceholder(settings, business?.category, businessDomain)
      : storeCopy.searchPlaceholder;
  const immersiveNav = editorialNav || jewelleryNav || dealershipNav;
  const editorialOnHome = editorialNav && isHome;
  const jewelleryOnHome = jewelleryNav && isHome;
  const dealershipOnHome = dealershipNav && isHome;
  const marketplaceOnHome = marketplaceNav && isHome;
  const pharmacyOnHome = pharmacyNav && isHome;
  /** Jewellery / beauty / fashion: one compact bar when scrolled (no stacked announcement + policies). */
  const compactLuxuryHeader = (jewelleryNav || editorialNav) && isScrolled;
  const transparentHeader = (editorialOnHome || jewelleryOnHome || dealershipOnHome) && !isScrolled;
  const showAnnouncementBar =
    topBarEnabled &&
    !(immersiveNav && isHome && !isScrolled) &&
    !compactLuxuryHeader;
  const canonical = resolveDomainKey(business?.category);
  const dealershipLinks = dealershipNav
    ? getDealershipNavLinks(storeRoot, {
        country: business?.country,
        settings,
        category: business?.category,
      })
    : [];
  const dealershipNavGroups = dealershipNav
    ? getDealershipNavGroups(storeRoot, { country: business?.country, settings })
    : { primary: [], secondary: [] };
  const dealershipPrimaryLinks = dealershipNavGroups.primary?.length
    ? dealershipNavGroups.primary
    : dealershipLinks;
  const dealershipSecondaryLinks = dealershipNavGroups.secondary || [];
  const marketplaceLinks = marketplaceNav ? getMarketplaceNavLinks(storeRoot) : [];
  const pharmacyLinks = pharmacyNav ? getPharmacyNavLinks(storeRoot) : [];
  const pharmacyDisplayName = pharmacyNav ? formatPharmacyStoreName(business?.business_name) : '';

  const visibleCategories = categories?.slice(0, 5) || [];
  const extraCategories = categories?.slice(5) || [];

  return (
    <header
        className={cn(
          (editorialOnHome || jewelleryOnHome || dealershipOnHome) ? 'fixed inset-x-0 top-0' : 'sticky top-0',
          'z-50 transition-all duration-300'
        )}
    >
      {/* ── Announcement / Top Bar ─────────────────────────────────────── */}
      {showAnnouncementBar && (
        <div
          className="hidden text-white text-xs py-2 px-4 md:block"
          style={{ backgroundColor: accent }}
        >
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
            {/* Left: contact info */}
            <div className="flex min-w-0 items-center gap-4">
              {contactPhone && contactPhoneHref ? (
                <a
                  href={contactPhoneHref}
                  className="flex items-center gap-1.5 whitespace-nowrap transition-colors hover:text-white/80"
                >
                  <Phone className="h-3 w-3 flex-shrink-0" aria-hidden />
                  <span>{contactPhone}</span>
                </a>
              ) : null}
              {contactCity ? (
                <span className="hidden truncate text-white/80 md:flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" aria-hidden />
                  {contactCity}
                </span>
              ) : null}
            </div>

            {/* Center: announcement */}
            {announcement && (
              <p className="hidden truncate text-center font-medium text-white/95 sm:block">
                {announcement}
              </p>
            )}

            {/* Right: orders link */}
            <Link
              href={`/store/${businessDomain}/orders`}
              className="hidden whitespace-nowrap transition-colors hover:text-white/80 sm:block"
            >
              Track Order
            </Link>
          </div>
        </div>
      )}

      {/* ── Main Header ────────────────────────────────────────────────── */}
      <div
        className={cn(
          'border-b transition-all duration-300',
          transparentHeader
            ? 'border-transparent bg-transparent'
            : marketplaceNav
              ? cn('border-neutral-200 bg-white', isScrolled && 'shadow-md')
              : cn(
                'bg-white',
                isScrolled ? 'shadow-lg' : 'border-stone-200'
              )
        )}
      >
        {/* Marketplace Service Strip - Only visible when scrolled */}
        {isScrolled && showServiceStrip && marketplaceNav && (
          <div className="hidden border-b border-neutral-100 bg-neutral-50/80 lg:block">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-1.5">
              <nav
                className="flex flex-wrap items-center justify-center gap-x-5 text-[10px] font-semibold text-neutral-600"
                aria-label="Motoring services"
              >
                <Link
                  href={`${storeRoot}#resources`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-neutral-900"
                >
                  <Gauge className="h-3 w-3" style={{ color: accent }} aria-hidden />
                  COE results
                </Link>
                <span className="text-neutral-300" aria-hidden>|</span>
                <Link
                  href={`${storeRoot}/contact?sell=1`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-neutral-900"
                >
                  <Percent className="h-3 w-3" style={{ color: accent }} aria-hidden />
                  Free valuation
                </Link>
                <span className="text-neutral-300" aria-hidden>|</span>
                <Link
                  href={`${storeRoot}/contact?finance=1`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-neutral-900"
                >
                  <Calendar className="h-3 w-3" style={{ color: accent }} aria-hidden />
                  Car loan
                </Link>
                <span className="text-neutral-300" aria-hidden>|</span>
                <Link
                  href={`${storeRoot}/contact?insurance=1`}
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-neutral-900"
                >
                  <Shield className="h-3 w-3" style={{ color: accent }} aria-hidden />
                  Insurance
                </Link>
                <span className="text-neutral-300" aria-hidden>|</span>
                <span className="inline-flex items-center gap-1.5 text-neutral-500">
                  <Shield className="h-3 w-3" style={{ color: accent }} aria-hidden />
                  Verified listings
                </span>
              </nav>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-8">
          {/* Mobile, Zellbury-style on editorial stores */}
          {immersiveNav && (
          <div className="flex h-14 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center',
                transparentHeader ? 'text-white' : 'text-gray-700'
              )}
              aria-label="Open menu"
            >
              <EditorialMenuIcon />
            </button>

            <Link
              href={storeRoot}
              className={cn(
                'flex min-w-0 flex-1 items-center justify-center gap-2 truncate',
                transparentHeader ? 'text-white' : 'text-gray-900'
              )}
              aria-label={business?.business_name || 'Store home'}
            >
              <StorefrontBrandMark
                business={business}
                settings={settings}
                accent={accent}
                size="sm"
                nameClassName={cn(
                  'truncate text-sm font-bold uppercase tracking-[0.22em]',
                  transparentHeader ? 'text-white' : 'text-gray-900'
                )}
                logoClassName="rounded-lg object-contain"
              />
            </Link>

            <div className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className={cn(
                  'flex h-10 w-10 items-center justify-center',
                  transparentHeader ? 'text-white' : 'text-gray-700'
                )}
                aria-label="Search"
              >
                <Search className="h-5 w-5" strokeWidth={1.75} />
              </button>
              <Link
                href={`/store/${businessDomain}/orders`}
                className={cn(
                  'flex h-10 w-10 items-center justify-center',
                  transparentHeader ? 'text-white' : 'text-gray-700'
                )}
                aria-label="My Orders"
              >
                <User className="h-5 w-5" strokeWidth={1.75} />
              </Link>
              <Link
                href={`/store/${businessDomain}/cart`}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center',
                  transparentHeader ? 'text-white' : 'text-gray-700'
                )}
                aria-label={`Cart (${cartItemCount} items)`}
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                {cartItemCount > 0 && (
                  <span
                    className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-black text-white"
                    style={{ backgroundColor: accent }}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
          )}

          {/* Mobile, default compact row */}
          {!immersiveNav && (
          <div className="flex h-11 items-center gap-2 lg:hidden">
            <Link
              href={storeRoot}
              className="flex shrink-0 items-center"
              aria-label={business?.business_name || 'Store home'}
            >
              <StorefrontBrandMark
                business={business}
                settings={settings}
                accent={accent}
                size="sm"
                compact
                logoClassName="rounded-lg object-cover"
              />
            </Link>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-full bg-gray-100 px-3 text-left text-xs text-gray-500"
              aria-label={searchPlaceholder}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{searchPlaceholder}</span>
            </button>

            <Link
              href={`/store/${businessDomain}/cart`}
              className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-700"
              aria-label={`Cart (${cartItemCount} items)`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartItemCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-black text-white"
                  style={{ backgroundColor: accent }}
                >
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-700"
              aria-label="Open menu"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          </div>
          )}

          {/* Desktop */}
          <div
            className={cn(
              'relative hidden items-center justify-between gap-4 transition-all duration-200 lg:flex',
              (editorialNav || jewelleryNav)
                ? (isScrolled ? 'py-2.5' : 'py-4')
                : isScrolled
                  ? 'py-2.5'
                  : 'py-4'
            )}
          >
            {dealershipNav ? (
              <>
                <Link href={storeRoot} className="flex shrink-0 items-center gap-2">
                  <StorefrontBrandMark
                    business={business}
                    settings={settings}
                    accent={accent}
                    size="md"
                    nameClassName={cn(
                      'text-sm font-bold uppercase tracking-[0.2em]',
                      transparentHeader ? 'text-white' : 'text-gray-900'
                    )}
                    logoClassName="object-contain sm:h-8 sm:w-auto"
                  />
                </Link>

                <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
                  {dealershipPrimaryLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className={cn(
                        'whitespace-nowrap px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors xl:px-3 xl:text-xs',
                        transparentHeader
                          ? 'text-white/90 hover:text-white'
                          : 'text-gray-700 hover:text-gray-900'
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {dealershipSecondaryLinks.length > 0 ? (
                    <div className="relative" ref={dealershipMoreRef}>
                      <button
                        type="button"
                        onClick={() => setDealershipMoreOpen((v) => !v)}
                        className={cn(
                          'inline-flex items-center gap-1 whitespace-nowrap px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors xl:px-3 xl:text-xs',
                          transparentHeader
                            ? 'text-white/90 hover:text-white'
                            : 'text-gray-700 hover:text-gray-900'
                        )}
                        aria-expanded={dealershipMoreOpen}
                      >
                        More
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 transition-transform',
                            dealershipMoreOpen && 'rotate-180'
                          )}
                        />
                      </button>
                      {dealershipMoreOpen ? (
                        <div className="absolute left-1/2 top-full z-50 mt-1 w-52 -translate-x-1/2 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                          {dealershipSecondaryLinks.map((link) => (
                            <Link
                              key={link.id}
                              href={link.href}
                              onClick={() => setDealershipMoreOpen(false)}
                              className="block px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-50 hover:text-gray-900"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </nav>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className={cn(
                      'p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                  <Link
                    href={`/store/${businessDomain}/orders`}
                    className={cn(
                      'p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label="Account"
                  >
                    <User className="w-5 h-5" strokeWidth={1.75} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={cn(
                      'p-2.5 lg:hidden',
                      transparentHeader ? 'text-white' : 'text-gray-700'
                    )}
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : marketplaceNav ? (
              <>
                <Link href={storeRoot} className="flex shrink-0 items-center gap-2">
                  <StorefrontBrandMark
                    business={business}
                    settings={settings}
                    accent="#E30613"
                    size="md"
                    nameClassName="text-base font-bold tracking-tight text-[#E30613]"
                    logoClassName="h-9 w-auto object-contain"
                  />
                </Link>

                <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex" style={{ '--store-accent': accent }}>
                  {marketplaceLinks.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 transition hover:text-[color:var(--store-accent)] xl:text-[11px]"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2.5 text-neutral-700 transition hover:text-[#003DA5]"
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                  <Link
                    href={`/store/${businessDomain}/cart`}
                    className="relative p-2.5 text-neutral-700 transition hover:text-[#003DA5]"
                    aria-label={`Cart (${cartItemCount} items)`}
                  >
                    <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
                    {cartItemCount > 0 && (
                      <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#E30613] px-0.5 text-[9px] font-black text-white">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/store/${businessDomain}/orders`}
                    className="hidden p-2.5 text-neutral-700 transition hover:text-[#003DA5] sm:block"
                    aria-label="Login / Dashboard"
                  >
                    <User className="w-5 h-5" strokeWidth={1.75} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2.5 text-neutral-700 transition lg:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : pharmacyNav ? (
              <>
                <Link href={storeRoot} className="flex shrink-0 items-center gap-2">
                  <StorefrontBrandMark
                    business={business}
                    settings={settings}
                    displayName={pharmacyDisplayName}
                    accent={accent}
                    size="md"
                    nameClassName="text-base font-bold tracking-tight text-emerald-700"
                    logoClassName="h-9 w-auto object-contain"
                  />
                </Link>

                {!pharmacyOnHome ? (
                  <div className="mx-auto hidden min-w-0 max-w-xl flex-1 px-4 lg:block">
                    <SearchBar businessDomain={businessDomain} />
                  </div>
                ) : (
                  <nav className="hidden flex-1 items-center justify-center gap-0.5 xl:flex">
                    {pharmacyLinks.slice(0, 6).map((link) => (
                      <Link
                        key={link.id}
                        href={link.href}
                        className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:text-emerald-700"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>
                )}

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className={cn('p-2.5 text-slate-700 transition hover:text-emerald-700', !pharmacyOnHome && 'lg:hidden')}
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                  <Link
                    href={`${storeRoot}/contact?prescription=1`}
                    className="hidden items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 sm:inline-flex"
                  >
                    <FileUp className="h-3.5 w-3.5" aria-hidden />
                    Upload Rx
                  </Link>
                  <Link
                    href={`/store/${businessDomain}/cart`}
                    className="relative p-2.5 text-slate-700 transition hover:text-emerald-700"
                    aria-label={`Cart (${cartItemCount} items)`}
                  >
                    <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
                    {cartItemCount > 0 && (
                      <span
                        className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-0.5 text-[9px] font-black text-white"
                        style={{ backgroundColor: accent }}
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href={`/store/${businessDomain}/orders`}
                    className="hidden p-2.5 text-slate-700 transition hover:text-emerald-700 sm:block"
                    aria-label="Account"
                  >
                    <User className="w-5 h-5" strokeWidth={1.75} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2.5 text-slate-700 xl:hidden"
                    aria-label="Open menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : editorialNav || jewelleryNav ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center',
                    transparentHeader ? 'text-white' : 'text-gray-800'
                  )}
                  aria-label="Open menu"
                >
                  <EditorialMenuIcon />
                </button>

                <Link
                  href={storeRoot}
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2',
                    transparentHeader ? 'text-white' : 'text-gray-900'
                  )}
                >
                  <StorefrontBrandMark
                    business={business}
                    settings={settings}
                    accent={accent}
                    size="sm"
                    nameClassName={cn(
                      'text-base font-bold uppercase tracking-[0.28em]',
                      transparentHeader ? 'text-white' : 'text-gray-900'
                    )}
                  />
                </Link>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className={cn(
                      'p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                  <Link
                    href={`/store/${businessDomain}/orders`}
                    className={cn(
                      'p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label="My Orders"
                  >
                    <User className="w-5 h-5" strokeWidth={1.75} />
                  </Link>
                  <Link
                    href={`/store/${businessDomain}/cart`}
                    className={cn(
                      'relative p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label={`Cart (${cartItemCount} items)`}
                  >
                    <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
                    {cartItemCount > 0 && (
                      <span
                        className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-black px-1"
                        style={{ backgroundColor: accent }}
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                </div>
              </>
            ) : editorialNav ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center',
                    transparentHeader ? 'text-white' : 'text-gray-800'
                  )}
                  aria-label="Open menu"
                >
                  <EditorialMenuIcon />
                </button>

                <Link
                  href={storeRoot}
                  className={cn(
                    'absolute left-1/2 -translate-x-1/2',
                    transparentHeader ? 'text-white' : 'text-gray-900'
                  )}
                >
                  <StorefrontBrandMark
                    business={business}
                    settings={settings}
                    accent={accent}
                    size="sm"
                    nameClassName={cn(
                      'text-base font-bold uppercase tracking-[0.28em]',
                      transparentHeader ? 'text-white' : 'text-gray-900'
                    )}
                  />
                </Link>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    className={cn(
                      'p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label="Search"
                  >
                    <Search className="w-5 h-5" strokeWidth={1.75} />
                  </button>
                  <Link
                    href={`/store/${businessDomain}/orders`}
                    className={cn(
                      'p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label="My Orders"
                  >
                    <User className="w-5 h-5" strokeWidth={1.75} />
                  </Link>
                  <Link
                    href={`/store/${businessDomain}/cart`}
                    className={cn(
                      'relative p-2.5 transition-colors',
                      transparentHeader ? 'text-white hover:text-white/80' : 'text-gray-700 hover:text-gray-900'
                    )}
                    aria-label={`Cart (${cartItemCount} items)`}
                  >
                    <ShoppingBag className="w-5 h-5" strokeWidth={1.75} />
                    {cartItemCount > 0 && (
                      <span
                        className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-black px-1"
                        style={{ backgroundColor: accent }}
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                  </Link>
                </div>
              </>
            ) : (
              <>
            {/* ── Logo ─────────────────────────────────────────────────── */}
            <Link
              href={`/store/${businessDomain}`}
              className="flex items-center gap-2.5 flex-shrink-0 group"
            >
              <StorefrontBrandMark
                business={business}
                settings={settings}
                accent={accent}
                size={isScrolled ? 'sm' : 'md'}
                nameClassName={cn(
                  'truncate text-gray-900 transition-all duration-200 group-hover:opacity-80',
                  isScrolled ? 'text-base' : 'text-lg'
                )}
                logoClassName={cn(
                  'w-auto object-contain transition-all duration-200',
                  isScrolled ? 'h-7' : 'h-9'
                )}
              />
            </Link>

            {/* ── Desktop Category Nav ──────────────────────────────────── */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              <Link
                href={storeRoot}
                className={cn(
                  'px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap',
                  isHome ? 'text-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
                style={isHome ? { backgroundColor: accent } : {}}
              >
                Home
              </Link>
              <Link
                href={`/store/${businessDomain}/products`}
                className={cn(
                  'px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap',
                  isActive(`/store/${businessDomain}/products`)
                    ? 'text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                )}
                style={isActive(`/store/${businessDomain}/products`) ? { backgroundColor: accent } : {}}
              >
                All Products
              </Link>

              {visibleCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${businessDomain}/products?category=${cat.slug}`}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}

              {extraCategories.length > 0 && (
                <div className="relative" ref={categoryRef}>
                  <button
                    onClick={() => setCategoryMenuOpen((v) => !v)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    More
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        categoryMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {categoryMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                      {extraCategories.map((cat) => (
                        <Link
                          key={cat.id}
                          href={`/store/${businessDomain}/products?category=${cat.slug}`}
                          onClick={() => setCategoryMenuOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </nav>

            {/* ── Actions ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden lg:flex p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Wishlist, desktop only */}
              <Link
                href={`/store/${businessDomain}/account/wishlist`}
                className="relative hidden sm:flex p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label={`Wishlist (${wishlistCount} items)`}
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-black px-1"
                    style={{ backgroundColor: accent }}
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </Link>

              {/* Account, desktop only */}
              <Link
                href={`/store/${businessDomain}/orders`}
                className="hidden sm:flex p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="My Orders"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link
                href={`/store/${businessDomain}/cart`}
                className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label={`Cart (${cartItemCount} items)`}
              >
                <ShoppingBag className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-white text-[10px] font-black px-1"
                    style={{ backgroundColor: accent }}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Link>
            </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* ── Search Overlay ─────────────────────────────────────────────── */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-14 lg:pt-20 px-3 sm:px-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-semibold text-gray-900 flex-1 text-sm sm:text-base">
                {searchPlaceholder}
              </h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <SearchBar
              businessDomain={businessDomain}
              onClose={() => setIsSearchOpen(false)}
            />
          </div>
        </div>
      )}
      {/* ── Mobile Nav ─────────────────────────────────────────────────── */}
      {jewelleryNav ? (
        <JewelleryMobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          businessDomain={businessDomain}
          business={business}
          categories={categories}
          settings={settings}
          accent={accent}
          canonical={canonical}
        />
      ) : editorialNav ? (
        <FashionMobileNav
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          businessDomain={businessDomain}
          business={business}
          categories={categories}
          contact={contact}
          canonical={canonical}
        />
      ) : (
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        categories={categories}
        businessDomain={businessDomain}
        accent={accent}
        navLinks={dealershipNav ? dealershipLinks : marketplaceNav ? marketplaceLinks : undefined}
      />
      )}
    </header>
  );
}
