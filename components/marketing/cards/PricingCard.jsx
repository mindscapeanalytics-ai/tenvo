'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { formatPrice } from '@/lib/marketing/pricing';

/**
 * PricingCard Component
 * 
 * Display individual pricing tier with features and CTA.
 * Supports highlighted variant for recommended plans.
 * 
 * @param {Object} props
 * @param {string} props.name - Tier name
 * @param {Object} props.price - Price object { amount, currency, period }
 * @param {Array<string>} props.features - List of features
 * @param {boolean} props.highlighted - Whether this tier is highlighted
 * @param {string} props.badge - Optional badge text (e.g., "Most Popular")
 * @param {string} props.ctaText - CTA button text
 * @param {string} props.ctaHref - CTA button link
 * @param {boolean} props.popular - Whether to show "Most Popular" badge
 * @param {Function} props.onCtaClick - Optional CTA click handler
 */
export default function PricingCard({
  name,
  price,
  features = [],
  highlighted = false,
  badge,
  ctaText = "Get Started",
  ctaHref,
  popular = false,
  onCtaClick
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCtaClick = (e) => {
    if (onCtaClick) {
      onCtaClick(e);
    }
  };

  // Format price display
  const priceDisplay = price.amount === null 
    ? 'Custom Pricing'
    : formatPrice(price.amount, price.currency);

  return (
    <div
      className={`group relative bg-white rounded-2xl p-8 border transition-all duration-300 ${
        highlighted 
          ? 'border-wine-600 shadow-2xl scale-105 lg:scale-110' 
          : 'border-neutral-200 hover:border-wine-300 hover:shadow-xl'
      } ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
    >
      {/* Popular badge */}
      {(popular || badge) && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-wine-600 text-white text-sm font-semibold rounded-full shadow-lg">
            <LucideIcons.Star className="w-4 h-4 fill-current" />
            {badge || "Most Popular"}
          </span>
        </div>
      )}

      {/* Tier name */}
      <h3 className="text-2xl font-bold text-neutral-900 mb-2">
        {name}
      </h3>

      {/* Price */}
      <div className="mb-6">
        {price.amount === null ? (
          <div className="text-3xl font-bold text-neutral-900">
            Custom Pricing
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-neutral-900">
                {priceDisplay}
              </span>
              <span className="text-neutral-600">
                /{price.period}
              </span>
            </div>
            {price.amount === 0 && (
              <p className="text-sm text-neutral-600 mt-1">
                No credit card required
              </p>
            )}
          </>
        )}
      </div>

      {/* CTA Button */}
      <Link
        href={ctaHref}
        onClick={handleCtaClick}
        className={`block w-full text-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 mb-8 ${
          highlighted
            ? 'bg-wine-600 text-white hover:bg-wine-700 shadow-lg hover:shadow-xl'
            : 'bg-neutral-900 text-white hover:bg-neutral-800'
        }`}
        aria-label={`${ctaText} for ${name} plan`}
      >
        {ctaText}
      </Link>

      {/* Features list */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">
          What's included:
        </p>
        <ul className="space-y-3" role="list">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <LucideIcons.Check className="w-5 h-5 text-wine-600 flex-shrink-0 mt-0.5" />
              <span className="text-neutral-700 leading-relaxed">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust indicators for free tier */}
      {price.amount === 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-200">
          <p className="text-sm text-neutral-600 text-center">
            ✓ No credit card required<br />
            ✓ Cancel anytime
          </p>
        </div>
      )}
    </div>
  );
}
