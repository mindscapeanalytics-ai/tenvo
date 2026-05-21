import { Resend } from 'resend';
import { OrderConfirmationEmail } from './templates/OrderConfirmation';
import { WelcomeEmail } from './templates/Welcome';
import { PasswordResetEmail } from './templates/PasswordReset';
import { LowStockAlertEmail } from './templates/LowStockAlert';
import { ShipmentNotificationEmail } from './templates/ShipmentNotification';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM = 'Tenvo <notifications@tenvo.app>';

/**
 * Send transactional email
 */
export async function sendTransactionalEmail({
  to,
  subject,
  react,
  from = DEFAULT_FROM,
  replyTo,
  attachments,
}) {
  // Skip if no Resend API key (development mode)
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] Resend not configured, skipping email:', { to, subject });
    return { success: true, skipped: true };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
      replyTo,
      attachments,
    });
    
    if (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('[Email] Sent successfully:', { to, subject, id: data.id });
    return { success: true, id: data.id };
    
  } catch (err) {
    console.error('[Email] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail({ to, order, business }) {
  return sendTransactionalEmail({
    to,
    subject: `Order Confirmation #${order.orderNumber} - ${business.name}`,
    react: OrderConfirmationEmail({ order, business }),
    replyTo: business.email,
  });
}

/**
 * Send welcome email to new customer
 */
export async function sendWelcomeEmail({ to, customer, business }) {
  return sendTransactionalEmail({
    to,
    subject: `Welcome to ${business.name}!`,
    react: WelcomeEmail({ customer, business }),
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, resetUrl, business }) {
  return sendTransactionalEmail({
    to,
    subject: 'Reset Your Password',
    react: PasswordResetEmail({ resetUrl, business }),
  });
}

/**
 * Send low stock alert to business owner
 */
export async function sendLowStockAlert({ to, products, business }) {
  return sendTransactionalEmail({
    to,
    subject: `Low Stock Alert - ${products.length} Products`,
    react: LowStockAlertEmail({ products, business }),
  });
}

/**
 * Send shipment notification
 */
export async function sendShipmentNotification({ to, order, tracking, business }) {
  return sendTransactionalEmail({
    to,
    subject: `Your Order #${order.orderNumber} Has Shipped!`,
    react: ShipmentNotificationEmail({ order, tracking, business }),
  });
}

/**
 * Send abandoned cart reminder
 */
export async function sendAbandonedCartEmail({ to, cart, business }) {
  return sendTransactionalEmail({
    to,
    subject: 'You left something in your cart...',
    react: AbandonedCartEmail({ cart, business }),
  });
}

// Template components
function AbandonedCartEmail({ cart, business }) {
  return (
    <div>
      <h1>Don't forget about your cart!</h1>
      <p>You have {cart.items.length} items waiting in your cart at {business.name}.</p>
      {/* Cart items and CTA */}
    </div>
  );
}
