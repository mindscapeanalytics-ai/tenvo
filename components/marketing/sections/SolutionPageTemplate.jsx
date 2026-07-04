'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, ExternalLink } from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import { Button } from '@/components/ui/button';
import {
  MARKETING_CONTAINER,
  MARKETING_EYEBROW,
  MARKETING_H2,
  MARKETING_LEAD,
  MARKETING_SECTION,
} from '@/lib/utils/marketingLayout';
import { cn } from '@/lib/utils';
import Hero from './Hero';
import CTASection from './CTASection';
import TestimonialCarousel from '../TestimonialCarousel';
import { getBookMeetingHref } from '@/lib/marketing/salesLinks';

/**
 * Reusable solution page template for vertical-specific landing pages.
 * Used for domain packages like auto-parts-commerce, pharmacy-commerce, etc.
 */

export default function SolutionPageTemplate({
  // Hero props
  badge,
  title,
  subtitle,
  heroImage,
  heroImageAlt,

  // Problem section
  problemStatement,
  painPoints,

  // Solution overview
  solutionTitle,
  solutionDescription,
  solutionImage,
  solutionImageAlt,

  // Key features (4-6 cards)
  features,

  // Demo store
  demoStoreName,
  demoStoreUrl,
  demoStoreDescription,

  // Pricing recommendation
  recommendedPlan,
  planFeatures,

  // Success metrics
  successMetrics,

  // Testimonials (optional)
  includeTestimonials = true,
}) {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <Hero
        variant="split"
        badge={badge}
        title={title}
        subtitle={subtitle}
        heroImage={heroImage}
        heroImageAlt={heroImageAlt}
        primaryCTA={{ text: 'Start free', href: '/register' }}
        secondaryCTA={{ text: 'Book a meeting', href: getBookMeetingHref() }}
      />

      {/* Problem Statement */}
      <section className={cn(MARKETING_SECTION, 'border-b border-neutral-200/80 bg-white')}>
        <div className={MARKETING_CONTAINER}>
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <p className={MARKETING_EYEBROW}>The Challenge</p>
            <h2 className={MARKETING_H2}>{problemStatement}</h2>
            <div className="grid gap-4 pt-6 sm:grid-cols-2 md:grid-cols-3">
              {painPoints.map((pain, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-red-100 bg-red-50/30 p-5 text-left"
                >
                  <p className="text-sm font-semibold leading-relaxed text-neutral-700">
                    {pain}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Overview */}
      <section className={cn(MARKETING_SECTION, 'border-b border-neutral-200/80 bg-neutral-50')}>
        <div className={MARKETING_CONTAINER}>
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-6">
              <p className={MARKETING_EYEBROW}>The TENVO Solution</p>
              <h2 className={MARKETING_H2}>{solutionTitle}</h2>
              <p className={MARKETING_LEAD}>{solutionDescription}</p>
            </div>
            {solutionImage && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 shadow-xl">
                <Image
                  src={solutionImage}
                  alt={solutionImageAlt || 'TENVO solution'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className={cn(MARKETING_SECTION, 'border-b border-neutral-200/80 bg-white')}>
        <div className={MARKETING_CONTAINER}>
          <div className="mx-auto mb-12 max-w-3xl space-y-3 text-center">
            <p className={MARKETING_EYEBROW}>Key Features</p>
            <h2 className={MARKETING_H2}>Everything you need to succeed</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group rounded-2xl border border-neutral-200/80 bg-white p-6 transition-all hover:border-brand-primary hover:shadow-lg"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm font-medium leading-relaxed text-neutral-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Demo Store CTA */}
      {demoStoreUrl && (
        <section className={cn(MARKETING_SECTION, 'border-b border-neutral-200/80 bg-neutral-50')}>
          <div className={MARKETING_CONTAINER}>
            <div className="mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-neutral-200 bg-white shadow-xl">
              <div className="p-8 text-center sm:p-12 lg:p-16">
                <p className={MARKETING_EYEBROW}>See It In Action</p>
                <h2 className="mb-4 text-3xl font-semibold text-neutral-900 sm:text-4xl">
                  Explore our live {demoStoreName} demo
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-base font-medium leading-relaxed text-neutral-600">
                  {demoStoreDescription}
                </p>
                <Button
                  asChild
                  size="lg"
                  className="h-14 rounded-xl bg-brand-primary px-8 text-base font-semibold uppercase tracking-wider text-white hover:bg-brand-primary-dark"
                >
                  <Link
                    href={demoStoreUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    Visit {demoStoreName} Demo
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recommended Plan */}
      {recommendedPlan && (
        <section className={cn(MARKETING_SECTION, 'border-b border-neutral-200/80 bg-white')}>
          <div className={MARKETING_CONTAINER}>
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <p className={MARKETING_EYEBROW}>Recommended Plan</p>
              <h2 className={MARKETING_H2}>Start with {recommendedPlan.name}</h2>
              <p className={MARKETING_LEAD}>{recommendedPlan.description}</p>
            </div>

            <div className="mx-auto mt-12 max-w-2xl rounded-[2.5rem] border-2 border-brand-primary bg-white p-8 shadow-xl sm:p-12">
              <div className="mb-8 text-center">
                <h3 className="mb-2 text-3xl font-semibold text-neutral-900">
                  {recommendedPlan.name}
                </h3>
                <p className="text-lg font-medium text-neutral-600">
                  {recommendedPlan.tagline}
                </p>
                <div className="mt-6">
                  <span className="text-4xl font-semibold text-brand-primary">
                    {recommendedPlan.price}
                  </span>
                  <span className="ml-2 text-sm font-semibold text-neutral-500">
                    / month
                  </span>
                </div>
              </div>

              <ul className="mb-8 space-y-3">
                {planFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                    <span className="text-sm font-medium text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="flex-1 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-dark"
                >
                  <Link href="/register">Start free trial</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="flex-1 rounded-xl border-2"
                >
                  <Link href="/pricing">Compare all plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Success Metrics */}
      {successMetrics && (
        <section className={cn(MARKETING_SECTION, 'border-b border-neutral-200/80 bg-neutral-50')}>
          <div className={MARKETING_CONTAINER}>
            <div className="mx-auto mb-12 max-w-3xl space-y-3 text-center">
              <p className={MARKETING_EYEBROW}>Real Results</p>
              <h2 className={MARKETING_H2}>Impact you can measure</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              {successMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm"
                >
                  <div className="mb-2 text-3xl font-semibold text-brand-primary">
                    {metric.value}
                  </div>
                  <p className="text-sm font-semibold text-neutral-700">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {includeTestimonials && <TestimonialCarousel variant="compact" />}

      {/* Final CTA */}
      <CTASection
        variant="split"
        title="Ready to transform your operations?"
        subtitle="Join businesses already using TENVO to streamline their workflows."
        primaryCTA={{ text: 'Start free', href: '/register' }}
        secondaryCTA={{ text: 'Book a meeting', href: getBookMeetingHref() }}
      />
    </MarketingLayout>
  );
}
