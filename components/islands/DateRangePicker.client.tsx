import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, Check } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { DATE_RANGE_PRESETS, getDateRangeFromPreset, isDateRangeEqual } from '@/lib/utils/datePresets';

interface DateRangePickerProps {
    className?: string;
    date: DateRange | undefined;
    onDateChange: (date: DateRange | undefined) => void;
}

export function DateRangePicker({
    className,
    date,
    onDateChange,
}: DateRangePickerProps) {
    const [open, setOpen] = useState(false);
    const [months, setMonths] = useState(2);
    const navigationBounds = useMemo(() => {
        const now = new Date();
        return {
            startMonth: new Date(now.getFullYear() - 5, 0, 1),
            endMonth: new Date(now.getFullYear() + 2, 11, 1),
        };
    }, []);

    useEffect(() => {
        const syncMonths = () => setMonths(window.innerWidth < 1200 ? 1 : 2);
        syncMonths();
        window.addEventListener('resize', syncMonths);
        return () => window.removeEventListener('resize', syncMonths);
    }, []);

    const isPresetSelected = (presetKey: string) => {
        if (!date || !date.from || !date.to) return false;
        const presetRange = getDateRangeFromPreset(presetKey);
        return isDateRangeEqual(date, presetRange);
    };

    const buttonLabel = useMemo(() => {
        if (!date?.from) return 'Pick a date range';
        if (!date?.to) return format(date.from, 'LLL dd, y');
        return `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}`;
    }, [date]);

    return (
        <div className={cn('grid gap-1', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-bold rounded-lg border-gray-200 h-8 px-2.5 shadow-sm bg-white hover:bg-white transition-colors text-[11px]',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{buttonLabel}</span>
                        <ChevronDown className="ml-auto h-3 w-3 text-gray-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(760px,calc(100vw-24px))] p-0 rounded-xl shadow-xl border border-gray-100 flex bg-white overflow-hidden" align="end" sideOffset={8}>
                    <div className="flex flex-col border-r border-gray-100 p-2 min-w-[170px] bg-slate-50/40">
                        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 py-1.5">Presets</p>
                        {DATE_RANGE_PRESETS.map((preset) => (
                            <button
                                key={preset.key}
                                onClick={() => {
                                    const range = getDateRangeFromPreset(preset.key);
                                    if (range) {
                                        onDateChange(range);
                                    }
                                    setOpen(false);
                                }}
                                className={cn(
                                    'text-left px-2 py-1.5 rounded-md text-[11px] font-bold transition-colors flex items-center justify-between group',
                                    isPresetSelected(preset.key)
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {preset.label}
                                {isPresetSelected(preset.key) && <Check className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={onDateChange}
                        captionLayout="dropdown"
                        startMonth={navigationBounds.startMonth}
                        endMonth={navigationBounds.endMonth}
                        numberOfMonths={months}
                        className="rounded-r-xl p-2"
                        classNames={{
                            months: 'flex flex-col xl:flex-row gap-3',
                            month: 'space-y-2.5',
                            month_caption: 'relative flex items-center justify-center h-7',
                            caption_label: 'hidden',
                            dropdowns: 'flex items-center gap-1',
                            dropdown_root: 'relative',
                            dropdown: 'h-7 rounded-md border border-gray-200 bg-white px-1.5 text-[11px] font-semibold text-gray-700 focus:outline-none',
                            nav: 'flex items-center gap-1',
                            button_previous: 'h-7 w-7 p-0 bg-transparent opacity-60 hover:opacity-100 absolute left-1 rounded-md border border-gray-200',
                            button_next: 'h-7 w-7 p-0 bg-transparent opacity-60 hover:opacity-100 absolute right-1 rounded-md border border-gray-200',
                            month_grid: 'w-full border-collapse',
                            weekdays: 'flex',
                            weekday: 'w-8 text-[11px] font-semibold text-gray-500',
                            week: 'flex w-full mt-1',
                            day: 'h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent/60 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
                            day_button: 'h-8 w-8 p-0 rounded-md text-sm font-medium aria-selected:opacity-100 hover:bg-gray-100',
                            range_start: 'day-range-start',
                            range_end: 'day-range-end',
                            selected: 'bg-primary text-white font-bold',
                            range_middle: 'bg-primary/10 text-primary',
                            today: 'bg-accent text-accent-foreground',
                            outside: 'day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
                            disabled: 'text-muted-foreground opacity-50',
                            hidden: 'invisible',
                        }}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
