import { Html, Head, Preview, Body, Container, Section, Text, Heading, Button } from '@react-email/components';

export function PasswordResetEmail({ resetUrl, business }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for {business.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Password Reset</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={paragraph}>
              You requested a password reset for your account at {business.name}.
            </Text>
            
            <Text style={paragraph}>
              Click the button below to reset your password. This link will expire in 1 hour.
            </Text>
            
            <Section style={ctaSection}>
              <Button style={ctaButton} href={resetUrl}>
                Reset Password
              </Button>
            </Section>
            
            <Text style={paragraph}>
              If you didn't request this, you can safely ignore this email.
            </Text>
            
            <Text style={smallText}>
              Or copy and paste this URL into your browser: {resetUrl}
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {business.name}
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

const paragraph = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
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

const smallText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '24px 0 0',
  wordBreak: 'break-all',
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

export default PasswordResetEmail;
