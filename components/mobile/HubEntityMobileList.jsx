'use client';

import { useMemo, useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { MobileActionRow } from '@/components/mobile/MobileHubPrimitives';
import { MOBILE_INPUT_CLASS, MOBILE_BTN_PRIMARY } from '@/lib/utils/formMobileStyles';
import {
  MOBILE_BOTTOM_SHEET,
  MOBILE_BOTTOM_SHEET_BODY,
  MOBILE_BOTTOM_SHEET_HANDLE,
  MOBILE_BOTTOM_SHEET_HEADER,
} from '@/lib/utils/mobileLayout';

const PAGE_SIZE = 24;

/**
 * App-style searchable entity list for hub tabs on mobile (no DataTable horizontal scroll).
 */
export function HubEntityMobileList({
  items = [],
  filterItems,
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  emptyIcon: EmptyIcon,
  emptyTitle = 'No records yet',
  emptySubtitle,
  emptyActionLabel,
  onEmptyAction,
  getKey = (item) => item.id,
  onRowPress,
  renderIcon,
  getTitle,
  getSubtitle,
  getAmount,
  getAmountClassName,
  renderBadge,
  getActions,
  pageSize = PAGE_SIZE,
  className,
}) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [actionItem, setActionItem] = useState(null);

  const filtered = useMemo(() => {
    const base = filterItems ? filterItems(items, search) : items;
    const q = search.trim().toLowerCase();
    if (!q || filterItems) return base;
    return base;
  }, [items, search, filterItems]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  const closeActions = () => setActionItem(null);

  const runAction = (fn) => {
    const row = actionItem;
    closeActions();
    if (row && fn) fn(row);
  };

  if (!items.length && !search) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-14', className)}>
        {EmptyIcon && <EmptyIcon className="h-10 w-10 text-gray-300" aria-hidden />}
        <p className="text-center text-sm font-semibold text-gray-700">{emptyTitle}</p>
        {emptySubtitle && <p className="text-center text-xs text-gray-500">{emptySubtitle}</p>}
        {onEmptyAction && emptyActionLabel && (
          <Button type="button" className={MOBILE_BTN_PRIMARY} onClick={onEmptyAction}>
            {emptyActionLabel}
          </Button>
        )}
      </div>
    );
  }

  const sheetActions = actionItem && getActions ? getActions(actionItem) : [];

  return (
    <>
      <div className={cn('space-y-3', className)}>
        {onSearchChange && (
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setVisibleCount(pageSize);
              }}
              placeholder={searchPlaceholder}
              className={cn(MOBILE_INPUT_CLASS, 'pl-9')}
              aria-label={searchPlaceholder}
            />
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-3 py-2">
            <p className="text-[11px] font-medium text-gray-500 tabular-nums">
              {filtered.length} record{filtered.length === 1 ? '' : 's'}
            </p>
            <p className="text-[10px] font-medium text-gray-400">Tap to open</p>
          </div>

          {visible.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm font-medium text-gray-500">
              No matches for your search
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visible.map((item) => {
                const title = getTitle?.(item) ?? '—';
                const subtitle = getSubtitle?.(item);
                const amount = getAmount?.(item);
                const amountClass = getAmountClassName?.(item) ?? 'text-gray-900';
                const rowActions = getActions?.(item) ?? [];

                return (
                  <li key={getKey(item)}>
                    <div className="flex items-stretch">
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-3 text-left active:bg-emerald-50/40"
                        onClick={() => onRowPress?.(item)}
                      >
                        {renderIcon && (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
                            {renderIcon(item)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[13px] font-bold text-gray-900">{title}</p>
                            {amount != null && amount !== '' && (
                              <p className={cn('shrink-0 text-[13px] font-bold tabular-nums', amountClass)}>
                                {amount}
                              </p>
                            )}
                          </div>
                          {subtitle && (
                            <p className="mt-0.5 truncate text-xs font-medium text-gray-600">{subtitle}</p>
                          )}
                          {renderBadge && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{renderBadge(item)}</div>}
                        </div>
                      </button>
                      {getActions && rowActions.length > 0 && (
                        <button
                          type="button"
                          className="flex shrink-0 items-center px-2 text-gray-300 active:text-gray-500"
                          onClick={() => setActionItem(item)}
                          aria-label="Actions"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {hasMore && (
            <div className="border-t border-gray-100 p-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-xl text-xs font-semibold"
                onClick={() => setVisibleCount((n) => n + pageSize)}
              >
                Load more ({filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>

      {getActions && (
        <Sheet open={Boolean(actionItem)} onOpenChange={(open) => !open && closeActions()}>
          <SheetContent side="bottom" className={MOBILE_BOTTOM_SHEET}>
            <div className={MOBILE_BOTTOM_SHEET_HANDLE} aria-hidden />
            <SheetHeader className={MOBILE_BOTTOM_SHEET_HEADER}>
              <SheetTitle className="truncate text-base font-bold text-gray-900">
                {actionItem ? getTitle?.(actionItem) : 'Actions'}
              </SheetTitle>
              {actionItem && getSubtitle?.(actionItem) && (
                <SheetDescription className="truncate text-xs">{getSubtitle(actionItem)}</SheetDescription>
              )}
            </SheetHeader>
            <div className={MOBILE_BOTTOM_SHEET_BODY}>
              <div className="space-y-2">
                {sheetActions.map((action) => (
                  <MobileActionRow
                    key={action.id}
                    icon={action.icon}
                    label={action.label}
                    destructive={action.destructive}
                    onClick={() => runAction(action.onClick)}
                  />
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

export default HubEntityMobileList;
