import { Html, Head, Preview, Body, Container, Section, Text, Heading, Row, Column } from '@react-email/components';

export function LowStockAlertEmail({ products, business }) {
  return (
    <Html>
      <Head />
      <Preview>Low stock alert for {products.length} products</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Low Stock Alert</Heading>
          </Section>
          
          <Section style={content}>
            <Text style={paragraph}>
              The following products are running low on stock and need your attention:
            </Text>
            
            <Section style={tableSection}>
              <Row style={tableHeader}>
                <Column style={productColumn}>Product</Column>
                <Column style={stockColumn}>Current Stock</Column>
                <Column style={statusColumn}>Status</Column>
              </Row>
              
              {products.map((product, index) => (
                <Row key={index} style={tableRow}>
                  <Column style={productColumn}>
                    <Text style={productName}>{product.name}</Text>
                    <Text style={productSku}>SKU: {product.sku}</Text>
                  </Column>
                  <Column style={stockColumn}>
                    <Text style={stockNumber}>{product.stock}</Text>
                  </Column>
                  <Column style={statusColumn}>
                    <Text style={product.stock === 0 ? statusOutOfStock : statusLow}>
                      {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </Text>
                  </Column>
                </Row>
              ))}
            </Section>
            
            <Text style={paragraph}>
              Please restock these items soon to avoid missing sales opportunities.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              This is an automated alert from {business.name}
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
  backgroundColor: '#ef4444',
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

const tableSection = {
  margin: '24px 0',
};

const tableHeader = {
  backgroundColor: '#f3f4f6',
  padding: '12px',
  borderRadius: '6px 6px 0 0',
};

const tableRow = {
  borderBottom: '1px solid #e5e7eb',
  padding: '12px',
};

const productColumn = {
  width: '50%',
};

const stockColumn = {
  width: '25%',
  textAlign: 'center',
};

const statusColumn = {
  width: '25%',
  textAlign: 'center',
};

const productName = {
  color: '#111827',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const productSku = {
  color: '#6b7280',
  fontSize: '12px',
  margin: '4px 0 0',
};

const stockNumber = {
  color: '#111827',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
};

const statusLow = {
  color: '#f59e0b',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0',
};

const statusOutOfStock = {
  color: '#ef4444',
  fontSize: '12px',
  fontWeight: '600',
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

export default LowStockAlertEmail;
