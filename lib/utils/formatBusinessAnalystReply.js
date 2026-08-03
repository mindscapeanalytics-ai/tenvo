/**
 * Normalize askBusinessAnalystAction / legacy payloads for chat UI.
 * Never pass the raw `data` object into React children (React error #31).
 *
 * @param {unknown} res - Server action result
 * @returns {string} User-safe plain text
 */
export function formatBusinessAnalystReply(res) {
  if (!res || res.success === false) {
    if (typeof res?.error === 'string' && res.error.trim()) {
      return sanitizeAnalystUserMessage(res.error.trim());
    }
    return 'Something went wrong. Please try again.';
  }
  if (typeof res.answer === 'string' && res.answer.trim()) {
    return sanitizeAnalystUserMessage(res.answer.trim());
  }

  const d = res.data;
  if (typeof d === 'string' && d.trim()) return sanitizeAnalystUserMessage(d.trim());
  if (d && typeof d === 'object') {
    if (typeof d.insight === 'string' && d.insight.trim()) {
      return sanitizeAnalystUserMessage(d.insight.trim());
    }
    if (typeof d.error === 'string' && d.error.trim()) {
      return sanitizeAnalystUserMessage(d.error.trim());
    }
  }
  return 'I could not format a reply. Try rephrasing your question or check that AI keys are configured.';
}

/** Strip SQL / raw row payloads from user-visible analyst errors. */
function sanitizeAnalystUserMessage(text) {
  if (/business_id\s*=/i.test(text) || /\bSELECT\b/i.test(text)) {
    return 'This query could not be completed safely. Try a simpler question about your own business data.';
  }
  return text;
}
