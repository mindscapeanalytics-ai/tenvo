'use server';

import { getEmailDeliveryMode } from '@/lib/email/emailDeliveryConfig';
import { actionSuccess } from '@/lib/actions/_shared/result';

/**
 * Safe client hint for registration OTP delivery (never exposes OTP or API keys).
 */
export async function getRegistrationEmailDeliveryAction() {
  const mode = getEmailDeliveryMode();
  const hint =
    mode === 'console'
      ? 'Development mode: if no email arrives, check the server terminal for your verification code.'
      : mode === 'misconfigured'
        ? 'Email delivery is not configured on this server. Contact support.'
        : null;

  return actionSuccess({ mode, hint });
}
