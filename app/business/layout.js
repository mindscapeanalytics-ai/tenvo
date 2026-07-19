/**
 * Hub layout — server-side session guard before client shell renders.
 * Hydrates AuthContext with the already-validated session so tenant sync
 * does not wait on a second Better Auth client round-trip.
 */
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from '@/lib/auth/rbac';
import { BusinessShellLayout } from '@/components/layout/BusinessShellLayout';
import { HubSessionHydrator } from '@/components/guards/HubSessionHydrator';
import { toHubSessionHint } from '@/lib/utils/hubSessionHint';

function buildHubLoginRedirect(pathname) {
  const raw = typeof pathname === 'string' ? pathname.trim() : '';
  const nextPath =
    raw.startsWith('/business') && !raw.startsWith('//') ? raw : '/multi-business';
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export default async function BusinessLayout({ children }) {
  const headerList = await headers();
  const loginRedirect = buildHubLoginRedirect(headerList.get('x-tenvo-pathname'));

  let session = null;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error('[BusinessLayout] getServerSession failed:', error);
    redirect(loginRedirect);
  }

  if (!session?.user) {
    redirect(loginRedirect);
  }

  // Always serialize on the server with a non-client util (never import helpers from 'use client').
  const initialSession = toHubSessionHint(session);

  return (
    <HubSessionHydrator initialSession={initialSession}>
      <BusinessShellLayout>{children}</BusinessShellLayout>
    </HubSessionHydrator>
  );
}
