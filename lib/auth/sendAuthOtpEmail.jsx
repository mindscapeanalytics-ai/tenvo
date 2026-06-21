import { sendTransactionalEmail } from '@/lib/email/resend';
import { AuthOtpEmail } from '@/lib/email/templates/AuthOtpEmail';
import { assertEmailDeliveryReady, mapEmailDeliveryError } from '@/lib/email/emailDeliveryConfig';

const TYPE_COPY = {
  'sign-in': {
    subject: 'Your Tenvo sign-in code',
    headline: 'Sign in to Tenvo',
    body: 'Use this one-time code to complete sign-in. Do not share it with anyone.',
  },
  'email-verification': {
    subject: 'Verify your email for Tenvo',
    headline: 'Verify your email',
    body: 'Use this one-time code to verify your email address and continue registration.',
  },
  'forget-password': {
    subject: 'Reset your Tenvo password',
    headline: 'Password reset',
    body: 'Use this one-time code to reset your password. If you did not request a reset, ignore this email.',
  },
};

/**
 * Called from Better Auth `emailOTP` plugin `sendVerificationOTP`.
 * Uses Resend when configured; otherwise logs OTP (dev / misconfiguration).
 *
 * @param {{ email: string; otp: string; type: 'sign-in' | 'email-verification' | 'forget-password' }} params
 */
export async function sendAuthOtpEmail({ email, otp, type }) {
  const copy = TYPE_COPY[type] || TYPE_COPY['sign-in'];
  const normalizedTo = String(email || '').trim().toLowerCase();
  if (!normalizedTo) {
    throw new Error('Email address is required to send a verification code.');
  }

  assertEmailDeliveryReady();

  const result = await sendTransactionalEmail({
    to: normalizedTo,
    subject: copy.subject,
    react: <AuthOtpEmail otp={otp} headline={copy.headline} body={copy.body} />,
  });

  if (result.skipped) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Email delivery is not configured. Set RESEND_API_KEY and RESEND_FROM before launch.'
      );
    }
    console.warn('[sendAuthOtpEmail] Resend not configured — OTP (dev only):', {
      email: normalizedTo,
      type,
      otp,
    });
    return result;
  }

  if (!result.success) {
    throw new Error(mapEmailDeliveryError(result.error));
  }

  return result;
}
