'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { testimonials as defaultTestimonials } from '@/lib/marketing/testimonials';

/**
 * TestimonialsSection Component
 * 
 * Displays customer testimonials with social proof.
 * Supports grid, carousel, and featured layouts.
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {Array} props.testimonials - Array of testimonial objects (optional, uses default if not provided)
 * @param {string} props.layout - Layout variant: 'grid' | 'carousel' | 'featured'
 * @param {boolean} props.showRatings - Show star ratings
 * @param {boolean} props.showIndustry - Show industry badges
 */
export default function TestimonialsSection({
  title,
  subtitle,
  testimonials,
  layout = 'grid',
  showRatings = true,
  showIndustry = true
}) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use provided testimonials or default ones
  const testimonialsData = testimonials || defaultTestimonials;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (layout === 'carousel' && testimonialsData.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonialsData.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [layout, testimonialsData.length]);

  // Render star rating
  const renderRating = (rating) => {
    if (!showRatings || !rating) return null;
    
    return (
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <LucideIcons.Star
            key={i}
            className={`w-5 h-5 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-neutral-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render testimonial card
  const renderTestimonialCard = (testimonial, index, variant = 'default') => {
    const isLarge = variant === 'large';
    
    return (
      <div
        key={testimonial.id}
        className={`group relative bg-white rounded-2xl p-8 border-2 border-neutral-200 hover:border-wine-300 hover:shadow-xl transition-all duration-300 ${
          isLarge ? 'lg:p-12' : ''
        } ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
        style={{ animationDelay: `${index * 150}ms` }}
      >
        {/* Quote icon */}
        <div className="absolute top-6 right-6 opacity-10">
          <LucideIcons.Quote className="w-16 h-16 text-wine-600" />
        </div>

        {/* Rating */}
        {renderRating(testimonial.rating)}

        {/* Quote */}
        <blockquote className={`relative z-10 ${isLarge ? 'text-xl' : 'text-lg'} text-neutral-700 italic leading-relaxed mb-6`}>
          "{testimonial.quote}"
        </blockquote>

        {/* Author info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {testimonial.avatar && (
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
              <Image
                src={testimonial.avatar}
                alt={testimonial.author}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          )}

          <div className="flex-1">
            {/* Name */}
            <div className="font-bold text-neutral-900">
              {testimonial.author}
            </div>
            
            {/* Role and Company */}
            <div className="text-sm text-neutral-600">
              {testimonial.role} at {testimonial.company}
            </div>
          </div>

          {/* Industry badge */}
          {showIndustry && testimonial.industry && (
            <div className="flex-shrink-0 px-3 py-1 bg-wine-50 text-wine-700 text-xs font-medium rounded-full">
              {testimonial.industry}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Grid layout
  if (layout === 'grid') {
    return (
      <section className="py-16 lg:py-24 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Testimonials grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {testimonialsData.map((testimonial, index) =>
              renderTestimonialCard(testimonial, index)
            )}
          </div>
        </div>
      </section>
    );
  }

  // Carousel layout
  if (layout === 'carousel') {
    const currentTestimonial = testimonialsData[currentIndex];
    
    return (
      <section className="py-16 lg:py-24 bg-gradient-to-br from-wine-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Carousel */}
          <div className="max-w-4xl mx-auto">
            {currentTestimonial && renderTestimonialCard(currentTestimonial, 0, 'large')}

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {/* Previous button */}
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + testimonialsData.length) % testimonialsData.length)}
                className="w-12 h-12 rounded-full bg-white border-2 border-neutral-200 hover:border-wine-600 hover:bg-wine-50 flex items-center justify-center transition-all duration-300"
                aria-label="Previous testimonial"
              >
                <LucideIcons.ChevronLeft className="w-6 h-6 text-neutral-600" />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {testimonialsData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-8 bg-wine-600'
                        : 'bg-neutral-300 hover:bg-neutral-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % testimonialsData.length)}
                className="w-12 h-12 rounded-full bg-white border-2 border-neutral-200 hover:border-wine-600 hover:bg-wine-50 flex items-center justify-center transition-all duration-300"
                aria-label="Next testimonial"
              >
                <LucideIcons.ChevronRight className="w-6 h-6 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Featured layout - One large testimonial with smaller ones below
  if (layout === 'featured') {
    const [featured, ...others] = testimonialsData;
    
    return (
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Featured testimonial */}
          {featured && (
            <div className="max-w-4xl mx-auto mb-12">
              {renderTestimonialCard(featured, 0, 'large')}
            </div>
          )}

          {/* Other testimonials */}
          {others.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {others.map((testimonial, index) =>
                renderTestimonialCard(testimonial, index + 1)
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}
