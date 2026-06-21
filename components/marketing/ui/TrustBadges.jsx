'use client';

import { useState } from 'react';
import { Building2, BadgeCheck, Lock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TrustBadges Component
 * Displays compliance and certification badges with tooltips
 */
export function TrustBadges({ variant = 'horizontal', className = '' }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const badges = [
    {
      id: 'fbr',
      name: 'FBR Compliant',
      Icon: Building2,
      description:
        'Fully compliant with Federal Board of Revenue regulations for tax reporting and invoicing',
      color: 'bg-green-50 text-green-700 border-green-200',
    },
    {
      id: 'secp',
      name: 'SECP Certified',
      Icon: BadgeCheck,
      description:
        'Certified by Securities and Exchange Commission of Pakistan for financial compliance',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'iso',
      name: 'ISO 27001',
      Icon: Lock,
      description: 'ISO 27001 certified for information security management',
      color: 'bg-brand-50 text-brand-primary-dark border-brand-200',
    },
    {
      id: 'gdpr',
      name: 'GDPR Ready',
      Icon: Shield,
      description: 'GDPR compliant data protection and privacy controls',
      color: 'bg-gray-50 text-gray-700 border-gray-200',
    },
  ];

  const handleMouseEnter = (badgeId) => {
    setActiveTooltip(badgeId);
  };

  const handleMouseLeave = () => {
    setActiveTooltip(null);
  };

  const handleKeyDown = (e, badgeId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveTooltip(activeTooltip === badgeId ? null : badgeId);
    } else if (e.key === 'Escape') {
      setActiveTooltip(null);
    }
  };

  const layoutClass =
    variant === 'vertical' ? 'flex flex-col gap-2.5' : 'flex flex-wrap gap-2.5 justify-center items-center';

  return (
    <div className={`${layoutClass} ${className}`} role="list">
      {badges.map((badge) => {
        const Icon = badge.Icon;
        return (
          <div key={badge.id} className="relative" role="listitem">
            <div
              className={cn(
                'flex items-center gap-2.5 rounded-lg border-2 px-3.5 py-2 transition-all duration-200 cursor-help sm:px-4 sm:py-2',
                badge.color,
                activeTooltip === badge.id ? 'scale-105 shadow-md' : 'hover:scale-105 hover:shadow-md'
              )}
              onMouseEnter={() => handleMouseEnter(badge.id)}
              onMouseLeave={handleMouseLeave}
              onFocus={() => handleMouseEnter(badge.id)}
              onBlur={handleMouseLeave}
              onKeyDown={(e) => handleKeyDown(e, badge.id)}
              tabIndex={0}
              role="button"
              aria-label={`${badge.name} - ${badge.description}`}
              aria-expanded={activeTooltip === badge.id}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden="true" />
              <span className="text-sm font-semibold whitespace-nowrap">{badge.name}</span>
            </div>

            {activeTooltip === badge.id && (
              <div
                className="absolute z-50 mt-2 w-64 rounded-lg bg-gray-900 p-3 text-sm text-white shadow-xl"
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
                role="tooltip"
              >
                <p>{badge.description}</p>
                <div
                  className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-900"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
