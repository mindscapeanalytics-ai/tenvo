import { NextResponse } from 'next/server';
import { validateEmail } from '@/lib/marketing/validation';
import { sendMarketingLeadNotification } from '@/lib/marketing/send-marketing-lead';

export const maxDuration = 15;

function clip(s, max) {
  if (typeof s !== 'string') return '';
  return s.trim().slice(0, max);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const email = clip(body.email, 320);
  const check = validateEmail(email);
  if (!check.isValid) {
    return NextResponse.json({ message: check.error }, { status: 400 });
  }

  const notify = await sendMarketingLeadNotification({
    type: 'Newsletter',
    subject: `[TENVO Newsletter] Subscribe: ${email}`,
    rows: { Email: email, Source: 'marketing_footer_or_form' },
    replyTo: email,
  });

  if (!notify.ok) {
    return NextResponse.json(
      { message: 'Subscription could not be saved. Please try again later.' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Subscribed',
    delivery: notify.delivered ? 'email' : notify.mode,
  });
}
