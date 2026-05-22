import pool from '@/lib/db';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

// SSE endpoint for real-time notifications
export async function GET(request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get('businessId');

  if (!businessId) {
    return new Response('Business ID required', { status: 400 });
  }

  const encoder = new TextEncoder();
  let lastCheck = new Date();
  let isActive = true;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Check for new notifications every 3 seconds (SSE fallback)
      const interval = setInterval(async () => {
        if (!isActive) {
          clearInterval(interval);
          return;
        }

        try {
          const client = await pool.connect();
          
          try {
            // Get new notifications since last check
            const result = await client.query(
              `SELECT 
                id, type, title, message, metadata, action_url, created_at
              FROM notifications 
              WHERE business_id = $1 
                AND created_at > $2 
                AND is_dismissed = false
              ORDER BY created_at DESC`,
              [businessId, lastCheck]
            );

            if (result.rows.length > 0) {
              // Update last check time
              lastCheck = new Date();
              
              // Send notifications to client
              for (const notification of result.rows) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'notification', data: notification })}\n\n`)
                );
              }
            }

            // Send heartbeat
            controller.enqueue(encoder.encode('data: {"type":"heartbeat"}\n\n'));
            
          } finally {
            client.release();
          }
        } catch (error) {
          console.error('SSE error:', error);
          controller.enqueue(encoder.encode(`data: {"type":"error","message":"${error.message}"}\n\n`));
        }
      }, 3000);

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        isActive = false;
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
