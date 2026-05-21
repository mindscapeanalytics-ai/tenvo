import { Html, Head, Preview, Body, Container, Section, Text, Heading, Row, Column, Button } from '@react-email/components';

export function OrderConfirmationEmail({ order, business }) {
  const { orderNumber, items, subtotal, shipping, tax, total, shippingMethod, paymentMethod } = order;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);
  };
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  return (
    <Html>
      <Head />
      <Preview>Your order #{orderNumber} has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>{business.name}</Heading>
            <Text style={headerSubtitle}>Order Confirmation</Text>
          </Section>
          
          {/* Thank You */}
          <Section style={thankYouSection}>
            <Heading style={thankYouTitle}>Thank you for your order!</Heading>
            <Text style={orderNumber}>Order #{orderNumber}</Text>
            <Text style={orderDate}>Placed on {formatDate(new Date())}</Text>
          </Section>
          
          {/* Order Items */}
          <Section style={itemsSection}>
            <Heading style={sectionTitle}>Order Details</Heading>
            
            {items.map((item, index) => (
              <Row key={index} style={itemRow}>
                <Column style={itemNameColumn}>
                  <Text style={itemName}>{item.name}</Text>
                  {item.variantName && (
                    <Text style={itemVariant}>{item.variantName}</Text>
                  )}
                  <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={itemPriceColumn}>
                  <Text style={itemPrice}>
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>
          
          {/* Order Summary */}
          <Section style={summarySection}>
            <Row style={summaryRow}>
              <Column style={summaryLabelColumn}>
                <Text style={summaryLabel}>Subtotal</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={summaryValue}>{formatCurrency(subtotal)}</Text>
              </Column>
            </Row>
            
            <Row style={summaryRow}>
              <Column style={summaryLabelColumn}>
                <Text style={summaryLabel}>Shipping</Text>
                <Text style={summarySublabel}>{shippingMethod}</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={summaryValue}>{formatCurrency(shipping)}</Text>
              </Column>
            </Row>
            
            <Row style={summaryRow}>
              <Column style={summaryLabelColumn}>
                <Text style={summaryLabel}>Tax (17% GST)</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={summaryValue}>{formatCurrency(tax)}</Text>
              </Column>
            </Row>
            
            <Row style={totalRow}>
              <Column style={summaryLabelColumn}>
                <Text style={totalLabel}>Total</Text>
              </Column>
              <Column style={summaryValueColumn}>
                <Text style={totalValue}>{formatCurrency(total)}</Text>
              </Column>
            </Row>
          </Section>
          
          {/* Payment Info */}
          <Section style={paymentSection}>
            <Text style={paymentMethod}>
              Payment Method: {paymentMethod === 'cod' ? 'Cash on Delivery' : 
                              paymentMethod === 'card' ? 'Credit/Debit Card' : 
                              paymentMethod}
            </Text>
            {paymentMethod === 'cod' && (
              <Text style={paymentNote}>
                Please keep the exact amount ready: {formatCurrency(total)}
              </Text>
            )}
          </Section>
          
          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href={`https://${business.domain}.tenvo.app/account/orders`}>
              View Order Details
            </Button>
          </Section>
          
          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              If you have any questions, please contact us at{' '}
              <a href={`mailto:${business.email}`} style={footerLink}>
                {business.email}
              </a>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} {business.name}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#c49c3b',
  padding: '30px 20px',
  textAlign: 'center',
  borderRadius: '8px 8px 0 0',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const headerSubtitle = {
  color: '#ffffff',
  fontSize: '14px',
  margin: '8px 0 0',
  opacity: '0.9',
};

const thankYouSection = {
  padding: '40px 20px',
  textAlign: 'center',
  borderBottom: '1px solid #e5e7eb',
};

const thankYouTitle = {
  color: '#111827',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 16px',
};

const orderNumber = {
  color: '#c49c3b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px',
};

const orderDate = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const itemsSection = {
  padding: '30px 20px',
  borderBottom: '1px solid #e5e7eb',
};

const sectionTitle = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 20px',
};

const itemRow = {
  marginBottom: '16px',
  paddingBottom: '16px',
  borderBottom: '1px solid #f3f4f6',
};

const itemNameColumn = {
  width: '70%',
};

const itemPriceColumn = {
  width: '30%',
  textAlign: 'right',
};

const itemName = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px',
};

const itemVariant = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '0 0 4px',
};

const itemQuantity = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};

const itemPrice = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const summarySection = {
  padding: '30px 20px',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const summaryRow = {
  marginBottom: '12px',
};

const totalRow = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '2px solid #e5e7eb',
};

const summaryLabelColumn = {
  width: '50%',
};

const summaryValueColumn = {
  width: '50%',
  textAlign: 'right',
};

const summaryLabel = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const summarySublabel = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '4px 0 0',
};

const summaryValue = {
  color: '#111827',
  fontSize: '14px',
  margin: '0',
};

const totalLabel = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const totalValue = {
  color: '#c49c3b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
};

const paymentSection = {
  padding: '30px 20px',
  textAlign: 'center',
};

const paymentMethod = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 8px',
};

const paymentNote = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
};

const ctaSection = {
  padding: '20px 20px 40px',
  textAlign: 'center',
};

const ctaButton = {
  backgroundColor: '#c49c3b',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
};

const footer = {
  padding: '30px 20px',
  textAlign: 'center',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0 0 16px',
};

const footerLink = {
  color: '#c49c3b',
  textDecoration: 'none',
};

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0',
};

export default OrderConfirmationEmail;
