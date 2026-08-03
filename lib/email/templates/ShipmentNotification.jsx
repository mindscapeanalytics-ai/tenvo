import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button, Row, Column } from '@react-email/components';

export function ShipmentNotificationEmail({ order, tracking, business }) {
  return (
    <Html>
      <Head />
      <Preview>Your order #{order.orderNumber} has shipped!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Your Order Has Shipped!</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={paragraph}>
              Great news! Your order <strong>#{order.orderNumber}</strong> from {business.name} has been shipped and is on its way to you.
            </Text>
            
            {tracking && (
              <Section style={trackingSection}>
                <Heading style={trackingTitle}>Tracking Information</Heading>
                <Text style={trackingInfo}>
                  Carrier: {tracking.carrier}<br />
                  Tracking Number: <strong>{tracking.number}</strong>
                </Text>
                
                <Section style={ctaSection}>
                  <Button 
                    style={ctaButton} 
                    href={tracking.url || `https://track.aftership.com/${tracking.number}`}
                  >
                    Track Your Package
                  </Button>
                </Section>
              </Section>
            )}
            
            <Section style={orderSection}>
              <Heading style={sectionTitle}>Order Summary</Heading>
              
              {order.items.map((item, index) => (
                <Row key={index} style={itemRow}>
                  <Column style={itemNameColumn}>
                    <Text style={itemName}>{item.name}</Text>
                    {item.variantName && (
                      <Text style={itemVariant}>{item.variantName}</Text>
                    )}
                    <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                  </Column>
                </Row>
              ))}
              
              <Row style={totalRow}>
                <Column style={totalLabelColumn}>
                  <Text style={totalLabel}>Total</Text>
                </Column>
                <Column style={totalValueColumn}>
                  <Text style={totalValue}>
                    {new Intl.NumberFormat('en-PK', {
                      style: 'currency',
                      currency: 'PKR',
                    }).format(order.total)}
                  </Text>
                </Column>
              </Row>
            </Section>
            
            <Text style={paragraph}>
              Estimated delivery: <strong>{tracking?.estimatedDelivery || '3-5 business days'}</strong>
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Contact us at{' '}
              <a href={`mailto:${business.email}`} style={link}>
                {business.email}
              </a>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

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
  backgroundColor: '#22c55e',
  padding: '40px 20px',
  textAlign: 'center',
  borderRadius: '8px 8px 0 0',
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '40px 20px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const trackingSection = {
  backgroundColor: '#f0fdf4',
  padding: '24px',
  borderRadius: '8px',
  margin: '24px 0',
};

const trackingTitle = {
  color: '#166534',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
};

const trackingInfo = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const ctaSection = {
  textAlign: 'center',
};

const ctaButton = {
  backgroundColor: '#22c55e',
  color: '#ffffff',
  padding: '14px 28px',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  display: 'inline-block',
};

const orderSection = {
  margin: '32px 0',
  padding: '24px 0',
  borderTop: '1px solid #e5e7eb',
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
};

const itemNameColumn = {
  width: '100%',
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

const totalRow = {
  marginTop: '16px',
  paddingTop: '16px',
  borderTop: '2px solid #e5e7eb',
};

const totalLabelColumn = {
  width: '50%',
};

const totalValueColumn = {
  width: '50%',
  textAlign: 'right',
};

const totalLabel = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const totalValue = {
  color: '#111827',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0',
};

const footer = {
  padding: '30px 20px',
  textAlign: 'center',
  borderTop: '1px solid #e5e7eb',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
};

const link = {
  color: '#22c55e',
  textDecoration: 'none',
};

export default ShipmentNotificationEmail;
