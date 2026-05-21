import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button } from '@react-email/components';

export function WelcomeEmail({ customer, business }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {business.name}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Welcome to {business.name}!</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={greeting}>Hi {customer.name},</Text>
            <Text style={paragraph}>
              Thank you for creating an account with us. We're excited to have you as a customer!
            </Text>
            
            <Text style={paragraph}>
              You can now:
            </Text>
            
            <ul style={list}>
              <li style={listItem}>Browse our latest products</li>
              <li style={listItem}>Track your orders</li>
              <li style={listItem}>Save your favorite items to your wishlist</li>
              <li style={listItem}>Get exclusive offers and discounts</li>
            </ul>
            
            <Section style={ctaSection}>
              <Button 
                style={ctaButton} 
                href={`https://${business.domain}.tenvo.app/products`}
              >
                Start Shopping
              </Button>
            </Section>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              If you have any questions, please contact us at{' '}
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
  backgroundColor: '#c49c3b',
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

const greeting = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const list = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
  paddingLeft: '24px',
};

const listItem = {
  margin: '0 0 8px',
};

const ctaSection = {
  textAlign: 'center',
  margin: '32px 0',
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
  margin: '0',
};

const link = {
  color: '#c49c3b',
  textDecoration: 'none',
};

export default WelcomeEmail;
