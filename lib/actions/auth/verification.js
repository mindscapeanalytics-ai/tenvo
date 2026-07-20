'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import pool, { prismaBase } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendTransactionalEmail } from '@/lib/email/resend';

const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

async function requireSessionUser(userId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' };
  }
  if (session.user.id !== userId) {
    return { ok: false, error: 'Forbidden' };
  }
  return { ok: true, session };
}

/**
 * Generate a verification token for email verification (session-bound).
 */
async function generateVerificationToken(userId, email) {
  const client = await pool.connect();
  
  try {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY);

    await client.query(
      `INSERT INTO email_verifications (user_id, email, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         token = EXCLUDED.token,
         expires_at = EXCLUDED.expires_at,
         created_at = EXCLUDED.created_at`,
      [userId, email, token, expiresAt]
    );

    return { success: true, token };
  } catch (error) {
    console.error('[generateVerificationToken] Error:', error);
    return { success: false, error: 'Failed to generate verification token' };
  } finally {
    client.release();
  }
}

/**
 * Send verification email to the signed-in user only.
 */
export async function sendVerificationEmail(userId, email, name = '') {
  const gate = await requireSessionUser(userId);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  const sessionEmail = String(gate.session.user.email || '').trim().toLowerCase();
  const requestedEmail = String(email || '').trim().toLowerCase();
  if (sessionEmail && requestedEmail && sessionEmail !== requestedEmail) {
    return { success: false, error: 'Email does not match your signed-in account' };
  }

  try {
    const tokenResult = await generateVerificationToken(userId, email);
    if (!tokenResult.success) {
      return tokenResult;
    }

    const { token } = tokenResult;

    const headersList = await headers();
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const host = headersList.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const { AuthVerificationLinkEmail } = await import('@/lib/email/templates/AuthVerificationLinkEmail');
    const React = (await import('react')).default;
    const emailResult = await sendTransactionalEmail({
      to: email,
      subject: 'Verify your email, Tenvo',
      react: React.createElement(AuthVerificationLinkEmail, {
        verificationUrl,
        headline: 'Verify your email address',
        body: 'Click the button below to verify your email and continue registration. This link expires in 24 hours.',
      }),
    });

    if (!emailResult.success && !emailResult.skipped) {
      console.error('[sendVerificationEmail] Email send failed:', emailResult.error);
    }

    return { 
      success: true, 
      message: 'Verification email sent',
      ...(process.env.NODE_ENV !== 'production' ? { verificationUrl } : {})
    };
  } catch (error) {
    console.error('[sendVerificationEmail] Error:', error);
    return { success: false, error: 'Failed to send verification email' };
  }
}

/**
 * Verify email with token (public — link from email).
 */
export async function verifyEmail(token) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT * FROM email_verifications 
       WHERE token = $1 
       AND expires_at > NOW()
       AND verified_at IS NULL`,
      [token]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid or expired verification token' };
    }

    const verification = result.rows[0];

    await client.query(
      `UPDATE email_verifications 
       SET verified_at = NOW()
       WHERE id = $1`,
      [verification.id]
    );

    await auth.api.updateUser({
      userId: verification.user_id,
      data: { emailVerified: true }
    });

    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('[verifyEmail] Error:', error);
    return { success: false, error: 'Failed to verify email' };
  } finally {
    client.release();
  }
}

/**
 * Check if email is verified — session must match userId.
 */
export async function isEmailVerified(userId) {
  const gate = await requireSessionUser(userId);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    const u = await prismaBase.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });
    if (u?.emailVerified) {
      return { success: true, isVerified: true };
    }
  } catch (error) {
    console.error('[isEmailVerified] prisma user lookup:', error);
    return { success: false, error: 'Failed to check verification status' };
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT verified_at FROM email_verifications 
       WHERE user_id = $1 
       AND verified_at IS NOT NULL`,
      [userId]
    );

    return { success: true, isVerified: result.rows.length > 0 };
  } catch (error) {
    console.error('[isEmailVerified] Error:', error);
    return { success: false, error: 'Failed to check verification status' };
  } finally {
    client.release();
  }
}

/**
 * Resend verification email — signed-in user only.
 */
export async function resendVerificationEmail(userId, email, name = '') {
  const gate = await requireSessionUser(userId);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  try {
    const checkResult = await isEmailVerified(userId);
    if (checkResult.success && checkResult.isVerified) {
      return { success: false, error: 'Email is already verified' };
    }

    const canResend = await checkResendLimit(userId);
    if (!canResend) {
      return { 
        success: false, 
        error: 'Too many attempts. Please try again in an hour.' 
      };
    }

    return await sendVerificationEmail(userId, email, name);
  } catch (error) {
    console.error('[resendVerificationEmail] Error:', error);
    return { success: false, error: 'Failed to resend verification email' };
  }
}

async function checkResendLimit(userId) {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT COUNT(*) as count 
       FROM email_verifications 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '1 hour'`,
      [userId]
    );

    return result.rows[0].count < 3;
  } catch (error) {
    console.error('[checkResendLimit] Error:', error);
    return false;
  } finally {
    client.release();
  }
}
