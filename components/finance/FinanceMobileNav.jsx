'use client';

import { cn } from '@/lib/utils';

/**
 * Finance sub-tab dock — single horizontal row (scrolls on narrow screens).
 */
export function FinanceMobileNav({ tabs = [], activeTab, onSelect, className }) {
  return (
    <nav
      aria-label="Finance sections"
      className={cn(
        'w-full min-w-0 rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950',
        className
      )}
    >
      <div className="flex w-full min-w-0 items-stretch gap-0.5 overflow-x-auto overscroll-x-contain">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelect(tab.key)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-primary-dark ring-1 ring-brand-primary/20'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-900 dark:hover:text-gray-100'
              )}
            >
              {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden /> : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default FinanceMobileNav;
