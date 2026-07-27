'use client';

import {
  Activity,
  Building2,
  CreditCard,
  Flag,
  Layers,
  Link as LinkIcon,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileHubTile } from '@/components/mobile/MobileHubPrimitives';

/** @typedef {{ key: string, label: string, shortLabel?: string, icon: unknown, group?: string, hint?: string }} AdminTab */

/** @type {AdminTab[]} */
export const ADMIN_TABS = [
  { key: 'overview', label: 'Overview', shortLabel: 'Overview', icon: Activity, group: 'Monitor', hint: 'KPIs & plans' },
  { key: 'registrations', label: 'Registrations', shortLabel: 'Signups', icon: UserPlus, group: 'Monitor', hint: 'Approve access' },
  { key: 'businesses', label: 'Businesses', shortLabel: 'Businesses', icon: Building2, group: 'Tenants', hint: 'Plans & packaging' },
  { key: 'users', label: 'Users', shortLabel: 'Users', icon: Users, group: 'Tenants', hint: 'Accounts & roles' },
  { key: 'subscriptions', label: 'Subscriptions', shortLabel: 'Billing', icon: CreditCard, group: 'Billing', hint: 'Plans & renewals' },
  { key: 'packages', label: 'Packages', shortLabel: 'Packages', icon: Layers, group: 'Billing', hint: 'Domain suites' },
  { key: 'roles', label: 'Roles & Access', shortLabel: 'Roles', icon: UserCog, group: 'Access', hint: 'Hierarchy guide' },
  { key: 'features', label: 'Feature Flags', shortLabel: 'Flags', icon: Flag, group: 'Access', hint: 'Platform toggles' },
  { key: 'affiliates', label: 'Affiliates', shortLabel: 'Affiliates', icon: LinkIcon, group: 'Growth', hint: 'Partner program' },
];

const GROUP_ORDER = ['Monitor', 'Tenants', 'Billing', 'Access', 'Growth'];

/**
 * @param {AdminTab[]} tabs
 * @returns {Array<{ group: string, tabs: AdminTab[] }>}
 */
function groupAdminTabs(tabs = []) {
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
 * Platform admin section nav:
 * - Mobile: app-style tiles (no clipped horizontal chips)
 * - Desktop: compact dock row
 *
 * @param {{
 *   tabs?: AdminTab[],
 *   activeTab: string,
 *   onSelect: (key: string) => void,
 *   className?: string,
 *   variant?: 'tiles' | 'dock' | 'responsive',
 * }} props
 */
export function AdminMobileNav({
  tabs = ADMIN_TABS,
  activeTab,
  onSelect,
  className,
  variant = 'responsive',
}) {
  const showTiles = variant === 'tiles' || variant === 'responsive';
  const showDock = variant === 'dock' || variant === 'responsive';
  const groups = groupAdminTabs(tabs);

  return (
    <nav aria-label="Platform administration sections" className={cn('w-full min-w-0', className)}>
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
                  return (
                    <MobileHubTile
                      key={tab.key}
                      icon={Icon}
                      label={label}
                      sublabel={tab.hint}
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
          role="tablist"
          aria-label="Platform administration"
          className={cn(
            'flex flex-wrap items-center gap-1 rounded-xl bg-gray-100 p-1',
            variant === 'responsive' && 'hidden lg:flex'
          )}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(tab.key)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
                {tab.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </nav>
  );
}

export default AdminMobileNav;
