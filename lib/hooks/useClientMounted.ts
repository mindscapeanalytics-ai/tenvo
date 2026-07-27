'use client';

import { useEffect, useState } from 'react';

/** True after mount — use to defer locale/time-dependent UI and avoid hydration mismatches. */
export function useClientMounted(): boolean {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    return mounted;
}
