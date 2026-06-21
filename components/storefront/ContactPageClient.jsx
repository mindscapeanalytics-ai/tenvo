'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageCircle,
  Globe,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  AlertCircle,
} from 'lucide-react';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { resolveStoreContact } from '@/lib/storefront/businessContact';
import { StoreBuyerPageShell } from '@/components/storefront/StoreBuyerPageShell';
import { cn } from '@/lib/utils';

const SUBJECT_OPTIONS = [
  { value: 'general', label: 'General inquiry' },
  { value: 'order', label: 'Order question' },
  { value: 'product', label: 'Product question' },
  { value: 'return', label: 'Return or exchange' },
  { value: 'wholesale', label: 'Wholesale / bulk' },
  { value: 'other', label: 'Other' },
];

function ContactCard({ icon: Icon, label, children, accent }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:gap-4 sm:rounded-2xl sm:p-5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl"
        style={{ backgroundColor: `${accent}20` }}
      >
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: accent }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-gray-900">{children}</div>
      </div>
    </div>
  );
}

export function ContactPageClient() {
  const { businessDomain, business, settings } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);
  const contact = useMemo(
    () => resolveStoreContact({ business, settings }),
    [business, settings]
  );

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    orderNumber: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const mapQuery = contact.fullAddress
    ? encodeURIComponent(contact.fullAddress)
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/storefront/${businessDomain}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not send message. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again or call the store directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const socialEntries = [
    { icon: Facebook, href: contact.social.facebook, label: 'Facebook' },
    { icon: Instagram, href: contact.social.instagram, label: 'Instagram' },
    { icon: Twitter, href: contact.social.twitter, label: 'Twitter' },
    { icon: Youtube, href: contact.social.youtube, label: 'YouTube' },
  ].filter((s) => s.href);

  return (
    <StoreBuyerPageShell
      businessDomain={businessDomain}
      title="Contact us"
      subtitle={`Reach ${contact.storeName} — we typically reply within 1–2 business days.`}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
        {/* Store info */}
        <div className="space-y-3 lg:space-y-4">
          {contact.description ? (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs">About</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{contact.description}</p>
            </div>
          ) : null}

          {contact.email ? (
            <ContactCard icon={Mail} label="Email" accent={accent}>
              <a href={`mailto:${contact.email}`} className="break-all hover:underline">
                {contact.email}
              </a>
            </ContactCard>
          ) : null}

          {contact.phone ? (
            <ContactCard icon={Phone} label="Phone" accent={accent}>
              <a href={`tel:${contact.phone}`} className="hover:underline">
                {contact.phone}
              </a>
            </ContactCard>
          ) : null}

          {contact.whatsappUrl ? (
            <ContactCard icon={MessageCircle} label="WhatsApp" accent={accent}>
              <a
                href={contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                Chat on WhatsApp
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </ContactCard>
          ) : null}

          {contact.fullAddress ? (
            <ContactCard icon={MapPin} label="Address" accent={accent}>
              <p className="whitespace-pre-line">{contact.fullAddress}</p>
              {mapQuery ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                  style={{ color: accent }}
                >
                  Open in Maps
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
            </ContactCard>
          ) : null}

          {contact.website ? (
            <ContactCard icon={Globe} label="Website" accent={accent}>
              <a
                href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all hover:underline"
              >
                {contact.website.replace(/^https?:\/\//, '')}
              </a>
            </ContactCard>
          ) : null}

          <ContactCard icon={Clock} label="Business hours" accent={accent}>
            {contact.businessHours}
          </ContactCard>

          {socialEntries.length > 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs">Follow us</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {socialEntries.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:text-xs">Quick links</p>
            <div className="mt-2 space-y-2 text-sm">
              <Link href={`/store/${businessDomain}/orders`} className="block text-gray-600 hover:text-gray-900">
                Track my order →
              </Link>
              <Link href={`/store/${businessDomain}/shipping`} className="block text-gray-600 hover:text-gray-900">
                Shipping info →
              </Link>
              <Link href={`/store/${businessDomain}/returns`} className="block text-gray-600 hover:text-gray-900">
                Returns & exchanges →
              </Link>
              <Link href={`/store/${businessDomain}/faqs`} className="block text-gray-600 hover:text-gray-900">
                FAQs →
              </Link>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
            {submitted ? (
              <div className="py-10 text-center sm:py-16">
                <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500 sm:h-16 sm:w-16" />
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Message sent</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                  Thanks for reaching out. {contact.storeName} will get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({
                      name: '',
                      email: '',
                      phone: '',
                      subject: 'general',
                      orderNumber: '',
                      message: '',
                    });
                  }}
                  className="mt-6 text-sm font-semibold hover:underline"
                  style={{ color: accent }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!contact.hasAnyContact ? (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      This store has not published direct contact details yet. Your message will still be delivered to
                      the store owner when email is configured.
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': accent }}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                      placeholder="you@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    >
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {form.subject === 'order' || form.subject === 'return' ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Order number</label>
                    <input
                      type="text"
                      value={form.orderNumber}
                      onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                      placeholder="e.g. ORD-20240523-0042"
                    />
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    placeholder="How can we help?"
                    minLength={10}
                  />
                </div>

                {error ? (
                  <p className="flex items-start gap-2 text-sm text-red-600">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
                  )}
                  style={{ backgroundColor: accent }}
                >
                  {submitting ? 'Sending…' : (
                    <>
                      <Send className="h-4 w-4" aria-hidden />
                      Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </StoreBuyerPageShell>
  );
}

export default ContactPageClient;
