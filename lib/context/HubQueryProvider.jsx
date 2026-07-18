'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Hub-scoped React Query provider (business shell only — not storefront).
 */
export function HubQueryProvider({ children }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 45_000,
                        gcTime: 10 * 60_000,
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                },
            })
    );

    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
