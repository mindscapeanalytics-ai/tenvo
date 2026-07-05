'use client';

import { useEffect, useState } from 'react';

/**
 * True when viewport is below the Tailwind `lg` breakpoint (1024px).
 * Matches hub mobile/desktop split (`lg:hidden` / `hidden lg:block`).
 */
export function useCompactViewport(maxWidthPx = 1023) {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [maxWidthPx]);

  return compact;
}
