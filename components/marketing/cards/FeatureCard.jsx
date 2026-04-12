'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

/**
 * FeatureCard Component
 * 
 * Reusable card for displaying individual features.
 * Supports multiple variants with hover effects and accessibility features.
 * 
 * @param {Object} props
 * @param {string|ReactNode} props.icon - Lucide icon name or React component
 * @param {string} props.title - Feature title
 * @param {string} props.description - Feature description
 * @param {string} props.link - Optional link URL
 * @param {string} props.linkText - Link text (default: "Learn more")
 * @param {string} props.variant - Card variant: 'default' | 'highlighted' | 'minimal'
 */
export default function FeatureCard({
  icon,
  title,
  description,
  link,
  linkText = "Learn more",
  variant = 'default'
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get icon component
  const IconComponent = typeof icon === 'string' && LucideIcons[icon] 
    ? LucideIcons[icon] 
    : icon;

  // Variant styles
  const variantStyles = {
    default: {
      card: 'bg-white border border-neutral-200 hover:border-wine-300 hover:shadow-xl',
      iconBg: 'bg-wine-50 group-hover:bg-wine-600',
      iconColor: 'text-wine-600 group-hover:text-white',
      title: 'text-neutral-900',
      description: 'text-neutral-600',
      link: 'text-wine-600'
    },
    highlighted: {
      card: 'bg-wine-600 border border-wine-700 hover:shadow-2xl hover:scale-[1.02]',
      iconBg: 'bg-white/20 group-hover:bg-white',
      iconColor: 'text-white group-hover:text-wine-600',
      title: 'text-white',
      description: 'text-wine-50',
      link: 'text-white hover:text-wine-100'
    },
    minimal: {
      card: 'bg-transparent hover:bg-neutral-50',
      iconBg: 'bg-wine-50 group-hover:bg-wine-600',
      iconColor: 'text-wine-600 group-hover:text-white',
      title: 'text-neutral-900',
      description: 'text-neutral-600',
      link: 'text-wine-600'
    }
  };

  const styles = variantStyles[variant] || variantStyles.default;

  const cardContent = (
    <>
      {/* Icon */}
      {IconComponent && (
        <div className={`w-14 h-14 ${styles.iconBg} rounded-xl flex items-center justify-center mb-6 transition-colors duration-300`}>
          {typeof IconComponent === 'function' ? (
            <IconComponent className={`w-7 h-7 ${styles.iconColor} transition-colors duration-300`} />
          ) : (
            IconComponent
          )}
        </div>
      )}

      {/* Title */}
      <h3 className={`text-xl font-bold ${styles.title} mb-3`}>
        {title}
      </h3>

      {/* Description */}
      <p className={`${styles.description} leading-relaxed mb-4`}>
        {description}
      </p>

      {/* Link */}
      {link && (
        <span className={`inline-flex items-center gap-2 ${styles.link} font-semibold group-hover:gap-3 transition-all duration-300`}>
          <span>{linkText}</span>
          <LucideIcons.ArrowRight className="w-4 h-4" />
        </span>
      )}
    </>
  );

  // If there's a link, wrap in Link component
  if (link) {
    return (
      <Link
        href={link}
        className={`group block ${styles.card} rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 ${
          mounted ? 'animate-fade-in-up' : 'opacity-0'
        }`}
        aria-label={`Learn more about ${title}`}
      >
        {cardContent}
      </Link>
    );
  }

  // Otherwise, render as article
  return (
    <article
      className={`group ${styles.card} rounded-2xl p-8 hover:-translate-y-1 transition-all duration-300 ${
        mounted ? 'animate-fade-in-up' : 'opacity-0'
      }`}
    >
      {cardContent}
    </article>
  );
}
