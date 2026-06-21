/**
 * Transactional email: Better Auth email OTP (sign-in, verification, password reset).
 */
export function AuthOtpEmail({ otp, headline, body }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 12px' }}>{headline}</h1>
      <p style={{ fontSize: 14, color: '#475569', margin: '0 0 20px', lineHeight: 1.5 }}>{body}</p>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '0.2em',
          textAlign: 'center',
          padding: '16px 24px',
          background: '#f1f5f9',
          borderRadius: 12,
          color: '#0f172a',
          marginBottom: 20,
        }}
      >
        {otp}
      </div>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
        If you did not request this code, you can ignore this message. It will expire shortly.
      </p>
    </div>
  );
}
