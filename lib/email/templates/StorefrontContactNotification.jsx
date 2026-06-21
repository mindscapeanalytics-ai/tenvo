export function StorefrontContactNotification({
  storeName,
  name,
  email,
  phone,
  orderNumber,
  subjectLabel,
  message,
}) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: 1.5, color: '#111' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>New message from your storefront</h2>
      <p style={{ margin: '4px 0' }}>
        <strong>Store:</strong> {storeName}
      </p>
      <p style={{ margin: '4px 0' }}>
        <strong>From:</strong> {name} &lt;{email}&gt;
      </p>
      {phone ? (
        <p style={{ margin: '4px 0' }}>
          <strong>Phone:</strong> {phone}
        </p>
      ) : null}
      {orderNumber ? (
        <p style={{ margin: '4px 0' }}>
          <strong>Order #:</strong> {orderNumber}
        </p>
      ) : null}
      <p style={{ margin: '4px 0' }}>
        <strong>Subject:</strong> {subjectLabel}
      </p>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>{message}</p>
    </div>
  );
}
