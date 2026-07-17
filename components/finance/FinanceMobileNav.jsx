'use client';

import { cn } from '@/lib/utils';

/**
 * Finance sub-tab picker with optional group headers. Wraps on mobile (no horizontal scroll).
 */
export function FinanceMobileNav({ tabs = [], activeTab, onSelect, className }) {
  const groups = [];
  for (const tab of tabs) {
    const name = tab.group || 'Finance';
    let bucket = groups.find((g) => g.name === name);
    if (!bucket) {
      bucket = { name, tabs: [] };
      groups.push(bucket);
    }
    bucket.tabs.push(tab);
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      {groups.map((group) => (
        <div key={group.name}>
          {groups.length > 1 ? (
            <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {group.name}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {group.tabs.map((tab) => {
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
        </div>
      ))}
    </div>
  );
}

export default FinanceMobileNav;
