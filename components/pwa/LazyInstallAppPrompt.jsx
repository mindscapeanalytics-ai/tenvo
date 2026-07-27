'use client';

import dynamic from 'next/dynamic';

/**
 * Code-split install prompt so hub first paint never waits on PWA UI.
 * No SSR — install APIs are client-only.
 */
const InstallAppPrompt = dynamic(
  () =>
    import('@/components/pwa/InstallAppPrompt').then((m) => m.InstallAppPrompt),
  { ssr: false, loading: () => null }
);

export function LazyInstallAppPrompt() {
  return <InstallAppPrompt />;
}
