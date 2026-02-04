'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, MapPin, Search, Plus } from 'lucide-react';
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

export function CityAutocomplete({ value, onChange, required = false }) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredCities = React.useMemo(() => {
        if (!searchQuery) return majorCities;
        return allCities.filter((city) =>
            city.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 10);
    }, [searchQuery]);

    return (
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest after:content-['*'] after:ml-0.5 after:text-red-500 after:hidden">
                City Selection {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Popover open={open} onOpenChange={setOpen} modal={true}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between h-11 rounded-xl border-gray-200 bg-white font-bold text-gray-900 overflow-hidden"
                    >
                        <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-4 h-4 text-wine shrink-0" />
                            {value ? value : "Select city..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-wine/10 shadow-2xl overflow-hidden z-[200]" align="start">
                    <Command className="rounded-none" shouldFilter={false}>
                        <CommandInput
                            placeholder="Search major cities..."
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            className="h-12 border-none focus:ring-0 font-medium"
                        />
                        <CommandList className="max-h-[300px]">
                            <CommandEmpty className="py-6 text-center text-sm text-gray-500 font-medium">
                                No city found.
                            </CommandEmpty>
                            <CommandGroup heading="Pakistan Cities">
                                {searchQuery && !filteredCities.includes(searchQuery) && (
                                    <CommandItem
                                        value={searchQuery}
                                        onSelect={() => {
                                            onChange(searchQuery);
                                            setOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-wine/5 aria-selected:bg-wine/10 transition-colors rounded-xl mx-1 my-0.5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-wine/5 text-wine">
                                                <Plus className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-bold text-gray-800 italic">Use "{searchQuery}"</span>
                                        </div>
                                    </CommandItem>
                                )}
                                {filteredCities.map((city) => (
                                    <CommandItem
                                        key={city}
                                        value={city}
                                        onSelect={() => {
                                            onChange(city === value ? "" : city);
                                            setOpen(false);
                                            setSearchQuery('');
                                        }}
                                        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-wine/5 aria-selected:bg-wine/10 transition-colors rounded-xl mx-1 my-0.5"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-gray-50 text-gray-400">
                                                <MapPin className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="font-bold text-gray-800">{city}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "h-4 w-4 text-wine",
                                                value === city ? "opacity-100" : "opacity-0"
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
