'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, ChevronRight, Sparkles, Star, Gift, Package, Circle, Heart, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { StorefrontBrandMark } from '@/components/storefront/StorefrontBrandMark';
import { getJewelleryEditorialNav, getJewelleryStorefrontConfig, getStoreMode } from '@/lib/storefront/jewelleryStorefront';

const ICONS = {
  sparkles: Sparkles,
  star: Star,
  gift: Gift,
  package: Package,
  circle: Circle,
  heart: Heart,
  gem: Star,
};

/**
 * Jewelry / Beauty mobile navigation — premium slide-in drawer with category tabs,
 * promo banners, and mode-aware quick links.
 */
export function JewelleryMobileNav({
  isOpen,
  onClose,
  business,
  businessDomain,
  categories = [],
  settings = {},
  accent = '#c9a227',
  canonical,
}) {
  const base = `/store/${businessDomain}`;
  const businessCategory = business?.category || canonical;
  const mode = getStoreMode(businessCategory);
  const config = getJewelleryStorefrontConfig(settings, businessDomain, businessCategory);
  const nav = getJewelleryEditorialNav(base, categories, businessCategory);

  const [activeTab, setActiveTab] = useState(nav.tabs[0]?.id);
  const activeCategories = nav.tabs.find((t) => t.id === activeTab)?.categories || nav.tabs[0]?.categories || [];

  const signatureLabel = config.signaturePiecesTitle || (mode === 'beauty' ? 'Best Sellers' : 'Signature Pieces');
  const displayName = business?.business_name || (mode === 'beauty' ? 'Beauty Store' : 'Jewelry Store');

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 left-0 z-[101] flex w-full max-w-sm flex-col bg-white shadow-2xl">
        <div
          className="flex items-center justify-between border-b px-4 py-4"
          style={{ borderColor: `${accent}20` }}
        >
          <StorefrontBrandMark
            business={business}
            settings={settings}
            displayName={displayName}
            accent={accent}
            size="sm"
            nameClassName="text-base font-bold text-stone-900"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {nav.promos.length > 0 && (
            <div className="border-b border-stone-100 p-4">
              <div className="grid grid-cols-2 gap-3">
                {nav.promos.map((promo, i) => (
                  <Link
                    key={i}
                    href={promo.href}
                    onClick={onClose}
                    className="group relative aspect-[4/5] overflow-hidden rounded-lg"
                  >
                    <SmartProductImage
                      src={promo.image}
                      alt={promo.title}
                      fill
                      sizes="(max-width: 640px) 40vw, 20vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3 text-white">
                      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">
                        {promo.subtitle}
                      </p>
                      <p className="mt-0.5 text-xs font-bold leading-tight">{promo.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {nav.tabs.length > 1 && (
            <div className="flex border-b border-stone-200 px-4">
              {nav.tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                    activeTab === tab.id ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div
                      className="absolute inset-x-0 bottom-0 h-0.5"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="p-4">
            <div className="space-y-1">
              {activeCategories.map((cat) => {
                const Icon = ICONS[cat.icon] || Circle;
                return (
                  <Link
                    key={cat.id}
                    href={cat.href}
                    onClick={onClose}
                    className="group flex items-center justify-between rounded-lg px-3 py-2.5 transition-all hover:bg-stone-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                        style={{ backgroundColor: `${accent}10` }}
                      >
                        <Icon
                          className="h-4 w-4 transition-colors group-hover:scale-110"
                          style={{ color: accent }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-stone-700 group-hover:text-stone-900">
                        {cat.label}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-stone-600" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-stone-100 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-stone-500">Quick Links</p>
            <div className="space-y-1">
              <Link
                href={`${base}/products?sort=newest`}
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-900"
              >
                {config.newArrivalsTitle || 'New Arrivals'}
              </Link>
              <Link
                href={`${base}/products?onSale=true`}
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-900"
              >
                {config.offersTitle || 'Special Offers'}
              </Link>
              <Link
                href={`${base}/products?sort=featured`}
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-900"
              >
                {signatureLabel}
              </Link>
              <Link
                href={`${base}/contact`}
                onClick={onClose}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:text-stone-900"
              >
                {config.consultationCtaLabel || 'Contact Us'}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`${base}/cart`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-stone-50"
              style={{ borderColor: `${accent}30`, color: accent }}
            >
              <ShoppingBag className="h-4 w-4" />
              Cart
            </Link>
            <Link
              href={`${base}/orders`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              <User className="h-4 w-4" />
              Account
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
