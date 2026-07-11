/**
 * Hub layout — server-side session guard before client shell renders.
 * Hydrates AuthContext with the already-validated session so tenant sync
 * does not wait on a second Better Auth client round-trip.
 */
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/rbac';
import { BusinessShellLayout } from '@/components/layout/BusinessShellLayout';
import { HubSessionHydrator } from '@/components/guards/HubSessionHydrator';
import { toHubSessionHint } from '@/lib/utils/hubSessionHint';

export default async function BusinessLayout({ children }) {
  let session = null;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error('[BusinessLayout] getServerSession failed:', error);
    redirect('/login');
  }

  if (!session?.user) {
    redirect('/login');
  }

  // Always serialize on the server with a non-client util (never import helpers from 'use client').
  const initialSession = toHubSessionHint(session);

  return (
    <HubSessionHydrator initialSession={initialSession}>
      <BusinessShellLayout>{children}</BusinessShellLayout>
    </HubSessionHydrator>
  );
}
