'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * StatsBar Component
 * 
 * Displays trust indicators and key metrics.
 * Supports animated counters and icon display.
 * 
 * @param {Object} props
 * @param {Array} props.stats - Array of stat objects with value, label, icon
 * @param {string} props.variant - Visual variant: 'default' | 'compact' | 'highlighted'
 * @param {boolean} props.animated - Enable animated counters
 */
export default function StatsBar({
  stats = [],
  variant = 'default',
  animated = false
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default variant - Full stats with icons
  if (variant === 'default') {
    return (
      <section className="py-12 bg-white border-y border-neutral-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-12">
            {stats.map((stat, index) => {
              const StatIcon = stat.icon ? LucideIcons[stat.icon] : null;
              
              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {StatIcon && (
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-wine-50">
                      <StatIcon className="w-6 h-6 text-wine-600" />
                    </div>
                  )}
                  <div>
                    <div className="text-3xl font-bold text-neutral-900">{stat.value}</div>
                    <div className="text-sm text-neutral-600">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // Compact variant - Minimal spacing
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap justify-center items-center gap-8 py-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`text-center ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="text-2xl font-bold text-neutral-900">{stat.value}</div>
            <div className="text-xs text-neutral-600">{stat.label}</div>
          </div>
        ))}
      </div>
    );
  }

  // Highlighted variant - Wine background
  if (variant === 'highlighted') {
    return (
      <section className="py-12 bg-wine-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-12">
            {stats.map((stat, index) => {
              const StatIcon = stat.icon ? LucideIcons[stat.icon] : null;
              
              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {StatIcon && (
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/20">
                      <StatIcon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <div className="text-sm text-wine-100">{stat.label}</div>
                  </div>
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
