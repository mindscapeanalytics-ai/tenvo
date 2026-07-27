/**
 * Shared marketing page for domain commercial packages (`/solutions/[slug]`).
 */
'use client';

import Link from 'next/link';
import Image from '@/components/marketing/ui/MarketingImage';
import * as LucideIcons from 'lucide-react';
import { ArrowRight, CheckCircle2, Quote } from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { MarketingSection } from '@/components/marketing/layout/MarketingSection';
import CTASection from '@/components/marketing/sections/CTASection';
import MarketingPillarCard from '@/components/marketing/ui/MarketingPillarCard';
import MarketingCtaLink from '@/components/marketing/ui/MarketingCtaLink';
import FAQSection from '@/components/marketing/sections/FAQSection';
import DomainPackageHeroShowcase from '@/components/marketing/solutions/DomainPackageHeroShowcase';
import DomainPackageCapabilitiesRow from '@/components/marketing/solutions/DomainPackageCapabilitiesRow';
import {
  MARKETING_EYEBROW,
  MARKETING_LEAD,
  MARKETING_SECTION_HEADING,
  MARKETING_STAT_LABEL,
  MARKETING_STAT_VALUE,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  getDomainPackageRegisterHref,
  mergePlanLimits,
} from '@/lib/config/domainPackages';
import { FEATURE_LABELS, PLAN_TIERS } from '@/lib/config/plans';
import { CAPABILITY_STATUS_LABEL, CAPABILITY_STATUS_STYLE } from '@/lib/marketing/capabilities';
import { formatCurrency } from '@/lib/currency';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';
import { getDemoStoreHeroByDomain, getDemoStoreHref } from '@/lib/marketing/demoStoreGalleryMeta';
import {
  buildUnifiedPackageSlides,
  enrichVerticalPresetSlides,
} from '@/lib/marketing/domainPackageVerticalMeta';

const MODULE_ICON_MAP = {
  catalog: 'Package',
  compliance: 'ShieldCheck',
  channels: 'Store',
  wholesale: 'Tags',
  operations: 'Warehouse',
  growth: 'Megaphone',
  inventory: 'Boxes',
  showroom: 'CarFront',
  service: 'Stethoscope',
  delivery: 'Truck',
  pharmacy: 'Pill',
  parts: 'Cog',
  furniture: 'Sofa',
  storefront: 'LayoutTemplate',
  coaching: 'CalendarCheck',
  counter: 'Store',
  'route-hisab': 'ClipboardList',
  chill: 'Snowflake',
  online: 'Globe',
};

const DEFAULT_MODULES_LEAD =
  'Honest status labels aligned with product capabilities and plan gates in the hub.';

function resolveLucideIcon(name, fallback = 'Package') {
  const key = typeof name === 'string' ? name : fallback;
  return LucideIcons[key] || LucideIcons[fallback] || LucideIcons.Package;
}

function SectionIntro({ eyebrow, title, lead, className }) {
  return (
    <div className={cn('mx-auto mb-8 max-w-3xl text-center sm:mb-10 lg:mb-12', className)}>
      <p className={cn(MARKETING_EYEBROW, 'mb-3')}>{eyebrow}</p>
      <h2 className={MARKETING_SECTION_HEADING}>{title}</h2>
      {lead ? <p className={cn(MARKETING_LEAD, 'mt-4')}>{lead}</p> : null}
    </div>
  );
}

function statusPill(status) {
  const label = CAPABILITY_STATUS_LABEL[status] || CAPABILITY_STATUS_LABEL.shipped;
  const style = CAPABILITY_STATUS_STYLE[status] || CAPABILITY_STATUS_STYLE.shipped;
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', style)}>
      {label}
    </span>
  );
}

/**
 * @param {import('@/lib/config/domainPackages').DomainPackageDefinition} pkg
 * @param {object} content
 */
