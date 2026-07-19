'use client';

import { MobileHubTile } from '@/components/mobile/MobileHubPrimitives';
import { cn } from '@/lib/utils';

const GROUP_ORDER = ['Insights', 'Statements', 'Books', 'Cash', 'Close'];

/**
 * @param {Array<{ key: string, group?: string, label?: string, shortLabel?: string, icon?: unknown }>} tabs
 * @returns {Array<{ group: string, tabs: typeof tabs }>}
 */
function groupFinanceTabs(tabs = []) {
  const byGroup = new Map();
  for (const tab of tabs) {
    const group = tab.group || 'Other';
    if (!byGroup.has(group)) byGroup.set(group, []);
    byGroup.get(group).push(tab);
  }
  const ordered = [];
  for (const group of GROUP_ORDER) {
    if (byGroup.has(group)) {
      ordered.push({ group, tabs: byGroup.get(group) });
      byGroup.delete(group);
    }
  }
  for (const [group, groupTabs] of byGroup) {
    ordered.push({ group, tabs: groupTabs });
  }
  return ordered;
}

/**
 * Finance nav:
 * - Mobile: app-style box tiles (no horizontal scroll), grouped by section
 * - Desktop (lg+): single dock row with subtle group separators
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
  const groups = groupFinanceTabs(tabs);

  return (
    <nav aria-label="Finance sections" className={cn('w-full min-w-0', className)}>
      {showTiles ? (
        <div className={cn('space-y-3', variant === 'responsive' && 'lg:hidden')}>
          {groups.map(({ group, tabs: groupTabs }) => (
            <div key={group}>
              <p className="mb-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {group}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groupTabs.map((tab) => {
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
            </div>
          ))}
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
            {groups.map(({ group, tabs: groupTabs }, groupIndex) => (
              <div key={group} className="flex flex-wrap items-stretch gap-0.5">
                {groupIndex > 0 ? (
                  <span
                    aria-hidden
                    className="mx-0.5 my-1 w-px self-stretch bg-gray-200 dark:bg-slate-700"
                  />
                ) : null}
                <span className="sr-only">{group}</span>
                {groupTabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => onSelect(tab.key)}
                      title={group}
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
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}

export default FinanceMobileNav;
