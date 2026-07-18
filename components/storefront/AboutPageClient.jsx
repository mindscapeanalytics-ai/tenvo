'use client';

import Link from 'next/link';
import { Building2, Calendar, MapPin, Shield, ArrowRight, Users } from 'lucide-react';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { resolveAboutPageContent } from '@/lib/storefront/aboutStorefront';
import { StoreBuyerPageShell } from '@/components/storefront/StoreBuyerPageShell';
import { SmartProductImage } from '@/components/storefront/SmartProductImage';
import { cn } from '@/lib/utils';

function DetailChip({ icon: Icon, label, value, accent }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm">
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}14` }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function PersonCard({ name, role, photoUrl, bio, accent, featured = false }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-100 bg-white p-4 shadow-sm',
        featured && 'sm:col-span-2 sm:flex sm:items-start sm:gap-4'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gray-100',
          featured ? 'mx-auto h-28 w-28 shrink-0 sm:mx-0 sm:h-32 sm:w-32' : 'mx-auto mb-3 h-20 w-20'
        )}
        style={!photoUrl ? { backgroundColor: `${accent}18` } : undefined}
      >
        {photoUrl ? (
          <SmartProductImage src={photoUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-semibold" style={{ color: accent }}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className={cn('min-w-0', featured ? 'mt-3 text-center sm:mt-0 sm:text-left' : 'text-center')}>
        <p className="text-sm font-semibold text-gray-900 sm:text-base">{name}</p>
        {role ? <p className="mt-0.5 text-xs font-medium" style={{ color: accent }}>{role}</p> : null}
        {bio ? <p className="mt-2 text-xs leading-relaxed text-gray-500 sm:text-sm">{bio}</p> : null}
      </div>
    </div>
  );
}

export function AboutPageClient() {
  const { businessDomain, business, settings } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);
  const about = resolveAboutPageContent({ business, settings });
  const storeBase = `/store/${businessDomain}`;

  return (
    <StoreBuyerPageShell
      businessDomain={businessDomain}
      title={about.headline}
      subtitle={about.mission || `Learn more about ${about.storeName}.`}
      wide
    >
      <div className="space-y-6 sm:space-y-8">
        {about.heroImageUrl ? (
          <div className="relative aspect-[21/9] overflow-hidden rounded-2xl bg-gray-100 sm:aspect-[2.4/1]">
            <SmartProductImage
              src={about.heroImageUrl}
              alt=""
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          </div>
        ) : null}

        {(about.story || about.hasCompanyDetails) ? (
          <section className="grid gap-4 lg:grid-cols-5 lg:gap-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:col-span-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Our story</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700 sm:text-[15px]">
                {about.story || `${about.storeName} serves customers with quality products and reliable support.`}
              </p>
              {about.values.length > 0 ? (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {about.values.map((value) => (
                    <li
                      key={value}
                      className="rounded-lg px-3 py-2 text-xs font-medium text-gray-800 sm:text-sm"
                      style={{ backgroundColor: `${accent}12` }}
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="grid gap-2.5 lg:col-span-2">
              <DetailChip icon={Calendar} label="Founded" value={about.foundedYear} accent={accent} />
              <DetailChip icon={MapPin} label="Headquarters" value={about.headquarters} accent={accent} />
              <DetailChip icon={Shield} label="Registration" value={about.registrationId} accent={accent} />
              <DetailChip icon={Building2} label="Business" value={about.storeName} accent={accent} />
            </div>
          </section>
        ) : null}

        {about.hasOwner ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" aria-hidden />
              <h2 className="text-sm font-semibold text-gray-900 sm:text-base">Leadership</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PersonCard
                name={about.ownerName || about.storeName}
                role={about.ownerTitle}
                photoUrl={about.ownerPhotoUrl}
                bio={about.ownerBio}
                accent={accent}
                featured
              />
            </div>
          </section>
        ) : null}

        {about.hasTeam ? (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" aria-hidden />
              <h2 className="text-sm font-semibold text-gray-900 sm:text-base">Our team</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {about.team.map((member) => (
                <PersonCard
                  key={member.id}
                  name={member.name}
                  role={member.role}
                  photoUrl={member.photoUrl}
                  bio={member.bio}
                  accent={accent}
                />
              ))}
            </div>
          </section>
        ) : null}

        {!about.hasContent ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-8 text-center">
            <p className="text-sm text-gray-600">
              {about.storeName} has not published a full company profile yet.
            </p>
            <Link
              href={`${storeBase}/contact`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: accent }}
            >
              Contact the store
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Want to work with us?</p>
              <p className="text-xs text-gray-500 sm:text-sm">Reach the team for quotes, support, or partnerships.</p>
            </div>
            <Link
              href={`${storeBase}/contact`}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {about.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </StoreBuyerPageShell>
  );
}
