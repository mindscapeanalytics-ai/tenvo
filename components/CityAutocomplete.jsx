'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, MapPin, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { allCities, majorCities } from '@/lib/data/pakistaniLocations';

export function CityAutocomplete({ value, onChange, required = false, className }) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredCities = React.useMemo(() => {
        if (!searchQuery) return majorCities;
        return allCities
            .filter((city) => city.toLowerCase().includes(searchQuery.toLowerCase()))
            .slice(0, 10);
    }, [searchQuery]);

    const selectCity = React.useCallback(
        (city) => {
            onChange(city === value ? '' : city);
            setOpen(false);
            setSearchQuery('');
        },
        [onChange, value]
    );

    return (
        <div className={cn('space-y-2', className)}>
            <Label className="text-[11px] font-semibold text-slate-600">
                City {required && <span className="text-red-500">*</span>}
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="h-9 w-full justify-between rounded-lg border-gray-200 bg-white text-sm font-medium"
                    >
                        <div className="flex items-center gap-2 truncate min-w-0">
                            <MapPin className="w-4 h-4 text-wine shrink-0" />
                            <span className="truncate">{value ? value : 'Select city...'}</span>
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] min-w-[min(100%,16rem)] max-w-[min(calc(100vw-1.5rem),var(--radix-popover-trigger-width))] p-0 rounded-2xl border-wine/10 shadow-2xl overflow-hidden"
                    align="start"
                    sideOffset={4}
                    collisionPadding={12}
                >
                    <Command className="rounded-none" shouldFilter={false}>
                        <CommandInput
                            placeholder="Search major cities..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="h-12 border-none focus:ring-0 font-medium"
                        />
                        <CommandList className="max-h-[min(300px,50vh)] overscroll-contain">
                            <CommandEmpty className="py-6 text-center text-sm text-gray-500 font-medium">
                                No city found.
                            </CommandEmpty>
                            <CommandGroup heading="Pakistan Cities">
                                {searchQuery && !filteredCities.includes(searchQuery) && (
                                    <CommandItem
                                        value={searchQuery}
                                        onSelect={() => selectCity(searchQuery)}
                                        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-wine/5 aria-selected:bg-wine/10 transition-colors rounded-xl mx-1 my-0.5"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                                            <div className="p-1.5 rounded-lg bg-wine/5 text-wine shrink-0">
                                                <Plus className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-bold text-gray-800 italic truncate">
                                                Use &quot;{searchQuery}&quot;
                                            </span>
                                        </div>
                                    </CommandItem>
                                )}
                                {filteredCities.map((city) => (
                                    <CommandItem
                                        key={city}
                                        value={city}
                                        onSelect={() => selectCity(city)}
                                        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-wine/5 aria-selected:bg-wine/10 transition-colors rounded-xl mx-1 my-0.5"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                                            <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400 shrink-0">
                                                <MapPin className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-bold text-gray-800 truncate">{city}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                'h-4 w-4 shrink-0 text-wine pointer-events-none',
                                                value === city ? 'opacity-100' : 'opacity-0'
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                        <div className="p-2 bg-gray-50/50 border-t border-gray-100 italic text-[10px] text-gray-400 text-center font-medium">
                            Powered by Pakistani Intelligence
                        </div>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