export default function DomainPackageSolutionsPage({ pkg, content }) {
  if (!pkg) return null;

  const registerHref = getDomainPackageRegisterHref(pkg.key);
  const businessTier = PLAN_TIERS[pkg.recommendedPlanTier] || PLAN_TIERS.business;
  const limits = mergePlanLimits(pkg.recommendedPlanTier, pkg.limitOverrides);
  const fallbackHero = pkg.demoStoreDomain ? getDemoStoreHeroByDomain(pkg.demoStoreDomain) : '';
  const verticalSlides = enrichVerticalPresetSlides(content.verticalPresets, fallbackHero);
  const unifiedSlides = buildUnifiedPackageSlides(pkg, content, verticalSlides);
  const demoHref = pkg.demoStoreDomain ? getDemoStoreHref(pkg.demoStoreDomain) : null;

  const painPoints = Array.isArray(content.painPoints) ? content.painPoints : [];
  const outcomes = Array.isArray(content.outcomes) ? content.outcomes : [];
  const featureShowcases = Array.isArray(content.featureShowcases) ? content.featureShowcases : [];

  const guideSteps =
    Array.isArray(content.guideSteps) && content.guideSteps.length > 0
      ? content.guideSteps
      : [
          {
            title: 'Explore this suite',
            body: 'Review channels, included modules, and pre-enabled features on this page so you know what lands on day one.',
          },
          demoHref
            ? {
                title: 'Try the live demo',
                body: `Open ${pkg.demoStoreDomain} to see the public storefront buyers get with this vertical.`,
                href: demoHref,
                cta: 'Open demo store',
              }
            : null,
          {
            title: 'Register with this package',
            body: `Start a 14-day trial. Registration applies ${pkg.name} packaging, ${businessTier?.name || 'plan'} modules, and the ${pkg.defaultVertical} vertical preset.`,
            href: registerHref,
            cta: 'Start with this suite',
          },
        ].filter(Boolean);

  const limitStats = [
    { label: 'Products', value: limits.max_products?.toLocaleString() || '10,000+' },
    { label: 'Warehouses', value: String(limits.max_warehouses ?? 10) },
    { label: 'POS terminals', value: String(limits.max_pos_terminals ?? 6) },
    { label: 'Team seats', value: String(limits.max_users ?? 15) },
    { label: 'Customers', value: limits.max_customers?.toLocaleString() || '5,000+' },
    { label: 'Invoices / mo', value: limits.max_invoices_per_month?.toLocaleString() || '5,000+' },
  ];

  const modulesLead = content.modulesLead || DEFAULT_MODULES_LEAD;

  return (
    <MarketingLayout transparentNav>
      <DomainPackageHeroShowcase
        pkg={pkg}
        content={content}
        slides={unifiedSlides}
        businessTier={businessTier}
        demoDomain={pkg.demoStoreDomain}
      />

      <MarketingSection id="pricing" className="border-b border-neutral-200/80 bg-white">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 via-white to-violet-50/35 shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-10 lg:p-10">
            <div className="space-y-4">
              <p className={MARKETING_EYEBROW}>Suite pricing (PKR)</p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <span className={cn(MARKETING_STAT_VALUE, 'text-4xl text-neutral-900 lg:text-5xl')}>
                  {formatCurrency(pkg.pricing.price_pkr, 'PKR')}
                </span>
                <span className="text-sm font-medium text-neutral-500">/ month</span>
                {pkg.pricing.badge ? (
                  <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary">
                    {pkg.pricing.badge}
                  </span>
                ) : null}
              </div>
              <p className="max-w-xl text-sm font-medium leading-relaxed text-neutral-600">
                Built on the <strong className="font-semibold text-neutral-800">{businessTier?.name}</strong>{' '}
                tier ({formatCurrency(businessTier?.price_pkr || 0, 'PKR')}/mo) with vertical module packaging,
                raised limits, and registration presets for your industry.
              </p>
              <p className="text-xs font-medium text-neutral-500">14-day trial included on signup.</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild size="lg" className="h-12 rounded-full font-semibold">
                <Link href={registerHref}>
                  Get this suite
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-full font-semibold">
                <MarketingCtaLink href={getBookMeetingHref()}>Talk to sales</MarketingCtaLink>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-neutral-200/80 border-t border-neutral-200/80 bg-white/60 sm:grid-cols-3 lg:grid-cols-6">
            {limitStats.map((stat) => (
              <div key={stat.label} className="px-4 py-4 text-center sm:px-5 sm:py-5">
                <p className={cn(MARKETING_STAT_VALUE, 'text-xl text-neutral-900 sm:text-2xl')}>{stat.value}</p>
                <p className={cn(MARKETING_STAT_LABEL, 'mt-1 text-neutral-500')}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      {painPoints.length > 0 ? (
        <MarketingSection id="problems" className="border-b border-neutral-200/80 bg-neutral-50">
          <SectionIntro
            eyebrow="Problems we solve"
            title={content.problemHeading || 'What slows operators down today'}
            lead={content.problemLead}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {painPoints.map((pain) => (
              <article
                key={pain.title || pain.body}
                className="flex h-full flex-col rounded-2xl border border-sky-100/90 bg-white p-5 shadow-sm sm:p-6"
              >
                {pain.title ? (
                  <h3 className="text-base font-semibold text-neutral-900">{pain.title}</h3>
                ) : null}
                <p
                  className={cn(
                    'text-sm font-medium leading-relaxed text-neutral-600',
                    pain.title ? 'mt-2' : null
                  )}
                >
                  {pain.body || pain}
                </p>
              </article>
            ))}
          </div>
        </MarketingSection>
      ) : null}

      {outcomes.length > 0 ? (
        <MarketingSection id="outcomes" className="border-b border-neutral-200/80 bg-white">
          <SectionIntro
            eyebrow="Production & productivity"
            title={content.outcomesHeading || 'How this suite improves daily output'}
            lead={content.outcomesLead}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {outcomes.map((item) => (
              <article
                key={item.metric + item.label}
                className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-gradient-to-br from-sky-50/50 via-white to-white p-5 shadow-sm sm:rounded-3xl sm:p-6"
              >
                <p className={cn(MARKETING_STAT_VALUE, 'text-2xl text-sky-700 sm:text-3xl')}>{item.metric}</p>
                <h3 className="mt-2 text-base font-semibold text-neutral-900">{item.label}</h3>
                <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-neutral-600">{item.body}</p>
              </article>
            ))}
          </div>
        </MarketingSection>
      ) : null}

      {featureShowcases.length > 0 ? (
        <MarketingSection id="product-tour" className="border-b border-neutral-200/80 bg-neutral-50">
          <SectionIntro
            eyebrow="Feature importance"
            title={content.featureShowcaseHeading || 'See how the suite works'}
            lead={content.featureShowcaseLead}
          />
          <div className="space-y-8 lg:space-y-12">
            {featureShowcases.map((feature, idx) => {
              const reverse = idx % 2 === 1;
              return (
                <article
                  key={feature.title}
                  className={cn(
                    'grid items-center gap-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8',
                    reverse && 'lg:[&>*:first-child]:order-2'
                  )}
                >
                  <div className="space-y-3">
                    {feature.importance ? (
                      <span className="inline-flex rounded-full bg-sky-600/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-sky-800">
                        {feature.importance}
                      </span>
                    ) : null}
                    <h3 className="text-xl font-semibold text-neutral-900 sm:text-2xl">{feature.title}</h3>
                    <p className="text-sm font-medium leading-relaxed text-neutral-600 sm:text-base">
                      {feature.body}
                    </p>
                    {feature.help ? (
                      <p className="rounded-2xl border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm font-medium leading-relaxed text-sky-950/80">
                        {feature.help}
                      </p>
                    ) : null}
                  </div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-200 bg-sky-50/40">
                    <Image
                      src={feature.image}
                      alt={feature.imageAlt || feature.title}
                      fill
                      className={cn(feature.object || 'object-cover', 'object-top')}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </MarketingSection>
      ) : null}

      <MarketingSection id="channels" className="border-b border-neutral-200/80 bg-white">
        <SectionIntro
          eyebrow="How operators sell"
          title={content.channelsHeading || 'Built for how you actually run the business'}
          lead={content.channelsLead}
        />
        <div className="grid gap-5 md:grid-cols-3 sm:gap-6">
          {content.channelPillars.map(({ icon, title, body, accent, iconClass }, idx) => {
            const Icon = resolveLucideIcon(icon, 'Globe');
            return (
              <article
                key={title}
                className={cn(
                  'relative flex h-full flex-col rounded-2xl border p-5 shadow-sm sm:rounded-3xl sm:p-6',
                  'motion-safe:transition-[box-shadow,transform] motion-safe:duration-300 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md',
                  accent
                )}
              >
                <span className="absolute right-5 top-5 text-[10px] font-semibold tabular-nums text-neutral-400/90">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl', iconClass)}>
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-neutral-600">{body}</p>
              </article>
            );
          })}
        </div>
      </MarketingSection>

      <MarketingSection id="modules" className="border-b border-neutral-200/80 bg-neutral-50">
        <SectionIntro
          eyebrow="Included capabilities"
          title={content.modulesHeading || 'Module mix tuned for your vertical'}
          lead={modulesLead}
        />
        <DomainPackageCapabilitiesRow
          groups={pkg.moduleGroups}
          renderGroup={(group) => {
            const iconName = MODULE_ICON_MAP[group.id] || 'Package';
            const Icon = resolveLucideIcon(iconName);
            return (
              <MarketingPillarCard
                key={group.id}
                id={group.id}
                className="h-full"
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {group.title}
                    {group.status ? statusPill(group.status) : null}
                  </span>
                }
                body={group.body}
                bullets={group.bullets}
                icon={Icon}
                accent={{
                  card: 'border-neutral-200/80 bg-gradient-to-br from-white to-neutral-50/80 h-full',
                  icon: 'bg-brand-primary text-white shadow-sm',
                  check: 'text-brand-primary',
                }}
              />
            );
          }}
        />
      </MarketingSection>

      <MarketingSection className="border-b border-neutral-200/80 bg-white">
        <SectionIntro
          eyebrow="Entitlements"
          title="Pre-enabled plan features"
          lead="Applied via modular packaging on signup. Owners can adjust toggles in Settings → Billing when needed."
        />
        <div className="mx-auto max-w-5xl rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {content.highlightFeatures.map((key) => (
              <li
                key={key}
                className="flex items-start gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/50 px-3.5 py-3 text-sm font-medium text-neutral-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {FEATURE_LABELS[key] || key}
              </li>
            ))}
          </ul>
        </div>
      </MarketingSection>

      <MarketingSection className="border-b border-neutral-200/80 bg-neutral-50">
        <SectionIntro
          eyebrow="Why operators switch"
          title="Compared to stitched stacks"
          lead="One hub for catalog, channels, and compliance instead of bolting storefront, POS, and spreadsheets together."
        />
        <ul className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {pkg.competitorNotes.map((note) => (
            <li
              key={note}
              className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <Quote className="mb-3 h-5 w-5 text-brand-primary/70" aria-hidden />
              <p className="flex-1 text-sm font-medium leading-relaxed text-neutral-700">{note}</p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection id="get-started" className="border-b border-neutral-200/80 bg-white">
        <SectionIntro
          eyebrow="Owner guide"
          title={content.guideHeading || 'From this page to a live hub'}
          lead={
            content.guideLead ||
            'Navigate the suite, preview the demo storefront, then register with packaging and vertical presets already applied.'
          }
        />
        <ol className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {guideSteps.map((step, idx) => (
            <li
              key={step.title}
              className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 shadow-sm sm:p-6"
            >
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                Step {String(idx + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-neutral-900">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm font-medium leading-relaxed text-neutral-600">{step.body}</p>
              {step.href && step.cta ? (
                <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-full font-semibold sm:w-auto">
                  <Link href={step.href}>
                    {step.cta}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </li>
          ))}
        </ol>
        <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="h-12 rounded-full font-semibold">
            <Link href={registerHref}>
              Get this suite
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          {demoHref ? (
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full font-semibold">
              <Link href={demoHref} target="_blank" rel="noopener noreferrer">
                Open demo store
              </Link>
            </Button>
          ) : null}
        </div>
      </MarketingSection>

      <div id="faq">
        <FAQSection
          title={content.faqTitle || `${pkg.name} FAQ`}
          subtitle="Scope, verticals, and how this relates to standard plans."
          faqs={pkg.faqs.map((f) => ({ question: f.question, answer: f.answer }))}
        />
      </div>

      <CTASection
        title={content.ctaTitle || 'Run your business on one hub'}
        subtitle={
          content.ctaSubtitle ||
          `14-day trial on ${businessTier?.name} modules with vertical presets and modular packaging pre-applied.`
        }
        primaryCTA={{ text: 'Start with this suite', href: registerHref }}
        secondaryCTA={{ text: 'Book a walkthrough', href: getBookMeetingHref() }}
      />
    </MarketingLayout>
  );
}
