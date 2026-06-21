import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBusinessByDomain } from '@/lib/actions/storefront/business';
import { getProducts, getCategories } from '@/lib/actions/storefront/products';
import { ProductGrid } from '@/components/storefront/ProductGrid';
import { ProductsSkeleton } from '@/components/storefront/LoadingSkeletons';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { formatCurrency } from '@/lib/currency';
import { getDomainConfig, getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { getEffectiveProductImageUrl } from '@/lib/storefront/productImageFallback';
import { getMergedStorefrontHero } from '@/lib/storefront/mergeHero';
import { getStoreHomeCopy } from '@/lib/storefront/storeCopy';
import { resolveStoreContact } from '@/lib/storefront/businessContact';
import { StoreBuyerSupportStrip } from '@/components/storefront/StoreBuyerSupportStrip';
import {
  Truck, Shield, RotateCcw, Star, Zap, Leaf, Clock, Gift,
  Lock, Tag, ArrowRight, ChevronRight, Package, Sparkles,
  ShoppingBag
} from 'lucide-react';

export async function generateMetadata({ params }) {
  const { businessDomain } = await params;
  const result = await getBusinessByDomain(businessDomain);
  if (!result.success) return { title: 'Store Not Found' };
  const { business } = result;
  return {
    title: `${business.business_name} — Online Store`,
    description: business.description || `Shop online at ${business.business_name}. Browse our collection of quality products.`,
    keywords: `${business.business_name}, online store, shop, ${business.city || ''}`,
    openGraph: {
      title: business.business_name,
      description: business.description,
      type: 'website',
      images: business.logo_url?.startsWith('https://') ? [{ url: business.logo_url }] : [],
    },
  };
}

// ─── Icon map for trust badges ────────────────────────────────────────────────
const BADGE_ICONS = {
  truck: Truck, shield: Shield, refresh: RotateCcw, star: Star,
  zap: Zap, leaf: Leaf, clock: Clock, gift: Gift, lock: Lock,
  tag: Tag, user: Shield, package: Package,
};

function StoreSectionHeader({ title, subtitle, href, accent, linkLabel = 'View all' }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5">
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold text-gray-900 sm:text-xl">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="flex shrink-0 items-center gap-0.5 text-xs font-semibold sm:text-sm"
          style={{ color: accent }}
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}

export default async function StoreHomePage({ params }) {
  const { businessDomain } = await params;

  const businessResult = await getBusinessByDomain(businessDomain);
  if (!businessResult.success) notFound();

  const { business, settings } = businessResult;
  const storeCurrency = settings?.currency || 'PKR';
  const domainCfg = getDomainConfig(business.category);
  const accent = getStoreAccentColor(settings, business.category);
  const accentDark = domainCfg.accentDark;
  const accentLight = domainCfg.accentLight;
  const hero = getMergedStorefrontHero({ settings, domainCfg, business });
  const copy = getStoreHomeCopy(business, domainCfg);
  const contact = resolveStoreContact({ business, settings });

  const [featuredResult, newArrivalsResult, categoriesResult, onSaleResult] = await Promise.all([
    getProducts(business.id, { limit: 8, sort: 'featured' }),
    getProducts(business.id, { limit: 8, sort: 'newest' }),
    getCategories(business.id),
    getProducts(business.id, { limit: 4, onSale: true }),
  ]);

  const featuredProducts = featuredResult.success ? featuredResult.products : [];
  const newArrivalsRaw = newArrivalsResult.success ? newArrivalsResult.products : [];
  const categories = categoriesResult.success ? categoriesResult.categories : [];
  const onSaleProductsRaw = onSaleResult.success ? onSaleResult.products : [];

  const featuredIds = new Set(featuredProducts.map((p) => p.id));
  const newArrivals = newArrivalsRaw.filter((p) => !featuredIds.has(p.id));
  const homepagePriorIds = new Set([...featuredIds, ...newArrivals.map((p) => p.id)]);
  const onSaleProducts = onSaleProductsRaw.filter((p) => !homepagePriorIds.has(p.id)).slice(0, 8);

  const catalogTotal = featuredResult.total ?? newArrivalsResult.total ?? featuredProducts.length;
  const showNewArrivals = newArrivals.length > 0 && catalogTotal > featuredProducts.length;

  const heroImage = business.cover_image_url || domainCfg.heroImage;
  const freeShippingThreshold = settings?.freeShippingThreshold || 2000;
  const returnDays = settings?.returnPolicyDays || 7;

  return (
    <div className="min-h-screen bg-slate-50 antialiased text-slate-900 selection:bg-slate-200">

      {/* ── Announcement Banner ─────────────────────────────────────────────── */}
      {hero.banner ? (
        <div
          className="md:hidden text-white text-center py-2 px-4 text-xs font-medium truncate"
          style={{ backgroundColor: accent }}
        >
          {hero.banner}
        </div>
      ) : null}

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[240px] sm:min-h-[380px] lg:min-h-[520px]">
        {/* Background */}
        <div className="absolute inset-0">
          {heroImage ? (
            <SmartProductImage
              src={heroImage}
              alt={business.business_name}
              fill
              className="object-cover"
            />
          ) : (
            <div style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)` }} className="w-full h-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-4 sm:mb-6 max-w-full">
              {business.logo_url ? (
                <SmartProductImage src={business.logo_url} alt="" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover" width={20} height={20} />
              ) : (
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold"
                  style={{ backgroundColor: accent }}>
                  {business.business_name?.charAt(0)}
                </div>
              )}
              <span className="text-white/90 text-xs sm:text-sm font-medium truncate">{business.business_name}</span>
              {business.is_verified && (
                <span className="hidden sm:inline bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">Verified</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-2 sm:mb-4 tracking-tight">
              {hero.title}
            </h1>
            {hero.subtitle ? (
              <p className="text-sm sm:text-xl text-white/85 mb-4 sm:mb-8 leading-relaxed max-w-xl line-clamp-2 sm:line-clamp-none">
                {hero.subtitle}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Link
                href={`/store/${businessDomain}/products`}
                className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-white text-sm sm:text-lg shadow-xl transition-all active:scale-[0.98] sm:hover:scale-105"
                style={{ backgroundColor: accent }}
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {copy.heroCta}
              </Link>
              {categories.length > 0 && (
                <Link
                  href={`/store/${businessDomain}/products?category=${categories[0]?.slug}`}
                  className="hidden sm:inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white text-lg bg-white/15 backdrop-blur-sm border border-white/30 hover:bg-white/25 transition-all"
                >
                  Browse Categories
                  <ChevronRight className="w-5 h-5" />
                </Link>
              )}
            </div>

            {/* Quick stats — desktop only (mobile: footer / policies) */}
            <div className="hidden sm:flex flex-wrap gap-6 mt-10">
              {[
                { label: `${featuredResult.total || featuredProducts.length}+ Products`, icon: Package },
                {
                  label: `Free shipping over ${formatCurrency(freeShippingThreshold, storeCurrency)}`,
                  icon: Truck,
                },
                { label: `${returnDays}-Day Returns`, icon: RotateCcw },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-2 text-white/80 text-sm">
                  <stat.icon className="w-4 h-4" />
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating product preview cards (desktop only) */}
        {featuredProducts.length >= 2 && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3">
            {featuredProducts.slice(0, 2).map((product) => {
              const previewSrc = getEffectiveProductImageUrl(product, business.category);
              return (
              <Link
                key={product.id}
                href={`/store/${businessDomain}/products/${product.slug || product.id}`}
                className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 w-64"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                  {previewSrc ? (
                    <SmartProductImage
                      src={previewSrc}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-sm font-bold" style={{ color: accent }}>
                    {formatCurrency(Number(product.price), storeCurrency)}
                  </p>
                </div>
              </Link>
            );
            })}
          </div>
        )}
      </section>

      {/* ── Category Chips ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto py-3 sm:py-4 scrollbar-hide">
              <Link
                href={`/store/${businessDomain}/products`}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all border-2 text-white"
                style={{ backgroundColor: accent, borderColor: accent }}
              >
                <ShoppingBag className="w-4 h-4" />
                All Products
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${businessDomain}/products?category=${cat.slug}`}
                  className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-current transition-all bg-white"
                  style={{ '--hover-color': accent }}
                >
                  {cat.image_url && (
                    <div className="relative w-4 h-4 rounded-full overflow-hidden">
                      <SmartProductImage src={cat.image_url} alt="" fill className="object-cover" />
                    </div>
                  )}
                  {cat.name}
                  {cat.product_count > 0 && (
                    <span className="text-xs text-gray-400">({cat.product_count})</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Trust Badges (tablet+) ─────────────────────────────────────────── */}
      <section className="hidden md:block bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {domainCfg.trustBadges.map((badge, i) => {
              const Icon = BADGE_ICONS[badge.icon] || Shield;
              return (
                <div key={i} className="flex items-center gap-4 group">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: accentLight }}
                  >
                    <Icon className="w-6 h-6" style={{ color: accent }} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{badge.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{badge.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Category Cards Grid (tablet+) — chips cover mobile ─────────────── */}
      {categories.length >= 3 && (
        <section className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Shop by Category</h2>
              <p className="text-gray-500 text-sm mt-1">Find exactly what you are looking for</p>
            </div>
            <Link
              href={`/store/${businessDomain}/products`}
              className="flex items-center gap-1 text-sm font-semibold hover:gap-2 transition-all"
              style={{ color: accent }}
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((cat, i) => {
              // Curated fallback images per index
              const fallbackImages = [
                'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&q=80&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&q=80&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300&q=80&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80&auto=format&fit=crop',
              ];
              const imgSrc = cat.image_url || fallbackImages[i % fallbackImages.length];

              return (
                <Link
                  key={cat.id}
                  href={`/store/${businessDomain}/products?category=${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl aspect-square bg-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  <SmartProductImage
                    src={imgSrc}
                    alt={cat.name}
                    fill
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-bold text-sm leading-tight">{cat.name}</p>
                    {cat.product_count > 0 && (
                      <p className="text-white/70 text-xs mt-0.5">{cat.product_count} items</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Featured / primary catalog ───────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
          <StoreSectionHeader
            title={copy.featuredTitle}
            subtitle={copy.featuredSubtitle}
            href={`/store/${businessDomain}/products?sort=featured`}
            accent={accent}
          />
          <Suspense fallback={<ProductsSkeleton count={8} />}>
            <ProductGrid products={featuredProducts} businessDomain={businessDomain} showResultsCount={false} />
          </Suspense>
        </section>
      )}

      {/* ── Fallback primary grid when no featured flag ──────────────────── */}
      {featuredProducts.length === 0 && newArrivalsRaw.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
          <StoreSectionHeader
            title={copy.shopAllTitle}
            subtitle={copy.shopAllSubtitle}
            href={`/store/${businessDomain}/products`}
            accent={accent}
          />
          <Suspense fallback={<ProductsSkeleton count={8} />}>
            <ProductGrid products={newArrivalsRaw.slice(0, 8)} businessDomain={businessDomain} showResultsCount={false} />
          </Suspense>
        </section>
      )}

      {/* ── Promotional Banner (desktop — avoids duplicate free-shipping on mobile) */}
      <section className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12"
          style={{ background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)` }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-3">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-bold">Special Offer</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                Free shipping on orders over {formatCurrency(freeShippingThreshold, storeCurrency)}
              </h3>
              <p className="text-white/80">
                Shop more, save more. No promo code needed.
              </p>
            </div>
            <Link
              href={`/store/${businessDomain}/products`}
              className="flex-shrink-0 inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl hover:bg-gray-50 transition-all hover:scale-105 shadow-xl"
              style={{ color: accent }}
            >
              Shop Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── New Arrivals (only when catalog has more beyond featured) ───────── */}
      {showNewArrivals && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
          <StoreSectionHeader
            title={copy.newArrivalsTitle}
            subtitle={copy.newArrivalsSubtitle}
            href={`/store/${businessDomain}/products?sort=newest`}
            accent={accent}
          />
          <Suspense fallback={<ProductsSkeleton count={8} />}>
            <ProductGrid products={newArrivals} businessDomain={businessDomain} showResultsCount={false} />
          </Suspense>
        </section>
      )}

      {/* ── On Sale Section ──────────────────────────────────────────────────── */}
      {onSaleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
          <StoreSectionHeader
            title={copy.onSaleTitle}
            subtitle={copy.onSaleSubtitle}
            href={`/store/${businessDomain}/products?onSale=true`}
            accent={accent}
            linkLabel="All deals"
          />
          <Suspense fallback={<ProductsSkeleton count={4} />}>
            <ProductGrid products={onSaleProducts} businessDomain={businessDomain} showResultsCount={false} />
          </Suspense>
        </section>
      )}

      {/* ── Mobile buyer support ───────────────────────────────────────────── */}
      <StoreBuyerSupportStrip businessDomain={businessDomain} accent={accent} />

      {/* ── Store Info Strip (large screens — footer covers mobile) ─────────── */}
      {contact.hasAnyContact && (
        <section className="hidden lg:block bg-gray-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {business.logo_url ? (
                  <SmartProductImage src={business.logo_url} alt={business.business_name} width={120} height={40} className="h-10 w-auto object-contain" />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
                    style={{ backgroundColor: accent }}
                  >
                    {business.business_name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{business.business_name}</p>
                  {contact.city && (
                    <p className="text-gray-400 text-sm">
                      {contact.city}
                      {contact.country ? `, ${contact.country}` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors">
                    {contact.email}
                  </a>
                )}
                <Link href={`/store/${businessDomain}/contact`} className="hover:text-white transition-colors">
                  Contact page →
                </Link>
              </div>

              <Link
                href={`/store/${businessDomain}/products`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ backgroundColor: accent }}
              >
                <ShoppingBag className="w-4 h-4" />
                Start Shopping
              </Link>
            </div>
          </div>
        </section>
      )}

      {featuredProducts.length === 0 &&
        newArrivalsRaw.length === 0 &&
        onSaleProducts.length === 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6" style={{ backgroundColor: accentLight }}>
            <Package className="w-8 h-8 sm:w-12 sm:h-12" style={{ color: accent }} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{copy.emptyTitle}</h2>
          <p className="text-sm text-gray-500 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            {copy.emptyBody}
          </p>
          {(contact.phone || contact.whatsappUrl) && (
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white sm:px-6 sm:py-3"
                  style={{ backgroundColor: accent }}
                >
                  Call {copy.storeName}
                </a>
              ) : null}
              <Link
                href={`/store/${businessDomain}/contact`}
                className="text-sm font-semibold hover:underline"
                style={{ color: accent }}
              >
                Contact us →
              </Link>
            </div>
          )}
          {!contact.phone && !contact.whatsappUrl && (
            <Link
              href={`/store/${businessDomain}/contact`}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white sm:px-6 sm:py-3"
              style={{ backgroundColor: accent }}
            >
              Contact {copy.storeName}
            </Link>
          )}
        </section>
      )}

    </div>
  );
}
