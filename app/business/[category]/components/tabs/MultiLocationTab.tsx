/**
 * Multi-Location Tab - Server Component Wrapper
 * Wraps the MultiLocationInventory component
 */

import { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MultiLocationInventory } from '@/components/MultiLocationInventory';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { WarehouseLocation, Product, DomainKnowledge } from '@/types';

interface MultiLocationTabProps {
    locations: WarehouseLocation[];
    products: Product[];
    businessId: string;
    category: string;
    domainKnowledge?: DomainKnowledge;
    onLocationAdd?: (data: any) => Promise<void>;
    onLocationUpdate?: (locationId: string, updates: any) => Promise<void>;
    onLocationDelete?: (locationId: string) => Promise<void>;
    onStockTransfer?: (data: any) => Promise<void>;
    refreshData?: () => Promise<void>;
}

export function MultiLocationTab({
    locations,
    products,
    businessId,
    category,
    domainKnowledge,
    onLocationAdd,
    onLocationUpdate,
    onLocationDelete,
    onStockTransfer,
    refreshData
}: MultiLocationTabProps) {
    return (
        <ErrorBoundary>
            <Suspense fallback={<MultiLocationSkeleton />}>
                <MultiLocationInventory
                    locations={locations}
                    products={products}
                    businessId={businessId}
                    category={category}
                    domainKnowledge={domainKnowledge}
                    onLocationAdd={onLocationAdd}
                    onLocationUpdate={onLocationUpdate}
                    onLocationDelete={onLocationDelete}
                    onStockTransfer={onStockTransfer}
                    refreshData={refreshData}
                />
            </Suspense>
        </ErrorBoundary>
    );
}

function MultiLocationSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-12 w-64 bg-muted animate-pulse rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="space-y-3">
                                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
