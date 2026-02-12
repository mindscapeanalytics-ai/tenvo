'use client';

import { memo } from 'react';
import { Portlet } from '@/components/ui/portlet';
import {
    PlusCircle,
    FilePlus,
    ArrowLeftRight,
    Truck,
    Users,
    Settings2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionTilesProps {
    onAction?: (actionId: string) => void;
}

export const QuickActionTiles = memo(function QuickActionTiles({ onAction }: QuickActionTilesProps) {
    const actions = [
        { id: 'sales', label: 'New Invoice', icon: FilePlus, color: 'bg-[#334155]', hover: 'hover:bg-[#1e293b]', desc: 'Direct Sale' },
        { id: 'transfer', label: 'Stock Transfer', icon: ArrowLeftRight, color: 'bg-[#8B1538]', hover: 'hover:bg-[#72112e]', desc: 'Inter-branch' },
        { id: 'receive', label: 'Inventory Adj', icon: Truck, color: 'bg-[#15803d]', hover: 'hover:bg-[#166534]', desc: 'Stock Corrections' },
        { id: 'customers', label: 'Customers', icon: Users, color: 'bg-[#0369a1]', hover: 'hover:bg-[#075985]', desc: 'CRM Manage' },
        { id: 'product', label: 'New Product', icon: PlusCircle, color: 'bg-[#6d28d9]', hover: 'hover:bg-[#5b21b6]', desc: 'Entry & Catalog' },
        { id: 'settings', label: 'Settings', icon: Settings2, color: 'bg-[#475569]', hover: 'hover:bg-[#334155]', desc: 'System Config' },
    ];

    return (
        <Portlet title="Quick Shortcuts" compact>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                {actions.map((action) => (
                    <button
                        key={action.id}
                        onClick={() => onAction?.(action.id)}
                        className={cn(
                            "group relative flex flex-col items-center justify-center p-4 rounded-xl text-white transition-all duration-300 shadow-sm border border-white/10",
                            action.color,
                            action.hover
                        )}
                    >
                        <div className="p-2 rounded-full bg-white/10 mb-2 group-hover:scale-110 transition-transform">
                            <action.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider">{action.label}</span>
                        <span className="text-[8px] opacity-60 font-medium uppercase mt-0.5">{action.desc}</span>

                        {/* Glass overlay effect on hover */}
                        <div className="absolute inset-0 rounded-xl bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none" />
                    </button>
                ))}
            </div>
        </Portlet>
    );
});
