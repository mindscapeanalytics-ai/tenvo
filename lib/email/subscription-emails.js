import { sendTransactionalEmail } from './resend';

// Lazy import to avoid circular dependency
async function getPlanTiers() {
  const { PLAN_TIERS } = await import('@/lib/config/plans-new');
  return PLAN_TIERS;
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail({ to, businessName, planTier }) {
  const PLAN_TIERS = await getPlanTiers();
  const plan = PLAN_TIERS[planTier];
  const planName = plan?.name || planTier;

  const emailContent = {
    to,
    subject: `Welcome to Tenvo ${planName} Plan!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #c49c3b 0%, #a8832d 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Subscription Confirmed!</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333;">Thank you, ${businessName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your subscription to the <strong>${planName}</strong> plan has been successfully activated.
          </p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #c49c3b; margin-top: 0;">What's Included:</h3>
            <ul style="color: #666; line-height: 1.8;">
              ${await getPlanFeaturesList(planTier)}
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/business" 
               style="background: #c49c3b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Questions? Contact us at support@tenvo.app
          </p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Tenvo. All rights reserved.
        </div>
      </div>
    `,
  };

  return sendTransactionalEmail(emailContent);
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail({ to, businessName, invoiceUrl }) {
  const emailContent = {
    to,
    subject: 'Action Required: Payment Failed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Failed</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333;">Hi ${businessName},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We were unable to process your subscription payment. Please update your payment method to avoid service interruption.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            ${invoiceUrl ? `
            <a href="${invoiceUrl}" 
               style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Update Payment Method
            </a>
            ` : ''}
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Need help? Contact support@tenvo.app
          </p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Tenvo. All rights reserved.
        </div>
      </div>
    `,
  };

  return sendTransactionalEmail(emailContent);
}

/**
 * Send subscription cancelled email
 */
export async function sendSubscriptionCancelledEmail({ to, businessName }) {
  const emailContent = {
    to,
    subject: 'Subscription Cancelled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f5f5f5; padding: 30px; text-align: center;">
          <h1 style="color: #666; margin: 0;">Subscription Cancelled</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333;">Hi ${businessName},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your subscription has been cancelled and you will be moved to the Free plan at the end of your current billing period.
          </p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">What happens next?</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>You can continue using your current plan until the billing period ends</li>
              <li>After that, you'll be moved to the Free plan with limited features</li>
              <li>Your data will be preserved for 30 days</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
               style="background: #c49c3b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reactivate Subscription
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            We'd love to have you back! If you have feedback, please reply to this email.
          </p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Tenvo. All rights reserved.
        </div>
      </div>
    `,
  };

  return sendTransactionalEmail(emailContent);
}

/**
 * Send trial ending email
 */
export async function sendTrialEndingEmail({ to, businessName, daysLeft }) {
  const emailContent = {
    to,
    subject: `Your trial ends in ${daysLeft} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Trial Ending Soon</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333;">Hi ${businessName},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your free trial ends in <strong>${daysLeft} days</strong>. Don't lose access to your business tools!
          </p>
          
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">Why upgrade?</h3>
            <ul style="color: #78350f; line-height: 1.8;">
              <li>Unlimited invoices and transactions</li>
              <li>Advanced reports and analytics</li>
              <li>Multi-user access and permissions</li>
              <li>Priority support</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
               style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Choose a Plan
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Questions? Reply to this email or contact support@tenvo.app
          </p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Tenvo. All rights reserved.
        </div>
      </div>
    `,
  };

  return sendTransactionalEmail(emailContent);
}

/**
 * Send receipt email
 */
export async function sendReceiptEmail({ to, businessName, amount, currency, date, invoiceNumber }) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);

  const emailContent = {
    to,
    subject: `Receipt for ${formattedAmount}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Payment Received</h1>
        </div>
        
        <div style="padding: 30px; background: white;">
          <h2 style="color: #333;">Thank you, ${businessName}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We've received your payment of <strong>${formattedAmount}</strong>.
          </p>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <table style="width: 100%; color: #666;">
              <tr>
                <td style="padding: 8px 0;"><strong>Invoice Number:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Amount:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; text-align: right;">${new Date(date).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Status:</strong></td>
                <td style="padding: 8px 0; text-align: right; color: #22c55e;">Paid</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            Questions? Contact support@tenvo.app
          </p>
        </div>
        
        <div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          © ${new Date().getFullYear()} Tenvo. All rights reserved.
        </div>
      </div>
    `,
  };

  return sendTransactionalEmail(emailContent);
}

/**
 * Get plan features as HTML list
 */
async function getPlanFeaturesList(planTier) {
  const PLAN_TIERS = await getPlanTiers();
  const plan = PLAN_TIERS[planTier];
  if (!plan) return '<li>Standard features</li>';

  const features = [];
  
  if (plan.limits.max_users > 0) {
    features.push(`Up to ${plan.limits.max_users} users`);
  } else if (plan.limits.max_users === -1) {
    features.push('Unlimited users');
  }

  if (plan.limits.max_products > 0) {
    features.push(`${plan.limits.max_products.toLocaleString()} products`);
  }

  if (plan.features.pos_terminal) {
    features.push(`POS Terminal support`);
  }

  if (plan.features.ai_analytics) {
    features.push('AI-powered analytics');
  }

  if (plan.features.payroll_processing) {
    features.push('Payroll processing');
  }

  if (plan.features.api_access) {
    features.push('API access');
  }

  return features.map(f => `<li>${f}</li>`).join('');
}

export default {
  sendSubscriptionConfirmationEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendTrialEndingEmail,
  sendReceiptEmail,
};
