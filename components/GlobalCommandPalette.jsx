'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Package,
  Receipt,
  Building2,
  FileText,
  Search,
  ShoppingCart,
  TrendingUp,
  Warehouse
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const params = useParams();
  const category = params?.category || 'retail-shop'; // fallback

  React.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    }

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command) => {
    setOpen(false);
    command();
  }, []);

  const navigateTo = (path) => {
    runCommand(() => router.push(`/business/${category}${path}`));
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => navigateTo('/inventory?action=new')}>
            <Package className="mr-2 h-4 w-4" />
            <span>Create New Product</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/pos')}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>Open POS Terminal</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/finance/expenses?action=new')}>
            <Receipt className="mr-2 h-4 w-4" />
            <span>Record Expense</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/customers?action=new')}>
            <User className="mr-2 h-4 w-4" />
            <span>Add Customer</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigateTo('')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Dashboard Home</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/inventory')}>
            <Warehouse className="mr-2 h-4 w-4" />
            <span>Inventory & Stock</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/finance/general-ledger')}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Finance & Ledger</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Business Settings</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
          <CommandItem onSelect={() => runCommand(() => router.push('/multi-business'))}>
            <Building2 className="mr-2 h-4 w-4" />
            <span>Switch Business Entity</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
