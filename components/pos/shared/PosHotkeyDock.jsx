'use client';

import { POS_HOTKEY_DOCK_ITEMS } from '@/lib/config/posHotkeys';
import { cn } from '@/lib/utils';

/**
 * Bottom F1–F9 action dock for mouseless POS control.
 */
export function PosHotkeyDock({
    onAction,
    disabledActions = {},
    className,
    compact = false,
}) {
    return (
        <nav
            aria-label="POS keyboard shortcuts"
            className={cn(
                'shrink-0 border-t border-gray-200 bg-white',
                'px-1.5 sm:px-2 py-1',
                'pb-[max(0.25rem,env(safe-area-inset-bottom))]',
                className
            )}
        >
            <div className="grid grid-cols-9 gap-0.5 sm:gap-1">
                {POS_HOTKEY_DOCK_ITEMS.map((item) => {
                    const disabled = Boolean(disabledActions[item.action]);
                    return (
                        <button
                            key={item.key}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && onAction?.(item.action)}
                            className={cn(
                                'flex flex-col items-center justify-center rounded-md border transition-colors',
                                compact ? 'min-h-9 py-0.5 px-0.5' : 'min-h-10 py-1 px-0.5',
                                disabled
                                    ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 active:bg-emerald-100'
                            )}
                            title={`${item.key} · ${item.label}`}
                        >
                            <span className="text-[9px] sm:text-[10px] font-semibold tabular-nums text-emerald-700/80">
                                {item.key}
                            </span>
                            <span className="text-[8px] sm:text-[9px] font-medium leading-tight truncate max-w-full">
                                {compact ? item.shortLabel : item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
