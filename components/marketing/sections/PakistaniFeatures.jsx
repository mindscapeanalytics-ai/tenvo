'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * PakistaniFeatures Component
 * 
 * Highlights Pakistan-specific competitive advantages and localized features.
 * Emphasizes FBR compliance, Urdu support, local integrations, and payment methods.
 * 
 * @param {Object} props
 * @param {string} props.title - Section title
 * @param {string} props.subtitle - Section subtitle
 * @param {Array} props.features - Array of Pakistani feature objects
 * @param {string} props.layout - Layout variant: 'grid' | 'list' | 'highlight'
 */
export default function PakistaniFeatures({
  title,
  subtitle,
  features = [],
  layout = 'grid'
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Grid layout - Default
  if (layout === 'grid') {
    return (
      <section className="py-16 lg:py-24 bg-gradient-to-br from-green-50 via-white to-green-50 relative overflow-hidden">
        {/* Pakistan flag colors decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-200/20 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header with "Built for Pakistan" badge */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-bold mb-6 shadow-lg">
              <LucideIcons.Flag className="w-4 h-4" />
              <span>Built for Pakistan</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon ? LucideIcons[feature.icon] : null;
              
              return (
                <div
                  key={index}
                  className={`group relative bg-white rounded-2xl p-8 border-2 border-green-200 hover:border-green-500 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ${
                    mounted ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Exclusive badge */}
                  {feature.badge && (
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-wine-600 text-white text-xs font-bold rounded-full shadow-lg">
                      {feature.badge}
                    </div>
                  )}

                  {/* Icon */}
                  {FeatureIcon && (
                    <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-600 transition-colors duration-300">
                      <FeatureIcon className="w-8 h-8 text-green-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <LucideIcons.Shield className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-sm font-bold text-neutral-900">FBR Compliant</div>
                <div className="text-xs text-neutral-600">Tier-1 Certified</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <LucideIcons.Award className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-sm font-bold text-neutral-900">SECP Registered</div>
                <div className="text-xs text-neutral-600">Verified Business</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl border border-neutral-200 shadow-sm">
              <LucideIcons.MapPin className="w-6 h-6 text-green-600" />
              <div>
                <div className="text-sm font-bold text-neutral-900">Made in Pakistan</div>
                <div className="text-xs text-neutral-600">Local Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // List layout
  if (layout === 'list') {
    return (
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-bold mb-6">
              <LucideIcons.Flag className="w-4 h-4" />
              <span>Built for Pakistan</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Features list */}
          <div className="max-w-4xl mx-auto space-y-6">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon ? LucideIcons[feature.icon] : null;
              
              return (
                <div
                  key={index}
                  className={`group flex gap-6 p-8 bg-green-50 rounded-xl hover:bg-white hover:shadow-lg border-2 border-transparent hover:border-green-300 transition-all duration-300 ${
                    mounted ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Icon */}
                  {FeatureIcon && (
                    <div className="flex-shrink-0 w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors duration-300">
                      <FeatureIcon className="w-7 h-7 text-green-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-neutral-900">
                        {feature.title}
                      </h3>
                      
                      {/* Badge */}
                      {feature.badge && (
                        <span className="flex-shrink-0 px-3 py-1 bg-wine-600 text-white text-xs font-bold rounded-full">
                          {feature.badge}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-neutral-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Highlight layout - Prominent visual treatment
  if (layout === 'highlight') {
    return (
      <section className="py-16 lg:py-24 bg-gradient-to-br from-green-600 to-green-700 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-bold mb-6">
              <LucideIcons.Flag className="w-4 h-4" />
              <span>Built for Pakistan</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg sm:text-xl text-green-100 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon ? LucideIcons[feature.icon] : null;
              
              return (
                <div
                  key={index}
                  className={`group relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20 hover:bg-white/20 hover:border-white/40 hover:shadow-2xl transition-all duration-300 ${
                    mounted ? 'animate-fade-in-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Exclusive badge */}
                  {feature.badge && (
                    <div className="absolute -top-3 -right-3 px-3 py-1 bg-wine-600 text-white text-xs font-bold rounded-full shadow-lg">
                      {feature.badge}
                    </div>
                  )}

                  {/* Icon */}
                  {FeatureIcon && (
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/30 transition-colors duration-300">
                      <FeatureIcon className="w-8 h-8 text-white" />
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="text-2xl font-bold mb-3">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-green-100 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
