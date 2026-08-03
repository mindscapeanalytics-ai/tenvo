import { NextResponse } from 'next/server';
import { validateEmail, validatePhone } from '@/lib/marketing/validation';
import { sendMarketingLeadNotification } from '@/lib/marketing/send-marketing-lead';

export const maxDuration = 30;

const SUBJECTS = new Set([
  'general',
  'sales',
  'support',
  'billing',
  'partnership',
  'feedback',
  'other',
]);

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

  const name = clip(body.name, 120);
  const email = clip(body.email, 320);
  const phone = clip(body.phone, 40);
  const subject = clip(body.subject, 64);
  const message = clip(body.message, 1200);

  if (!name || name.length < 2) {
    return NextResponse.json({ message: 'Please enter your name' }, { status: 400 });
  }
  const emailCheck = validateEmail(email);
  if (!emailCheck.isValid) {
    return NextResponse.json({ message: emailCheck.error }, { status: 400 });
  }
  const phoneCheck = validatePhone(phone);
  if (!phoneCheck.isValid) {
    return NextResponse.json({ message: phoneCheck.error }, { status: 400 });
  }
  if (!subject || !SUBJECTS.has(subject)) {
    return NextResponse.json({ message: 'Please select a valid subject' }, { status: 400 });
  }
  if (!message || message.length < 10) {
    return NextResponse.json(
      { message: 'Message must be at least 10 characters' },
      { status: 400 }
    );
  }

  const notify = await sendMarketingLeadNotification({
    type: 'Contact form',
    subject: `[TENVO Contact] ${subject} - ${name}`,
    rows: {
      Name: name,
      Email: email,
      Phone: phone,
      Subject: subject,
      Message: message,
    },
    replyTo: email,
  });

  if (!notify.ok) {
    return NextResponse.json(
      { message: 'We could not deliver your message right now. Please email support or try again shortly.' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Received',
    delivery: notify.delivered ? 'email' : notify.mode,
  });
}
