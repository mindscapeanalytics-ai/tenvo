'use client';

import { POS_HOTKEY_DOCK_ITEMS } from '@/lib/config/posHotkeys';
import { POS_HOTKEY_DOCK } from '@/lib/utils/posLayout';
import { cn } from '@/lib/utils';

/**
 * Bottom F1–F9 action dock for mouseless POS control.
 * Always mount as the last child of a column POS shell (not inside an lg:flex-row).
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
            className={cn(POS_HOTKEY_DOCK, className)}
        >
            <div className="mx-auto grid max-w-[1600px] grid-cols-9 gap-0.5 sm:gap-1">
                {POS_HOTKEY_DOCK_ITEMS.map((item) => {
                    const disabled = Boolean(disabledActions[item.action]);
                    return (
                        <button
                            key={item.key}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && onAction?.(item.action)}
                            className={cn(
                                'flex flex-col items-center justify-center rounded-lg border transition-colors touch-manipulation',
                                compact ? 'min-h-9 py-0.5 px-0.5' : 'min-h-10 sm:min-h-11 py-1 px-0.5',
                                disabled
                                    ? 'border-slate-100 bg-slate-50/80 text-slate-300 cursor-not-allowed'
                                    : 'border-slate-200/90 bg-slate-50/60 text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-900 active:bg-emerald-100/80'
                            )}
                            title={`${item.key} · ${item.label}`}
                        >
                            <span
                                className={cn(
                                    'text-[9px] sm:text-[10px] font-semibold tabular-nums tracking-wide',
                                    disabled ? 'text-slate-300' : 'text-emerald-700'
                                )}
                            >
                                {item.key}
                            </span>
                            <span className="text-[8px] sm:text-[10px] font-semibold leading-tight truncate max-w-full">
                                {compact ? item.shortLabel : item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
