'use client';

import { memo, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NetsuiteDashboardProps {
    children: ReactNode;
    className?: string;
}

/**
 * Dashboard shell grid.
 * Desktop Advanced content should live in a single `lg:col-span-12` stacked shell
 * so sibling bands share spacing. Avoid placing tall/short cards as separate
 * outer grid rows (that creates column voids).
 */
export default function NetsuiteDashboard({
    children,
    className
}: NetsuiteDashboardProps) {
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');

    // Listen for global layout toggle from Header
    useEffect(() => {
        const handleLayoutToggle = () => {
            setLayout(prev => prev === 'grid' ? 'list' : 'grid');
        };
        window.addEventListener('change-layout', handleLayoutToggle);
        return () => window.removeEventListener('change-layout', handleLayoutToggle);
    }, []);

    return (
        <div className={cn("animate-in fade-in duration-500", className)}>
            <div className={cn(
                "mt-1 grid items-start gap-2 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-16",
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
