import { format, subDays, startOfMonth, endOfMonth, startOfYesterday, endOfYesterday, subMonths, startOfDay, endOfDay } from 'date-fns';
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
    const presets = [
        { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
        { label: 'Yesterday', getValue: () => ({ from: startOfYesterday(), to: endOfYesterday() }) },
        { label: 'Last 7 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
        { label: 'Last 30 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
        { label: 'This Month', getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
        {
            label: 'Last Month', getValue: () => {
                const prevMonth = subMonths(new Date(), 1);
                return { from: startOfMonth(prevMonth), to: endOfMonth(prevMonth) };
            }
        },
    ];

    const isPresetSelected = (preset: any) => {
        if (!date || !date.from || !date.to) return false;
        const p = preset.getValue();
        return (
            format(date.from, 'yyyy-MM-dd') === format(p.from, 'yyyy-MM-dd') &&
            format(date.to, 'yyyy-MM-dd') === format(p.to, 'yyyy-MM-dd')
        );
    };

    return (
        <div className={cn('grid gap-2', className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            'w-[280px] justify-start text-left font-bold rounded-xl border-gray-200 h-10 shadow-sm bg-white/60 backdrop-blur-sm hover:bg-white transition-all',
                            !date && 'text-muted-foreground'
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, 'LLL dd, y')} -{' '}
                                    {format(date.to, 'LLL dd, y')}
                                </>
                            ) : (
                                format(date.from, 'LLL dd, y')
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                        <ChevronDown className="ml-auto h-3 w-3 text-gray-400" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-none flex bg-white" align="end">
                    <div className="flex flex-col border-r border-gray-100 p-2 min-w-[140px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 py-2">Presets</p>
                        {presets.map((preset) => (
                            <button
                                key={preset.label}
                                onClick={() => onDateChange(preset.getValue())}
                                className={cn(
                                    "text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-between group",
                                    isPresetSelected(preset)
                                        ? "bg-primary/10 text-primary"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {preset.label}
                                {isPresetSelected(preset) && <Check className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={onDateChange}
                        numberOfMonths={2}
                        className="rounded-r-2xl" classNames={undefined} />
                </PopoverContent>
            </Popover>
        </div>
    );
}
