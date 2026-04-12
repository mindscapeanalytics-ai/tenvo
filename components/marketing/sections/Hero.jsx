'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';

/**
 * Hero Component
 * 
 * Above-the-fold section with value proposition and primary CTA.
 * Supports multiple variants for different page layouts.
 * 
 * @param {Object} props
 * @param {string} props.headline - Main headline text
 * @param {string} props.subheadline - Supporting text below headline
 * @param {Object} props.primaryCTA - Primary call-to-action button
 * @param {Object} props.secondaryCTA - Secondary call-to-action button
 * @param {Array} props.stats - Trust indicators/stats to display
 * @param {string} props.heroImage - Path to hero image
 * @param {string} props.heroImageAlt - Alt text for hero image
 * @param {string} props.variant - Layout variant: 'default' | 'centered' | 'split'
 * @param {Object} props.badge - Optional badge to display above headline
 */
export default function Hero({
  headline,
  subheadline,
  // Also accept alternate prop names used by pages
  title,
  subtitle,
  primaryCTA,
  secondaryCTA,
  stats = [],
  heroImage,
  heroImageAlt,
  // Also accept alternate prop names
  image,
  imageAlt,
  variant = 'default',
  badge = null
}) {
  // Normalize props - support both naming conventions
  const headlineText = headline || title;
  const subheadlineText = subheadline || subtitle;
  const heroImageSrc = heroImage || image;
  const heroImageAltText = heroImageAlt || imageAlt || '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCTAClick = (ctaType, href) => {
    trackEvent(EVENTS.CTA_CLICK, {
      cta_location: 'hero',
      cta_text: ctaType === 'primary' ? primaryCTA?.text : secondaryCTA?.text,
      cta_destination: href
    });
  };

  // Render badge if provided (supports string or object)
  const renderBadge = () => {
    if (!badge) return null;
    
    const badgeText = typeof badge === 'string' ? badge : badge.text;
    const BadgeIcon = (typeof badge === 'object' && badge.icon) ? LucideIcons[badge.icon] : null;
    
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold mb-6 shadow-sm shadow-blue-100">
        {BadgeIcon && <BadgeIcon className="w-4 h-4" />}
        <span>{badgeText}</span>
      </div>
    );
  };

  // Render stats bar
  const renderStats = () => {
    if (!stats || stats.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-8 pt-8 mt-8 border-t border-neutral-200">
        {stats.map((stat, index) => {
          const StatIcon = stat.icon ? LucideIcons[stat.icon] : null;
          
          return (
            <div key={index} className="flex items-center gap-3">
              {StatIcon && (
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 shadow-sm shadow-blue-100">
                  <StatIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div>
                <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
                <div className="text-sm text-neutral-600">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render CTA buttons
  const renderCTAs = () => (
    <div className="flex flex-col sm:flex-row gap-4">
      {primaryCTA && (
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-2xl shadow-[0_18px_44px_-20px_rgba(47,91,255,0.65)] hover:shadow-[0_24px_54px_-20px_rgba(47,91,255,0.55)] transition-all duration-300"
          onClick={() => handleCTAClick('primary', primaryCTA.href)}
        >
          <Link href={primaryCTA.href}>
            {primaryCTA.text}
          </Link>
        </Button>
      )}
      
      {secondaryCTA && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="border-2 border-neutral-300 hover:border-blue-600 hover:text-blue-700 px-8 py-6 text-lg font-semibold rounded-2xl bg-white/70 backdrop-blur-sm transition-all duration-300"
          onClick={() => handleCTAClick('secondary', secondaryCTA.href)}
        >
          <Link href={secondaryCTA.href}>
            {secondaryCTA.text}
          </Link>
        </Button>
      )}
    </div>
  );

  // Default variant: Split layout with text left, image right
  if (variant === 'default') {
    return (
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f6f8fc_0%,#ffffff_55%,#eef4ff_100%)]">
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-blue-200/35 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[28rem] h-[28rem] bg-amber-200/25 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div className={`space-y-6 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
              {renderBadge()}
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                {typeof headlineText === 'string' 
                  ? headlineText.split(' ').map((word, index) => {
                      const highlightWords = ['Pakistan', 'Intelligent', 'Operating'];
                      if (highlightWords.some(hw => word.includes(hw))) {
                        return <span key={index} className="text-blue-600">{word}{' '}</span>;
                      }
                      return <span key={index}>{word} </span>;
                    })
                  : headlineText
                }
              </h1>
              
              <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl leading-relaxed">
                {subheadlineText}
              </p>
              
              {renderCTAs()}
              
              {renderStats()}
            </div>

            {/* Hero image */}
            {heroImageSrc && (
              <div className={`relative ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
                <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/70 shadow-[0_30px_90px_-30px_rgba(15,23,42,0.35)]">
                  <Image
                    src={heroImageSrc}
                    alt={heroImageAltText}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  
                  {/* Floating UI elements overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/20 to-transparent" />
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500 rounded-[1.75rem] opacity-20 blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-amber-300 rounded-[1.75rem] opacity-20 blur-xl" />
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Centered variant: Centered text with background image
  if (variant === 'centered') {
    return (
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#091225_0%,#10224a_45%,#2f5bff_100%)] text-white">
        {/* Background image */}
        {heroImageSrc && (
          <div className="absolute inset-0">
            <Image
              src={heroImageSrc}
              alt={heroImageAltText}
              fill
              priority
              className="object-cover opacity-30"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/80 via-neutral-900/60 to-neutral-900/80" />
          </div>
        )}
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className={`max-w-4xl mx-auto text-center space-y-8 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
            {renderBadge()}
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              {headlineText}
            </h1>
            
            <p className="text-xl sm:text-2xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
              {subheadlineText}
            </p>
            
            <div className="flex justify-center">
              {renderCTAs()}
            </div>
            
            {stats && stats.length > 0 && (
              <div className="flex flex-wrap justify-center gap-12 pt-12 mt-12 border-t border-white/20">
                {stats.map((stat, index) => {
                  const StatIcon = stat.icon ? LucideIcons[stat.icon] : null;
                  
                  return (
                    <div key={index} className="text-center">
                      {StatIcon && (
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-white/10">
                          <StatIcon className="w-6 h-6 text-amber-300" />
                        </div>
                      )}
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <div className="text-sm text-neutral-400 mt-1">{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Split variant: 50/50 split with equal emphasis
  if (variant === 'split') {
    return (
      <section className="relative overflow-hidden bg-white">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Text content */}
          <div className="flex items-center bg-[linear-gradient(135deg,#eef4ff_0%,#ffffff_70%)]">
            <div className={`container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 space-y-6 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
              {renderBadge()}
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                {headlineText}
              </h1>
              
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                {subheadlineText}
              </p>
              
              {renderCTAs()}
              
              {renderStats()}
            </div>
          </div>

          {/* Hero image */}
          {heroImageSrc && (
            <div className={`relative ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
              <Image
                src={heroImageSrc}
                alt={heroImageAltText}
                fill
                priority
                className="object-cover"
                sizes="50vw"
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}
