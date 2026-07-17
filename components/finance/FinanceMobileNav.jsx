'use client';

import { MobileHubTile } from '@/components/mobile/MobileHubPrimitives';
import { cn } from '@/lib/utils';

/**
 * Finance nav:
 * - Mobile: app-style box tiles (no horizontal scroll)
 * - Desktop (lg+): single dock row
 */
export function FinanceMobileNav({
  tabs = [],
  activeTab,
  onSelect,
  className,
  /** 'tiles' | 'dock' | 'responsive' (default) */
  variant = 'responsive',
}) {
  const showTiles = variant === 'tiles' || variant === 'responsive';
  const showDock = variant === 'dock' || variant === 'responsive';

  return (
    <nav aria-label="Finance sections" className={cn('w-full min-w-0', className)}>
      {showTiles ? (
        <div
          className={cn(
            'grid grid-cols-2 gap-2 sm:grid-cols-3',
            variant === 'responsive' && 'lg:hidden'
          )}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const label = tab.shortLabel || tab.label;
            const isActive = activeTab === tab.key;
            return (
              <MobileHubTile
                key={tab.key}
                icon={Icon}
                label={label}
                compact
                active={isActive}
                tone={isActive ? 'accent' : 'default'}
                onClick={() => onSelect(tab.key)}
              />
            );
          })}
        </div>
      ) : null}

      {showDock ? (
        <div
          className={cn(
            'rounded-xl border border-gray-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950',
            variant === 'responsive' && 'hidden lg:block'
          )}
        >
          <div className="flex flex-wrap items-stretch gap-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onSelect(tab.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
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
        </div>
      ) : null}
    </nav>
  );
}

export default FinanceMobileNav;
