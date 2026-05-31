'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, MessageCircle, Send, X, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TENVO_PARENT_COMPANY } from '@/lib/marketing/tenvo-assistant-knowledge';
import AssistantMessageMarkdown from '@/components/marketing/AssistantMessageMarkdown';

const STARTER = `Hi, I am TENVO's assistant. Ask about inventory, storefront, POS, pricing, demos, or how we compare to stitched-together tools. We go deep in Pakistan at launch and scale globally. For corporate or partnership questions, I can point you to Mindscape Analytics LLC.`;

const QUICK = [
  'What does TENVO include?',
  'How do I book a demo?',
  'FBR and tax on the platform',
  'Storefront vs Shopify for my case',
];

export default function MarketingAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => [
    { role: 'assistant', content: STARTER },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  const send = useCallback(
    async (text) => {
      const q = (text || input).trim();
      if (!q || loading) return;
      setInput('');
      const next = [...messages, { role: 'user', content: q }];
      setMessages(next);
      setLoading(true);

      const payload = {
        messages: next.map(({ role, content }) => ({ role, content })),
        lead:
          email && email.includes('@')
            ? { email: email.trim().slice(0, 120), company: company.trim().slice(0, 120) }
            : undefined,
      };

      try {
        const res = await fetch('/api/marketing/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              content:
                err.hint ||
                err.error ||
                'I could not reach the AI service. Please try /contact or the Mindscape contact page.',
            },
          ]);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          setMessages((m) => [...m, { role: 'assistant', content: 'No response stream.' }]);
          return;
        }

        const dec = new TextDecoder();
        let full = '';
        setMessages((m) => [...m, { role: 'assistant', content: '' }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += dec.decode(value, { stream: true });
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = { role: 'assistant', content: full };
            return copy;
          });
        }
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: 'Network error. Visit /contact or ' + TENVO_PARENT_COMPANY.contactPage,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, email, company]
  );

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end sm:bottom-6 sm:right-6">
      {open && (
        <div
          className="mb-3 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[0_24px_64px_-24px_rgba(15,23,42,0.35)] sm:w-[24rem]"
          role="dialog"
          aria-label="TENVO assistant"
        >
          <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-gradient-to-r from-brand-primary to-brand-primary-dark px-4 py-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Bot className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide truncate">TENVO assistant</p>
                <p className="text-[10px] font-semibold text-white/85 truncate">Answers + next steps</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-white hover:bg-white/15"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div
            ref={scrollRef}
            className="max-h-[min(52vh,320px)] space-y-3 overflow-y-auto bg-neutral-50/80 px-3 py-3"
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[92%] rounded-2xl px-3 py-2 shadow-sm',
                    msg.role === 'user'
                      ? 'rounded-br-md bg-brand-primary text-[13px] leading-relaxed text-white'
                      : 'rounded-bl-md border border-neutral-200/80 bg-white text-neutral-800'
                  )}
                >
                  {msg.role === 'user' ? (
                    <span className="block whitespace-pre-wrap break-words">{msg.content}</span>
                  ) : (
                    <AssistantMessageMarkdown>{msg.content}</AssistantMessageMarkdown>
                  )}
                </div>
              </div>
            ))}
            {loading &&
              !(
                messages.length > 0 &&
                messages[messages.length - 1]?.role === 'assistant' &&
                messages[messages.length - 1]?.content?.trim()
              ) && (
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
                Thinking…
              </div>
            )}
          </div>

          {messages.length === 1 && (
            <div className="border-t border-neutral-100 bg-white px-3 py-2">
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Try asking
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 text-left text-[11px] font-semibold text-neutral-700 transition-colors hover:border-brand-primary/40 hover:bg-brand-50/60"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 border-t border-neutral-100 bg-white px-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (optional)"
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-[11px] outline-none ring-brand-primary/20 focus:ring-2"
                autoComplete="email"
              />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (optional)"
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-[11px] outline-none ring-brand-primary/20 focus:ring-2"
              />
            </div>
            <p className="text-[10px] text-neutral-500">
              For human follow-up:{' '}
              <Link href="/contact" className="font-bold text-brand-primary underline-offset-2 hover:underline">
                Contact TENVO
              </Link>{' '}
              ·{' '}
              <a
                href={TENVO_PARENT_COMPANY.contactPage}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand-primary underline-offset-2 hover:underline"
              >
                Mindscape contact
              </a>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Message…"
                className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] outline-none ring-brand-primary/15 focus:border-brand-primary/50 focus:ring-2"
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl bg-brand-primary text-white hover:bg-brand-primary-dark"
                disabled={loading || !input.trim()}
                onClick={() => send()}
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'relative h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]',
          open ? 'bg-neutral-900 text-white' : 'bg-brand-primary text-white shadow-brand-primary/30'
        )}
        aria-expanded={open}
        aria-label={open ? 'Close TENVO assistant' : 'Open TENVO assistant'}
      >
        {!open && (
          <span className="pointer-events-none absolute inset-0 rounded-full bg-brand-primary/25 animate-ping opacity-60" />
        )}
        {open ? <X className="relative h-6 w-6" /> : <MessageCircle className="relative h-6 w-6" />}
        {!open && (
          <Sparkles className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-amber-200" aria-hidden />
        )}
      </Button>
    </div>
  );
}
