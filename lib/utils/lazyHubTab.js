'use client';

import dynamic from 'next/dynamic';
import { HubTabLoadingSkeleton } from '@/components/guards/HubTabLoadingSkeleton';
import { withChunkLoadRetry } from '@/lib/utils/chunkLoadRecovery';

/**
 * Hub tab code-split helper. Options must live in this module as an object literal
 * (Next.js rejects non-literal dynamic options at call sites).
 *
 * Wraps loaders with short retries so transient HTTP2 / CDN blips do not
 * immediately surface as ChunkLoadError in the hub ErrorBoundary.
 */
export function lazyHubTab(loader) {
  return dynamic(withChunkLoadRetry(loader), {
    loading: () => <HubTabLoadingSkeleton />,
  });
}
