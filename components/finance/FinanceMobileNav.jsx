'use client';

import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveFinanceTileStyle } from '@/lib/finance/financeHubTiles';

const GROUP_ORDER = ['Insights', 'Statements', 'Books', 'Cash', 'Close', 'Hub'];

/**
 * @param {Array<{ key: string, group?: string, label?: string, shortLabel?: string, icon?: unknown, hint?: string }>} tabs
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
 * Colored finance section tile (Retail Simple action style).
 */
function FinanceHubTile({
  icon: Icon,
  label,
  hint,
  active = false,
  onClick,
  tileKey,
}) {
  const style = resolveFinanceTileStyle(tileKey);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex min-h-[5.25rem] flex-col items-start justify-between gap-2 rounded-2xl p-3.5 text-left shadow-sm',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-400',
        'hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.99]',
        style.tile,
        active && 'ring-2 ring-white/90 ring-offset-2 ring-offset-neutral-100'
      )}
    >
      <span
        className={cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200',
          'group-hover:scale-105',
          style.iconWrap
        )}
      >
        {Icon ? <Icon className="h-5 w-5" strokeWidth={2} aria-hidden /> : null}
      </span>
      <span className="min-w-0 pr-4">
        <span className="block text-sm font-semibold leading-tight tracking-tight">
          {label}
        </span>
        {hint ? (
          <span className="mt-0.5 block text-[11px] font-medium leading-snug opacity-85">
            {hint}
          </span>
        ) : null}
      </span>
      <ArrowUpRight
        className="absolute right-3 top-3 h-3.5 w-3.5 opacity-70 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}

/**
 * Finance nav:
 * - Mobile: colored app-style box tiles (Retail Simple pattern), grouped
 * - Desktop (lg+): single dock row with subtle group separators
 */
export function FinanceMobileNav({
  tabs = [],
  /** Optional hub jump tiles (Payments, Tax) — mobile only discoverability */
  hubLinks = [],
  activeTab,
  onSelect,
  className,
  /** 'tiles' | 'dock' | 'responsive' (default) */
  variant = 'responsive',
}) {
  const showTiles = variant === 'tiles' || variant === 'responsive';
  const showDock = variant === 'dock' || variant === 'responsive';
  const allTabs = hubLinks.length
    ? [...tabs, ...hubLinks.map((link) => ({ ...link, group: link.group || 'Hub' }))]
    : tabs;
  const groups = groupFinanceTabs(allTabs);

  return (
    <nav aria-label="Finance sections" className={cn('w-full min-w-0', className)}>
      {showTiles ? (
        <div className={cn('space-y-4', variant === 'responsive' && 'lg:hidden')}>
          {groups.map(({ group, tabs: groupTabs }) => (
            <div key={group}>
              <p className="mb-2 px-0.5 text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
                {group}
              </p>
              <div
                className={cn(
                  'grid gap-2.5',
                  groupTabs.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                )}
              >
                {groupTabs.map((tab) => {
                  const Icon = tab.icon;
                  const label = tab.shortLabel || tab.label;
                  const isActive = activeTab === tab.key;
                  const style = resolveFinanceTileStyle(tab.key);
                  return (
                    <FinanceHubTile
                      key={tab.key}
                      icon={Icon}
                      label={label}
                      hint={tab.hint || style.hint}
                      active={isActive}
                      tileKey={tab.key}
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
            'rounded-xl border border-neutral-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950',
            variant === 'responsive' && 'hidden lg:block'
          )}
        >
          <div className="flex flex-wrap items-stretch gap-0.5">
            {groupFinanceTabs(tabs).map(({ group, tabs: groupTabs }, groupIndex) => (
              <div key={group} className="flex flex-wrap items-stretch gap-0.5">
                {groupIndex > 0 ? (
                  <span
                    aria-hidden
                    className="mx-0.5 my-1 w-px self-stretch bg-neutral-200 dark:bg-slate-700"
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
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-slate-900 dark:hover:text-neutral-100'
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
