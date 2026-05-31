import { NextResponse } from 'next/server';
import { validateEmail, validatePhone } from '@/lib/marketing/validation';
import { sendMarketingLeadNotification } from '@/lib/marketing/send-marketing-lead';

export const maxDuration = 30;

const INDUSTRIES = new Set([
  'retail',
  'manufacturing',
  'wholesale',
  'healthcare',
  'hospitality',
  'construction',
  'automotive',
  'textile',
  'electronics',
  'pharmaceutical',
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
  const company = clip(body.company, 200);
  const industry = clip(body.industry, 120);
  const message = clip(body.message, 2000);
  const preferredDate = clip(body.preferredDate, 64);
  const preferredTime = clip(body.preferredTime, 64);

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
  if (!company || company.length < 2) {
    return NextResponse.json({ message: 'Please enter your company name' }, { status: 400 });
  }
  if (!industry || !INDUSTRIES.has(industry)) {
    return NextResponse.json({ message: 'Please select a valid industry' }, { status: 400 });
  }

  const notify = await sendMarketingLeadNotification({
    type: 'Demo request',
    subject: `[TENVO Demo] ${company} - ${name}`,
    rows: {
      Name: name,
      Email: email,
      Phone: phone,
      Company: company,
      Industry: industry,
      Message: message || '(none)',
      'Preferred date': preferredDate || '(not set)',
      'Preferred time': preferredTime || '(not set)',
    },
    replyTo: email,
  });

  if (!notify.ok) {
    return NextResponse.json(
      { message: 'We could not submit your request. Please try again or contact us directly.' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Received',
    delivery: notify.delivered ? 'email' : notify.mode,
  });
}
