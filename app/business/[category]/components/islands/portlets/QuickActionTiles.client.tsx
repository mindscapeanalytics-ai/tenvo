'use client';

import { memo } from 'react';
import { Portlet } from '@/components/ui/portlet';
import {
    PlusCircle,
    FilePlus,
    ArrowLeftRight,
    Truck,
    Users,
    Settings2,
    Megaphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionTilesProps {
    onAction?: (actionId: string) => void;
    campaignEnabled?: boolean;
    multiLocationEnabled?: boolean;
}

export const QuickActionTiles = memo(function QuickActionTiles({
    onAction,
    campaignEnabled = false,
    multiLocationEnabled = false
}: QuickActionTilesProps) {
    const transferAction = multiLocationEnabled ? 'warehouses' : 'add-purchase';

    const actions = [
        { id: 'new-invoice', label: 'New Invoice', icon: FilePlus, desc: 'Direct Sale' },
        { id: transferAction, label: 'Stock Transfer', icon: ArrowLeftRight, desc: multiLocationEnabled ? 'Inter-branch' : 'Procurement' },
        { id: 'inventory', label: 'Inventory Adj', icon: Truck, desc: 'Stock Corrections' },
        { id: 'new-customer', label: 'Customers', icon: Users, desc: 'CRM Manage' },
        { id: 'new-product', label: 'New Product', icon: PlusCircle, desc: 'Entry & Catalog' },
        campaignEnabled
            ? { id: 'campaigns', label: 'Campaigns', icon: Megaphone, desc: 'Marketing Ops' }
            : { id: 'reports', label: 'Analytics', icon: Settings2, desc: 'System Insights' },
    ].filter((action, index, arr) => arr.findIndex((candidate) => candidate.id === action.id) === index);

    const accentBorder: Record<string, string> = {
        'new-invoice': 'border-l-slate-700',
        'warehouses': 'border-l-amber-600',
        'add-purchase': 'border-l-amber-600',
        inventory: 'border-l-emerald-600',
        'new-customer': 'border-l-sky-600',
        'new-product': 'border-l-[#e34242]',
        campaigns: 'border-l-slate-600',
        reports: 'border-l-slate-600',
    };

    const iconTint: Record<string, string> = {
        'new-invoice': 'text-slate-700 bg-slate-100',
        'warehouses': 'text-amber-700 bg-amber-50',
        'add-purchase': 'text-amber-700 bg-amber-50',
        inventory: 'text-emerald-700 bg-emerald-50',
        'new-customer': 'text-sky-700 bg-sky-50',
        'new-product': 'text-[#b91c1c] bg-red-50',
        campaigns: 'text-slate-700 bg-slate-100',
        reports: 'text-slate-700 bg-slate-100',
    };

    return (
        <Portlet title="Quick Shortcuts" compact>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        type="button"
                        onClick={() => onAction?.(action.id)}
                        className={cn(
                            'group relative flex flex-row items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition-all',
                            'hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25',
                            'border-l-[3px]',
                            accentBorder[action.id] || 'border-l-slate-400'
                        )}
                    >
                        <div
                            className={cn(
                                'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-100',
                                iconTint[action.id] || 'text-slate-600 bg-slate-50'
                            )}
                        >
                            <action.icon className="w-5 h-5" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <span className="block text-[11px] font-black uppercase tracking-wide text-slate-800">{action.label}</span>
                            <span className="mt-0.5 block text-[10px] font-semibold text-slate-500">{action.desc}</span>
                        </div>
                    </button>
                ))}
            </div>
        </Portlet>
    );
});
