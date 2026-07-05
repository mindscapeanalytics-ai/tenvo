'use client';

import { cn } from '@/lib/utils';

/**
 * Finance sub-tab picker — wraps on mobile (no horizontal scroll).
 */
export function FinanceMobileNav({ tabs = [], activeTab, onSelect, className }) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px] font-semibold transition-all',
              isActive
                ? 'bg-brand-50 text-brand-primary-dark shadow-sm ring-1 ring-brand-primary/20'
                : 'bg-gray-50 text-gray-600 active:bg-gray-100'
            )}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span className="truncate">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default FinanceMobileNav;
