/**
 * Legacy email-verification link (token URL), separate from OTP template.
 */
export function AuthVerificationLinkEmail({ verificationUrl, headline, body }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>{headline}</h1>
      <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>{body}</p>
      <p style={{ textAlign: 'center', margin: '0 0 20px' }}>
        <a
          href={verificationUrl}
          style={{
            display: 'inline-block',
            background: '#7c2d12',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Verify email
        </a>
      </p>
      <p style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all', lineHeight: 1.5 }}>
        Or copy this link: {verificationUrl}
      </p>
    </div>
  );
}
