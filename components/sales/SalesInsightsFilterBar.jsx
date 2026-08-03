'use client';

import {
  SALES_CHANNEL_OPTIONS,
  formatSalesPeriodLabel,
  salesChannelLabel,
} from '@/lib/analytics/salesPerformanceFilter';

/**
 * Shared channel + category filter bar for Sales Manager and Report Builder.
 */
export function SalesInsightsFilterBar({
  channel = 'all',
  category = null,
  categories = [],
  from,
  to,
  periodHint = 'hub date range',
  onChannelChange,
  onCategoryChange,
  disabled = false,
  className = '',
}) {
  const periodLabel = formatSalesPeriodLabel(from, to);
  const activeChips = [];
  if (channel && channel !== 'all') {
    activeChips.push({ key: 'channel', label: salesChannelLabel(channel) });
  }
  if (category) {
    activeChips.push({ key: 'category', label: category });
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-700">{periodLabel}</span>
          {periodHint ? (
            <span className="text-gray-400"> ({periodHint})</span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
            {SALES_CHANNEL_OPTIONS.map((opt) => {
              const active = channel === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChannelChange?.(opt.value)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all disabled:opacity-40 ${
                    active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <label className="sr-only" htmlFor="sales-category-filter">
            Product category
          </label>
          <select
            id="sales-category-filter"
            disabled={disabled}
            value={category || ''}
            onChange={(e) => onCategoryChange?.(e.target.value || null)}
            className="max-w-[11rem] rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-700 disabled:opacity-40"
          >
            <option value="">All categories</option>
            {(categories || []).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
      {activeChips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
            >
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
