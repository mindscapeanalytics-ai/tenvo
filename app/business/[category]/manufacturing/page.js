'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ManufacturingPage() {
    const router = useRouter();
    const params = useParams();

    useEffect(() => {
        if (params?.category) {
            router.replace(`/business/${params.category}?tab=manufacturing`);
        }
    }, [params, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
}
