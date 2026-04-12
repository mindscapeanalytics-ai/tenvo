'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

/**
 * DomainCard Component
 * 
 * Display industry/domain card with icon and name.
 * Links to domain-specific signup or information page.
 * 
 * @param {Object} props
 * @param {string} props.slug - Domain slug for URL
 * @param {string} props.name - Domain display name
 * @param {string} props.icon - Lucide icon name
 * @param {string} props.description - Optional domain description
 * @param {string} props.href - Link URL (optional, defaults to /register?domain={slug})
 * @param {Function} props.onClick - Optional click handler
 * @param {string} props.variant - Card variant: 'default' | 'compact'
 */
export default function DomainCard({
  slug,
  name,
  icon,
  description,
  href,
  onClick,
  variant = 'default'
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get icon component
  const IconComponent = icon && LucideIcons[icon] 
    ? LucideIcons[icon] 
    : LucideIcons.Building2; // Fallback icon

  // Default href if not provided
  const linkHref = href || `/register?domain=${slug}`;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e, slug);
    }
  };

  // Compact variant (for grid displays)
  if (variant === 'compact') {
    return (
      <Link
        href={linkHref}
        onClick={handleClick}
        className={`group flex flex-col items-center justify-center p-6 bg-white border border-neutral-200 rounded-xl hover:border-wine-600 hover:shadow-lg transition-all duration-300 ${
          mounted ? 'animate-fade-in-up' : 'opacity-0'
        }`}
        aria-label={`Learn more about ${name}`}
      >
        {/* Icon */}
        <div className="w-12 h-12 bg-wine-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-wine-600 transition-colors duration-300">
          <IconComponent className="w-6 h-6 text-wine-600 group-hover:text-white transition-colors duration-300" />
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-neutral-900 text-center group-hover:text-wine-600 transition-colors duration-300">
          {name}
        </h3>

        {/* Underline animation */}
        <div className="w-0 h-0.5 bg-wine-600 group-hover:w-full transition-all duration-300 mt-2" />
      </Link>
    );
  }

  // Default variant (with description)
  return (
    <Link
      href={linkHref}
      onClick={handleClick}
      className={`group flex items-start gap-4 p-6 bg-white border border-neutral-200 rounded-xl hover:border-wine-600 hover:shadow-lg transition-all duration-300 ${
        mounted ? 'animate-fade-in-up' : 'opacity-0'
      }`}
      aria-label={`Learn more about ${name}`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 w-14 h-14 bg-wine-50 rounded-xl flex items-center justify-center group-hover:bg-wine-600 transition-colors duration-300">
        <IconComponent className="w-7 h-7 text-wine-600 group-hover:text-white transition-colors duration-300" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <h3 className="text-lg font-bold text-neutral-900 mb-1 group-hover:text-wine-600 transition-colors duration-300">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-neutral-600 leading-relaxed">
            {description}
          </p>
        )}

        {/* Underline animation */}
        <div className="w-0 h-0.5 bg-wine-600 group-hover:w-full transition-all duration-300 mt-3" />
      </div>

      {/* Arrow icon */}
      <div className="flex-shrink-0">
        <LucideIcons.ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-wine-600 group-hover:translate-x-1 transition-all duration-300" />
      </div>
    </Link>
  );
}
