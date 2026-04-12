'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';

/**
 * TestimonialCard Component
 * 
 * Display customer testimonial with quote, author info, and optional rating.
 * 
 * @param {Object} props
 * @param {string} props.quote - Testimonial quote text
 * @param {string} props.author - Author name
 * @param {string} props.role - Author role/title
 * @param {string} props.company - Company name
 * @param {string} props.avatar - Avatar image URL (optional)
 * @param {number} props.rating - Star rating (1-5, optional)
 * @param {string} props.industry - Industry badge text (optional)
 * @param {string} props.variant - Card variant: 'default' | 'minimal' | 'featured'
 */
export default function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatar,
  rating,
  industry,
  variant = 'default'
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render star rating
  const renderRating = () => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1 mb-4" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[...Array(5)].map((_, index) => (
          <LucideIcons.Star
            key={index}
            className={`w-5 h-5 ${
              index < rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-neutral-300'
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    );
  };

  // Variant styles
  const variantStyles = {
    default: {
      card: 'bg-white border border-neutral-200 hover:border-wine-300 hover:shadow-xl',
      quote: 'text-neutral-700',
      author: 'text-neutral-900',
      role: 'text-neutral-600',
      quoteIcon: 'text-wine-200'
    },
    minimal: {
      card: 'bg-transparent',
      quote: 'text-neutral-700',
      author: 'text-neutral-900',
      role: 'text-neutral-600',
      quoteIcon: 'text-wine-200'
    },
    featured: {
      card: 'bg-wine-600 border border-wine-700 hover:shadow-2xl',
      quote: 'text-white',
      author: 'text-white',
      role: 'text-wine-100',
      quoteIcon: 'text-wine-400'
    }
  };

  const styles = variantStyles[variant] || variantStyles.default;

  return (
    <article
      className={`group relative ${styles.card} rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
        mounted ? 'animate-fade-in-up' : 'opacity-0'
      }`}
    >
      {/* Quote icon */}
      <div className="mb-6">
        <LucideIcons.Quote className={`w-12 h-12 ${styles.quoteIcon}`} aria-hidden="true" />
      </div>

      {/* Rating */}
      {renderRating()}

      {/* Quote */}
      <blockquote className="mb-6">
        <p className={`text-lg ${styles.quote} leading-relaxed italic`}>
          "{quote}"
        </p>
      </blockquote>

      {/* Author info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        {avatar && (
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
            <Image
              src={avatar}
              alt={`${author} avatar`}
              fill
              className="object-cover"
              sizes="48px"
            />
          </div>
        )}

        {/* Author details */}
        <div className="flex-1">
          <p className={`font-semibold ${styles.author}`}>
            {author}
          </p>
          <p className={`text-sm ${styles.role}`}>
            {role} at {company}
          </p>
        </div>

        {/* Industry badge */}
        {industry && (
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              variant === 'featured'
                ? 'bg-white/20 text-white'
                : 'bg-wine-50 text-wine-700'
            }`}>
              {industry}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
