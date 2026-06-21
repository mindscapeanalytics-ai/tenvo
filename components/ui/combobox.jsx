'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
 * @property {boolean} [disabled]
 */

/** @type {React.FC<ComboboxProps>} */
export function Combobox({
    options = [],
    value,
    onChange,
    placeholder = "Select option...",
    emptyText = "No results found.",
    renderEmpty,
    className,
    disabled = false,
}) {
    const [open, setOpen] = React.useState(false);

    const selectedOption = React.useMemo(
        () => options.find((option) => String(option.value) === String(value)),
        [options, value]
    );

    const handleSelect = React.useCallback(
        (option) => {
            onChange?.(option.value);
            setOpen(false);
        },
        [onChange]
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        "w-full justify-between h-11 rounded-xl border-gray-200 bg-white font-medium text-gray-700 hover:bg-gray-50/50",
                        className
                    )}
                >
                    <span className="truncate text-left">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] min-w-[min(100%,16rem)] max-w-[min(calc(100vw-1.5rem),var(--radix-popover-trigger-width))] p-0 rounded-2xl border-gray-100 shadow-2xl"
                align="start"
                sideOffset={4}
                collisionPadding={12}
            >
                <Command
                    className="rounded-none"
                    filter={(itemValue, search) => {
                        if (!search) return 1;
                        if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
                        return 0;
                    }}
                >
                    <CommandInput
                        placeholder={placeholder}
                        className="h-12 border-none focus:ring-0"
                    />
                    <CommandList className="max-h-[min(300px,50vh)] overscroll-contain">
                        <CommandEmpty className="py-6 text-center text-sm text-gray-500 font-medium whitespace-pre-wrap">
                            {renderEmpty ? renderEmpty() : emptyText}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const searchValue = `${option.label} ${option.description || ''} ${option.value}`.trim();
                                const isSelected = String(option.value) === String(value);

                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={searchValue}
                                        onSelect={() => handleSelect(option)}
                                        className="flex items-center justify-between gap-2 py-3 px-4 cursor-pointer hover:bg-blue-50/50 aria-selected:bg-blue-50 transition-colors rounded-xl mx-1 my-0.5"
                                    >
                                        <div className="flex min-w-0 flex-1 flex-col pointer-events-none">
                                            <span className="font-bold text-gray-800 truncate">{option.label}</span>
                                            {option.description && (
                                                <span className="text-[10px] text-gray-400 font-medium truncate">
                                                    {option.description}
                                                </span>
                                            )}
                                        </div>
                                        <Check
                                            className={cn(
                                                "h-4 w-4 shrink-0 text-blue-600 pointer-events-none",
                                                isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
