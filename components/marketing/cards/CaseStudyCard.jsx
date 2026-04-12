'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';

/**
 * CaseStudyCard Component
 * 
 * Display case study preview card with company info, results, and link to full case study.
 * 
 * @param {Object} props
 * @param {string} props.slug - Case study slug for URL
 * @param {string} props.company - Company name
 * @param {string} props.industry - Industry name
 * @param {string} props.summary - Brief summary
 * @param {Array} props.results - Array of result objects { metric, label }
 * @param {string} props.heroImage - Hero image URL (optional)
 * @param {string} props.logo - Company logo URL (optional)
 * @param {string} props.readTime - Read time (e.g., "5 min")
 * @param {string} props.variant - Card variant: 'default' | 'featured' | 'compact'
 */
export default function CaseStudyCard({
  slug,
  company,
  industry,
  summary,
  results = [],
  heroImage,
  logo,
  readTime,
  variant = 'default'
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const caseStudyUrl = `/case-studies/${slug}`;

  // Compact variant (minimal info)
  if (variant === 'compact') {
    return (
      <Link
        href={caseStudyUrl}
        className={`group block bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-wine-600 hover:shadow-lg transition-all duration-300 ${
          mounted ? 'animate-fade-in-up' : 'opacity-0'
        }`}
        aria-label={`Read case study: ${company}`}
      >
        {/* Hero image */}
        {heroImage && (
          <div className="relative w-full h-48 bg-neutral-100 overflow-hidden">
            <Image
              src={heroImage}
              alt={`${company} case study`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <div className="p-6">
          {/* Industry badge */}
          <span className="inline-flex items-center px-3 py-1 bg-wine-50 text-wine-700 text-xs font-medium rounded-full mb-3">
            {industry}
          </span>

          {/* Company name */}
          <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-wine-600 transition-colors duration-300">
            {company}
          </h3>

          {/* Summary */}
          <p className="text-neutral-600 text-sm leading-relaxed line-clamp-2">
            {summary}
          </p>

          {/* Read more link */}
          <div className="flex items-center gap-2 text-wine-600 font-semibold mt-4 group-hover:gap-3 transition-all duration-300">
            <span>Read case study</span>
            <LucideIcons.ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </Link>
    );
  }

  // Featured variant (large with results)
  if (variant === 'featured') {
    return (
      <Link
        href={caseStudyUrl}
        className={`group block bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:border-wine-600 hover:shadow-2xl transition-all duration-300 ${
          mounted ? 'animate-fade-in-up' : 'opacity-0'
        }`}
        aria-label={`Read case study: ${company}`}
      >
        {/* Hero image */}
        {heroImage && (
          <div className="relative w-full h-64 lg:h-80 bg-neutral-100 overflow-hidden">
            <Image
              src={heroImage}
              alt={`${company} case study`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Logo overlay */}
            {logo && (
              <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-lg p-2 shadow-lg">
                <Image
                  src={logo}
                  alt={`${company} logo`}
                  fill
                  className="object-contain"
                  sizes="64px"
                />
              </div>
            )}
          </div>
        )}

        <div className="p-8">
          {/* Industry badge and read time */}
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 bg-wine-50 text-wine-700 text-xs font-medium rounded-full">
              {industry}
            </span>
            {readTime && (
              <span className="flex items-center gap-1 text-sm text-neutral-600">
                <LucideIcons.Clock className="w-4 h-4" />
                {readTime}
              </span>
            )}
          </div>

          {/* Company name */}
          <h3 className="text-2xl font-bold text-neutral-900 mb-3 group-hover:text-wine-600 transition-colors duration-300">
            {company}
          </h3>

          {/* Summary */}
          <p className="text-neutral-600 leading-relaxed mb-6">
            {summary}
          </p>

          {/* Results metrics */}
          {results.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-neutral-200">
              {results.slice(0, 3).map((result, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-wine-600 mb-1">
                    {result.metric}
                  </div>
                  <div className="text-xs text-neutral-600">
                    {result.label}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Read more link */}
          <div className="flex items-center gap-2 text-wine-600 font-semibold group-hover:gap-3 transition-all duration-300">
            <span>Read full case study</span>
            <LucideIcons.ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </Link>
    );
  }

  // Default variant
  return (
    <Link
      href={caseStudyUrl}
      className={`group block bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-wine-600 hover:shadow-lg transition-all duration-300 ${
        mounted ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      aria-label={`Read case study: ${company}`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Hero image */}
        {heroImage && (
          <div className="relative w-full sm:w-48 h-48 bg-neutral-100 overflow-hidden flex-shrink-0">
            <Image
              src={heroImage}
              alt={`${company} case study`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 192px"
            />
          </div>
        )}

        <div className="flex-1 p-6">
          {/* Industry badge */}
          <span className="inline-flex items-center px-3 py-1 bg-wine-50 text-wine-700 text-xs font-medium rounded-full mb-3">
            {industry}
          </span>

          {/* Company name */}
          <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-wine-600 transition-colors duration-300">
            {company}
          </h3>

          {/* Summary */}
          <p className="text-neutral-600 text-sm leading-relaxed mb-4 line-clamp-2">
            {summary}
          </p>

          {/* Results metrics */}
          {results.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4">
              {results.slice(0, 3).map((result, index) => (
                <div key={index} className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-wine-600">
                    {result.metric}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {result.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Read more link */}
          <div className="flex items-center gap-2 text-wine-600 font-semibold group-hover:gap-3 transition-all duration-300">
            <span>Read case study</span>
            <LucideIcons.ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
