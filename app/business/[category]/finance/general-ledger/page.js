'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/** Deep-link compatibility: route legacy GL URL into Finance Hub sub-tab. */
export default function GeneralLedgerPage() {
    const router = useRouter();
    const params = useParams();
    const category = params?.category;

    useEffect(() => {
        if (!category) return;
        router.replace(`/business/${category}?tab=finance&financeView=general-ledger`);
    }, [router, category]);

    return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-wine" />
        </div>
    );
}
