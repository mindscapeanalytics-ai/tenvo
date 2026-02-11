'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command';
import {
    Calculator,
    Calendar,
    CreditCard,
    Settings,
    Smile,
    User,
    Plus,
    Package,
    FileText,
    Search,
    ShoppingCart,
    Users,
    LayoutDashboard,
    Bell,
    Zap,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const params = useParams();
    const category = params.category || 'retail-shop';

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = useCallback((command) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>

                <CommandGroup heading="Global Actions">
                    <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'invoice' } })))}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span>New Invoice</span>
                        <CommandShortcut>⌘N</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'product' } })))}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Add Product</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent('open-modal', { detail: { modalId: 'customer' } })))}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>New Customer</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => router.push(`/business/${category}?tab=dashboard`))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard Overview</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push(`/business/${category}?tab=inventory`))}>
                        <Package className="mr-2 h-4 w-4" />
                        <span>Inventory Management</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push(`/business/${category}?tab=sales`))}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        <span>Sales & Invoices</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push(`/business/${category}?tab=analytics`))}>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Strategic Analytics</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => router.push(`/business/${category}?tab=settings`))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Business Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => window.dispatchEvent(new CustomEvent('open-intel')))}>
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Intelligence Center</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
