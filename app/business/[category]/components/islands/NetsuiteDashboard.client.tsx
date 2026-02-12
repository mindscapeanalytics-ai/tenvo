'use client';

import { memo, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NetsuiteDashboardProps {
    children: ReactNode;
    className?: string;
    title?: string;
}

/**
 * NetSuite-Inspired Dashboard Grid Layout
 */
export default function NetsuiteDashboard({
    children,
    className,
    title = "Dashboard"
}: NetsuiteDashboardProps) {
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    return (
        <div className={cn("space-y-6 animate-in fade-in duration-500", className)}>
            {/* NetSuite Style Toolbar */}
            <div className="flex items-center justify-between border-b pb-4 border-gray-200">
                <div>
                    <h1 className="text-3xl font-[900] text-wine tracking-tighter uppercase mb-0.5">
                        {title}
                    </h1>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-wine rounded-full animate-pulse" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                            Global Overview & Intelligent Control
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <Button
                            variant={layout === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setLayout('grid')}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={layout === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setLayout('list')}
                        >
                            <LayoutList className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" className="font-bold text-xs uppercase border-gray-300">
                        Personalize
                    </Button>
                </div>
            </div>

            {/* Portlet Grid */}
            <div className={cn(
                "grid gap-4",
                layout === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-12" : "grid-cols-1"
            )}>
                {children}
            </div>
        </div>
    );
}

interface PortletColumnProps {
    children: ReactNode;
    span?: number;
    className?: string;
}

/**
 * Helper to define portlet column spans in the 12-column grid
 */
export const PortletColumn = memo(function PortletColumn({
    children,
    span = 4,
    className
}: PortletColumnProps) {
    return (
        <div className={cn(
            span === 4 ? "lg:col-span-4" :
                span === 8 ? "lg:col-span-8" :
                    span === 12 ? "lg:col-span-12" :
                        `lg:col-span-${span}`,
            className
        )}>
            {children}
        </div>
    );
});
