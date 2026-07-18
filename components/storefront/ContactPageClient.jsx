'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Calendar,
  FileUp,
  Image as ImageIcon,
} from 'lucide-react';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { resolveStoreContact } from '@/lib/storefront/businessContact';
import { isAutoDealershipStore, resolveDealershipContactIntent } from '@/lib/storefront/autoDealership';
import {
  getDealershipBookingSubjectOptions,
  getDealershipShowroomLocations,
  BOOKING_TIME_SLOTS,
} from '@/lib/storefront/dealershipBooking';
import {
  getTenantMeetingUrl,
  isStorefrontBookingSubject,
  shouldOfferTenantMeetingLink,
} from '@/lib/storefront/storefrontBooking';
import { isPharmacyElevatedStore, resolvePharmacyContactIntent } from '@/lib/storefront/pharmacyStorefront';
import { StoreBuyerPageShell } from '@/components/storefront/StoreBuyerPageShell';
import { cn } from '@/lib/utils';
import { resizeImageToWebP } from '@/lib/utils/optimizeImageClient';

const SUBJECT_OPTIONS = [
  { value: 'general', label: 'General inquiry' },
  { value: 'quotation', label: 'Request quotation' },
  { value: 'order', label: 'Order question' },
  { value: 'product', label: 'Product question' },
  { value: 'return', label: 'Return or exchange' },
  { value: 'wholesale', label: 'Wholesale / bulk' },
  { value: 'other', label: 'Other' },
];

const PHARMACY_SUBJECT_OPTIONS = [
  { value: 'prescription', label: 'Prescription upload' },
  { value: 'refill', label: 'Refill reminder' },
  { value: 'order', label: 'Order question' },
  { value: 'product', label: 'Product / dosage question' },
  { value: 'general', label: 'General inquiry' },
  { value: 'other', label: 'Other' },
];

function ContactCard({ icon: Icon, label, children, accent }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm sm:p-4">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}18` }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium leading-snug text-gray-900">{children}</div>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, children, accent, iconTone }) {
  const isWhatsApp = iconTone === 'whatsapp';
  return (
    <div className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={
          isWhatsApp
            ? { backgroundColor: 'rgba(37, 211, 102, 0.15)', color: '#25D366' }
            : { backgroundColor: `${accent}18` }
        }
      >
        <Icon
          className="h-3.5 w-3.5"
          style={{ color: isWhatsApp ? '#25D366' : accent }}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-gray-900">{children}</div>
      </div>
    </div>
  );
}

