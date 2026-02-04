'use client';

import { useBusiness } from '@/lib/context/BusinessContext';
import { GeneralLedgerReport } from '@/components/reports/GeneralLedgerReport';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function GeneralLedgerPage() {
    const { business, isLoading } = useBusiness();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-wine" />
            </div>
        );
    }

    if (!business) {
        return <div className="p-8 text-center text-gray-500">Please select a business first.</div>;
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-wine">Financial Reports</h1>
                <p className="text-gray-500">Audit-ready financial statements and ledgers</p>
            </div>

            <GeneralLedgerReport businessId={business.id} />
        </div>
    );
}
