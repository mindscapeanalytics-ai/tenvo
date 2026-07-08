'use client';

import Link from 'next/link';
import { ChevronRight, Package, RotateCcw, ShoppingBag, Truck } from 'lucide-react';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { HeroCarousel } from '@/components/storefront/sections/heroes/HeroCarousel';
import { formatCurrency } from '@/lib/currency';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';

function HeroFloatingPreviews({ featuredProducts, businessDomain, accent, businessCategory, storeCurrency }) {
  if (featuredProducts.length < 2) return null;

  return (
    <div className="absolute right-8 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 xl:flex">
      {featuredProducts.slice(0, 2).map((product) => {
        const previewSrc = getEffectiveProductImageUrl(product, businessCategory);
        return (
          <Link
            key={product.id}
            href={`/store/${businessDomain}/products/${product.slug || product.id}`}
            className="flex w-64 items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-xl backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-2xl"
          >
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
              {previewSrc ? (
                <SmartProductImage src={previewSrc} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm font-bold" style={{ color: accent }}>
                {formatCurrency(Number(product.price), storeCurrency)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function HeroQuickStats({ productCount, freeShippingThreshold, returnDays, storeCurrency }) {
  return (
    <div className="mt-10 hidden flex-wrap gap-6 sm:flex">
      {[
        { label: `${productCount}+ Products`, icon: Package },
        {
          label: `Free shipping over ${formatCurrency(freeShippingThreshold, storeCurrency)}`,
          icon: Truck,
        },
        { label: `${returnDays}-Day Returns`, icon: RotateCcw },
      ].map((stat) => (
        <div key={stat.label} className="flex items-center gap-2 text-sm text-white/80">
          <stat.icon className="h-4 w-4" />
          <span>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

function HeroStoreBadge({ business, accent }) {
  return (
    <div className="mb-4 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 backdrop-blur-sm sm:mb-6">
      {business?.logo_url ? (
        <SmartProductImage
          src={business.logo_url}
          alt=""
          className="h-4 w-4 rounded-full object-cover sm:h-5 sm:w-5"
          width={20}
          height={20}
        />
      ) : (
        <div
          className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white sm:h-5 sm:w-5 sm:text-xs"
          style={{ backgroundColor: accent }}
        >
          {business?.business_name?.charAt(0)}
        </div>
      )}
      <span className="truncate text-xs font-medium text-white/90 sm:text-sm">{business?.business_name}</span>
      {business?.is_verified ? (
        <span className="hidden rounded-full bg-white/20 px-2 py-0.5 text-xs text-white sm:inline">
          Verified
        </span>
      ) : null}
    </div>
  );
}

function HeroCtaRow({ businessDomain, heroCta, accent, categories }) {
  const firstCategorySlug = categories[0]?.slug;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <Link
        href={`/store/${businessDomain}/products`}
        className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-xl transition-all active:scale-[0.98] sm:rounded-2xl sm:px-8 sm:py-4 sm:text-lg sm:hover:scale-105"
        style={{ backgroundColor: accent }}
      >
        <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
        {heroCta}
      </Link>
      {firstCategorySlug ? (
        <Link
          href={`/store/${businessDomain}/products?category=${firstCategorySlug}`}
          className="hidden items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/25 sm:inline-flex"
        >
          Browse Categories
          <ChevronRight className="h-5 w-5" />
        </Link>
      ) : null}
    </div>
  );
}

export function RetailHomeHero({
  slides = [],
  accent,
  accentDark,
  business,
  hero,
  heroCta,
  businessDomain,
  businessCategory,
  categories = [],
  featuredProducts = [],
  productCount = 0,
  freeShippingThreshold = 2000,
  returnDays = 7,
  storeCurrency = 'PKR',
}) {
  const carouselSlides = slides.filter((slide) => slide?.image || slide?.title);
  const useCarousel = carouselSlides.length > 1 || carouselSlides.some((slide) => slide.image);

  if (useCarousel) {
    return (
      <section className="relative store-hero">
        <HeroCarousel
          slides={carouselSlides.map((slide) => ({
            ...slide,
            title: slide.title || hero.title,
            subtitle: slide.subtitle || hero.subtitle,
            ctaLabel: slide.ctaLabel || heroCta,
            ctaHref: slide.ctaHref || `/store/${businessDomain}/products`,
          }))}
          accent={accent}
          minHeight="min-h-[240px] sm:min-h-[380px] lg:min-h-[520px]"
          storeName={business?.business_name || ''}
        />
        <HeroFloatingPreviews
          featuredProducts={featuredProducts}
          businessDomain={businessDomain}
          accent={accent}
          businessCategory={businessCategory}
          storeCurrency={storeCurrency}
        />
      </section>
    );
  }

  const heroImage = carouselSlides[0]?.image || business?.cover_image_url;

  return (
    <section className="relative store-hero min-h-[240px] overflow-hidden sm:min-h-[380px] lg:min-h-[520px]">
      <div className="absolute inset-0">
        {heroImage ? (
          <SmartProductImage
            src={heroImage}
            alt={business?.business_name || 'Store'}
            fill
            className="object-cover"
          />
        ) : (
          <div
            style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)` }}
            className="h-full w-full"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/25" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-16 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <HeroStoreBadge business={business} accent={accent} />

          <h1 className="store-heading store-heading--inverse mb-2 text-2xl font-black leading-tight tracking-tight sm:mb-4 sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          {hero.subtitle ? (
            <p className="store-hero-subtitle mb-4 line-clamp-2 max-w-xl text-sm leading-relaxed sm:mb-8 sm:line-clamp-none sm:text-xl">
              {hero.subtitle}
            </p>
          ) : null}

          <HeroCtaRow
            businessDomain={businessDomain}
            heroCta={heroCta}
            accent={accent}
            categories={categories}
          />

          <HeroQuickStats
            productCount={productCount}
            freeShippingThreshold={freeShippingThreshold}
            returnDays={returnDays}
            storeCurrency={storeCurrency}
          />
        </div>
      </div>

      <HeroFloatingPreviews
        featuredProducts={featuredProducts}
        businessDomain={businessDomain}
        accent={accent}
        businessCategory={businessCategory}
        storeCurrency={storeCurrency}
      />
    </section>
  );
}