export function ContactPageClient() {
  const { businessDomain, business, settings } = useStorefront();
  const searchParams = useSearchParams();
  const accent = getStoreAccentColor(settings, business?.category);
  const isDealership = isAutoDealershipStore(business?.category);
  const isPharmacy = isPharmacyElevatedStore(business?.category);
  const intent = isDealership
    ? resolveDealershipContactIntent(searchParams, { country: business?.country, settings })
    : isPharmacy
      ? resolvePharmacyContactIntent(searchParams)
      : null;
  const subjectOptions = isDealership
    ? getDealershipBookingSubjectOptions(business, settings)
    : isPharmacy
      ? PHARMACY_SUBJECT_OPTIONS
      : SUBJECT_OPTIONS;

  const showroomLocations = isDealership
    ? getDealershipShowroomLocations(business, settings)
    : [];

  const bookingSubjects = new Set([
    'testdrive', 'visit', 'sell', 'finance', 'leasing', 'insurance', 'buy', 'ppf', 'conversion', 'service',
  ]);

  const contact = useMemo(
    () => resolveStoreContact({ business, settings }),
    [business, settings]
  );

  const tenantMeetingUrl = useMemo(() => {
    if (!shouldOfferTenantMeetingLink(business, business?.category, settings)) return null;
    return getTenantMeetingUrl(business, settings);
  }, [business, settings]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: intent?.subject || (searchParams.get('subject') === 'quote' ? 'quotation' : searchParams.get('subject')) || 'general',
    orderNumber: '',
    preferredDate: '',
    preferredTime: '',
    showroomLocation: '',
    vehicleInterest: intent?.vehiclePrefill || searchParams.get('vehicle') || '',
    message: intent?.messagePrefill || '',
  });
  const isPrescriptionForm = isPharmacy && (form.subject === 'prescription' || intent?.key === 'prescription');
  const isBookingForm = isDealership && bookingSubjects.has(form.subject);
  const showPickTimeCta =
    Boolean(tenantMeetingUrl) &&
    (isBookingForm || isStorefrontBookingSubject(business?.category, form.subject) || Boolean(intent));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState('');
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [prescriptionFileName, setPrescriptionFileName] = useState('');

  const vehicleParam = searchParams.get('vehicle') || '';
  const subjectParam = searchParams.get('subject') || '';
  const normalizedSubjectParam =
    subjectParam === 'quote' ? 'quotation' : subjectParam;

  useEffect(() => {
    const vehicle = intent?.vehiclePrefill || vehicleParam || '';
    const nextSubject = intent?.subject || normalizedSubjectParam || undefined;
    setForm((f) => ({
      ...f,
      subject: nextSubject || f.subject,
      vehicleInterest: vehicle || f.vehicleInterest,
      message: f.message || intent?.messagePrefill || '',
    }));
  }, [intent?.subject, intent?.vehiclePrefill, intent?.messagePrefill, vehicleParam, normalizedSubjectParam]);

  const pageTitle =
    intent?.title ||
    (normalizedSubjectParam === 'quotation' ? 'Request a quotation' : 'Contact us');
  const pageSubtitle = intent?.subtitle
    || (normalizedSubjectParam === 'quotation'
      ? `Send your part list or requirements to ${contact.storeName}. We will reply with availability and options.`
      : `Reach ${contact.storeName}, we typically reply within 1-2 business days.`);
  const messagePlaceholder =
    intent?.messagePlaceholder ||
    (normalizedSubjectParam === 'quotation'
      ? 'List part numbers, OEM codes, vessel or equipment type, and quantity needed.'
      : 'How can we help?');

  const mapQuery = contact.fullAddress
    ? encodeURIComponent(contact.fullAddress)
    : null;

  const handlePrescriptionUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setPrescriptionUploading(true);
    try {
      const optimized = await resizeImageToWebP(file, 1600, 1600, 0.82);
      const body = new FormData();
      body.append('file', optimized);
      const res = await fetch(`/api/storefront/${businessDomain}/contact/upload`, {
        method: 'POST',
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not upload prescription photo');
        return;
      }
      setPrescriptionImageUrl(data.url || '');
      setPrescriptionFileName(file.name);
    } catch {
      setError('Could not process prescription photo. Try a smaller image.');
    } finally {
      setPrescriptionUploading(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const messageBody = prescriptionImageUrl
        ? `${form.message}\n\nPrescription image: ${prescriptionImageUrl}`
        : form.message;

      const res = await fetch(`/api/storefront/${businessDomain}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, message: messageBody }),
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
      title={pageTitle}
      subtitle={pageSubtitle}
      wide
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-8">
        {/* Store info — compact stacked cards */}
        <aside className="space-y-3 lg:col-span-2">
          {contact.description ? (
            <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">About</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{contact.description}</p>
            </div>
          ) : null}

          {(contact.email || contact.phone || contact.whatsappUrl) ? (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm sm:px-4">
              <p className="pb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Reach us
              </p>
              {contact.email ? (
                <ContactRow icon={Mail} label="Email" accent={accent}>
                  <a href={`mailto:${contact.email}`} className="break-all hover:underline">
                    {contact.email}
                  </a>
                </ContactRow>
              ) : null}
              {contact.phone ? (
                <ContactRow icon={Phone} label="Phone" accent={accent}>
                  <a href={`tel:${contact.phone}`} className="hover:underline">
                    {contact.phone}
                  </a>
                </ContactRow>
              ) : null}
              {contact.whatsappUrl ? (
                <ContactRow
                  icon={MessageCircle}
                  label="WhatsApp"
                  accent={accent}
                  iconTone="whatsapp"
                >
                  <a
                    href={contact.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-wrap items-center gap-x-2 gap-y-1"
                  >
                    <span className="hover:underline">{contact.whatsapp}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/10 px-2 py-0.5 text-[11px] font-semibold text-[#128C7E]">
                      Chat
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </span>
                  </a>
                </ContactRow>
              ) : null}
            </div>
          ) : null}

          {(contact.fullAddress || contact.businessHours) ? (
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white px-3.5 py-3 shadow-sm sm:px-4">
              <p className="pb-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Location
              </p>
              {contact.fullAddress ? (
                <ContactRow icon={MapPin} label="Address" accent={accent}>
                  <p className="whitespace-pre-line">{contact.fullAddress}</p>
                  {mapQuery ? (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                      style={{ color: accent }}
                    >
                      Open in Maps
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : null}
                </ContactRow>
              ) : null}
              {contact.businessHours ? (
                <ContactRow icon={Clock} label="Business hours" accent={accent}>
                  <p className="whitespace-pre-line">{contact.businessHours}</p>
                </ContactRow>
              ) : null}
            </div>
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

          {socialEntries.length > 0 ? (
            <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Follow us</p>
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

          <div className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Quick links</p>
            <div className="mt-2 space-y-1.5 text-sm">
              {[
                ['orders', 'Track my order'],
                ['shipping', 'Shipping info'],
                ['returns', 'Returns & exchanges'],
                ['faqs', 'FAQs'],
              ].map(([slug, label]) => (
                <Link
                  key={slug}
                  href={`/store/${businessDomain}/${slug}`}
                  className="flex items-center justify-between rounded-lg px-1 py-1.5 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  <span>{label}</span>
                  <span className="text-gray-300" aria-hidden>→</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Form */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
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
                    setPrescriptionImageUrl('');
                    setPrescriptionFileName('');
                    setForm({
                      name: '',
                      email: '',
                      phone: '',
                      subject: intent?.subject || 'general',
                      orderNumber: '',
                      preferredDate: '',
                      preferredTime: '',
                      showroomLocation: '',
                      vehicleInterest: intent?.vehiclePrefill || '',
                      message: intent?.messagePrefill || '',
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
                {showPickTimeCta ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-gray-900">Prefer to pick a time?</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Schedule online, or send the form below and we will confirm by email or phone.
                    </p>
                    <a
                      href={tenantMeetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 sm:w-auto sm:px-6"
                      style={{ backgroundColor: accent }}
                    >
                      <Calendar className="h-4 w-4" aria-hidden />
                      Pick a time
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                  </div>
                ) : null}

                {!contact.hasAnyContact ? (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <span>
                      This store has not published direct contact details yet. Your message will still be delivered to
                      the store owner when email is configured.
                    </span>
                  </div>
                ) : null}

                {contact.whatsappUrl ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-[#25D366]/25 bg-[#25D366]/5 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700">
                      Prefer chat? Message {contact.storeName} on WhatsApp.
                    </p>
                    <a
                      href={contact.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#20BD5A]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
                      Open WhatsApp
                    </a>
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
                      placeholder={isDealership ? 'Required for callback' : 'Optional'}
                      required={isDealership}
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
                      {subjectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isDealership ? (
                  <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {isBookingForm ? 'Appointment details' : 'Vehicle details (optional)'}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Preferred date{isBookingForm ? ' *' : ''}
                        </label>
                        <input
                          type="date"
                          required={isBookingForm}
                          value={form.preferredDate}
                          onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Preferred time</label>
                        <select
                          value={form.preferredTime}
                          onChange={(e) => setForm((f) => ({ ...f, preferredTime: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                        >
                          <option value="">Any time</option>
                          {BOOKING_TIME_SLOTS.map((slot) => (
                            <option key={slot.id} value={slot.id}>{slot.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {showroomLocations.length > 0 ? (
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">Showroom branch</label>
                          <select
                            value={form.showroomLocation}
                            onChange={(e) => setForm((f) => ({ ...f, showroomLocation: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                          >
                            <option value="">Select branch</option>
                            {showroomLocations.map((loc) => (
                              <option key={loc.id} value={loc.id}>{loc.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                      <div className={showroomLocations.length > 0 ? '' : 'sm:col-span-2'}>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Vehicle interest</label>
                        <input
                          type="text"
                          value={form.vehicleInterest}
                          onChange={(e) => setForm((f) => ({ ...f, vehicleInterest: e.target.value }))}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                          placeholder="e.g. Toyota Hilux Revo, GAC E9"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {!isDealership && (form.subject === 'order' || form.subject === 'return') ? (
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

                {isPrescriptionForm ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: accent }}
                      >
                        <FileUp className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">Upload prescription photo</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                          Take a clear photo of your doctor&apos;s prescription. Our pharmacists verify every Rx order
                          before dispatch.
                        </p>
                        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50">
                          <ImageIcon className="h-4 w-4" aria-hidden />
                          {prescriptionUploading ? 'Uploading…' : prescriptionFileName ? 'Change photo' : 'Choose photo'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            disabled={prescriptionUploading}
                            onChange={handlePrescriptionUpload}
                          />
                        </label>
                        {prescriptionFileName ? (
                          <p className="mt-2 text-xs text-emerald-700">
                            Attached: <span className="font-medium">{prescriptionFileName}</span>
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            Optional now — you can also send it later via WhatsApp if the store lists a number.
                          </p>
                        )}
                      </div>
                    </div>
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
                    placeholder={messagePlaceholder}
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
                    'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60'
                  )}
                  style={{ backgroundColor: accent }}
                >
                  {submitting ? 'Sending…' : (
                    <>
                      <Send className="h-4 w-4" aria-hidden />
                      {isBookingForm ? 'Submit booking request' : 'Send message'}
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
