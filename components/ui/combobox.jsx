'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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

/**
 * @typedef {Object} ComboboxOption
 * @property {string|number} value
 * @property {string} label
 * @property {string} [description]
 * @property {any} [extraData]
 */

/**
 * @typedef {Object} ComboboxProps
 * @property {ComboboxOption[]} [options]
 * @property {string|number} [value]
 * @property {(value: string|number) => void} [onChange]
 * @property {string} [placeholder]
 * @property {string} [emptyText]
 * @property {() => React.ReactNode} [renderEmpty]
 * @property {string} [className]
 */

/** @type {React.FC<ComboboxProps>} */
export function Combobox({
    options = [],
    value,
    onChange,
    placeholder = "Select option...",
    emptyText = "No results found.",
    renderEmpty,
    className
}) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = React.useMemo(() =>
        options.find((option) => String(option.value) === String(value)),
        [options, value]
    );

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-11 rounded-xl border-gray-200 bg-white font-medium text-gray-700 hover:bg-gray-50/50",
                        className
                    )}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-gray-100 shadow-2xl z-[500]" align="start">
                <Command
                    className="rounded-none"
                    filter={(value, search) => {
                        if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                        return 0;
                    }}
                >
                    <CommandInput placeholder={placeholder} className="h-12 border-none focus:ring-0" />
                    <CommandList className="max-h-[300px]">
                        <CommandEmpty className="py-6 text-center text-sm text-gray-500 font-medium whitespace-pre-wrap">
                            {renderEmpty ? renderEmpty() : emptyText}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={`${option.label} ${option.description || ''} ${option.value}`.toLowerCase()} // Unique searchable value
                                    onSelect={() => {
                                        console.log('Combobox: Selected:', option.value);
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-blue-50/50 aria-selected:bg-blue-50 transition-colors rounded-xl mx-1 my-0.5"
                                >
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-800">{option.label}</span>
                                        {option.description && (
                                            <span className="text-[10px] text-gray-400 font-medium">{option.description}</span>
                                        )}
                                    </div>
                                    <Check
                                        className={cn(
                                            "h-4 w-4 text-blue-600",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
