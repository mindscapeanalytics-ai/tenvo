/**
 * Plain transactional layout for marketing form submissions (Resend / React Email compatible).
 */
export default function MarketingLeadEmail({ title, rows }) {
  const entries = Object.entries(rows || {}).filter(
    ([, v]) => v !== undefined && v !== null && String(v).trim() !== ''
  );

  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', lineHeight: 1.5, color: '#111' }}>
      <h1 style={{ fontSize: '18px', margin: '0 0 16px' }}>{title}</h1>
      <table cellPadding="8" style={{ borderCollapse: 'collapse', width: '100%', maxWidth: '560px' }}>
        <tbody>
          {entries.map(([key, value]) => (
            <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ fontWeight: 600, verticalAlign: 'top', width: '140px' }}>{key}</td>
              <td style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        Submitted from the TENVO marketing site. Reply directly to this thread if Reply-To is set to the visitor.
      </p>
    </div>
  );
}
