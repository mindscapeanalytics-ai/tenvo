export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
/** Allow long-lived SSE on platforms that honor maxDuration (e.g. Vercel Pro). */
export const maxDuration = 60;

import { prismaBase } from '@/lib/db';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { verifyBusinessAccess } from '@/lib/auth/access';
import { pickBusinessIdFromSearchParams } from '@/lib/utils/pickBusinessId';

/** Poll interval — longer cadence reduces DB load (was 5s). */
const POLL_MS = 15000;
/** Send a comment keepalive sooner so proxies do not idle-close the socket. */
const KEEPALIVE_COMMENT = ': keepalive\n\n';

function isMissingNotificationsTable(error) {
  const code = error?.code;
  const message = String(error?.message || '');
  return (
    code === 'P2021' ||
    code === '42P01' ||
    /relation "notifications" does not exist/i.test(message)
  );
}

/** SSE endpoint for real-time notifications (poll fallback on the client). */
export async function GET(request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const businessId = pickBusinessIdFromSearchParams(searchParams);

  if (!businessId) {
    return new Response('Business ID required', { status: 400 });
  }

  try {
    await verifyBusinessAccess(session.user.id, businessId, [], null, session.user);
  } catch {
    return new Response('Forbidden', { status: 403 });
  }

  const encoder = new TextEncoder();
  let lastCheck = new Date();
  let isActive = true;
  let consecutiveErrors = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let interval = null;
  /** @type {string | null} */
  let lastNotificationSignature = null;

  function cleanup() {
    isActive = false;
    if (interval != null) {
      clearInterval(interval);
      interval = null;
    }
  }

  function safeEnqueue(controllerRef, text) {
    if (!isActive) return false;
    try {
      controllerRef.enqueue(encoder.encode(text));
      return true;
    } catch {
      cleanup();
      return false;
    }
  }

  function safeClose(controllerRef) {
    cleanup();
    try {
      controllerRef.close();
    } catch {
      // already closed
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      if (!safeEnqueue(controller, `data: {"type":"connected"}\n\n`)) {
        return;
      }
      // Immediate comment so intermediaries see activity before the first poll.
      safeEnqueue(controller, KEEPALIVE_COMMENT);

      interval = setInterval(async () => {
        if (!isActive) {
          cleanup();
          return;
        }

        try {
          const latest = await prismaBase.notifications.findFirst({
            where: {
              business_id: businessId,
              is_dismissed: false,
            },
            orderBy: { created_at: 'desc' },
            select: { id: true, created_at: true },
          });

          if (!isActive) return;

          const signature = latest
            ? `${latest.id}:${latest.created_at?.getTime?.() ?? latest.created_at}`
            : 'none';

          if (signature === lastNotificationSignature) {
            if (!safeEnqueue(controller, 'data: {"type":"heartbeat"}\n\n')) {
              safeClose(controller);
            }
            consecutiveErrors = 0;
            return;
          }

          lastNotificationSignature = signature;

          const rows = await prismaBase.notifications.findMany({
            where: {
              business_id: businessId,
              is_dismissed: false,
              created_at: { gt: lastCheck },
            },
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              type: true,
              title: true,
              message: true,
              metadata: true,
              action_url: true,
              created_at: true,
              is_read: true,
            },
          });

          if (!isActive) return;

          consecutiveErrors = 0;

          if (rows.length > 0) {
            lastCheck = new Date();
            for (const notification of rows) {
              if (
                !safeEnqueue(
                  controller,
                  `data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`
                )
              ) {
                safeClose(controller);
                return;
              }
            }
          }

          if (!safeEnqueue(controller, 'data: {"type":"heartbeat"}\n\n')) {
            safeClose(controller);
          }
        } catch (error) {
          consecutiveErrors += 1;
          const fatal = isMissingNotificationsTable(error);
          const message = fatal
            ? 'Notifications table is not available on this database'
            : error?.message || 'Notification stream unavailable';

          console.error('[Notifications SSE]', message);

          safeEnqueue(
            controller,
            `data: ${JSON.stringify({
              type: 'error',
              message,
              fatal,
              retryable: !fatal && consecutiveErrors < 3,
            })}\n\n`
          );

          if (fatal || consecutiveErrors >= 5) {
            safeClose(controller);
          }
        }
      }, POLL_MS);

      const onAbort = () => {
        safeClose(controller);
      };
      if (request.signal.aborted) {
        onAbort();
      } else {
        request.signal.addEventListener('abort', onAbort, { once: true });
      }
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
