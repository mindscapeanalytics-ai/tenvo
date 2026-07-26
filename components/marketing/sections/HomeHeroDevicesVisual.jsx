'use client';

import Image from 'next/image';
import { TENVO_IMG } from '@/lib/marketing/tenvoMarketingImages';
import { cn } from '@/lib/utils';

/**
 * Hero product stage — official desktop + mobile dashboard composite
 * (public/tenvo-img/tenvo-dashboard.png, 1536×1024).
 * Studio black plate is dropped via mix-blend-lighten on the light hero mesh.
 */
export default function HomeHeroDevicesVisual({ className }) {
  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[40rem] sm:max-w-[48rem] lg:max-w-none lg:translate-x-1',
        className
      )}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-[18%] h-[72%] w-[92%] -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[4%] top-[24%] h-48 w-48 rounded-full bg-sky-400/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[2%] bottom-[12%] h-44 w-44 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden
      />

      {/* Native 3:2 frame matches tenvo-dashboard.png (1536×1024) */}
      <div className="relative mx-auto aspect-[3/2] w-full mix-blend-lighten">
        <Image
          src={TENVO_IMG.heroDashboardDevices}
          alt="TENVO Easy Mode dashboard on desktop and mobile with live KPIs"
          fill
          priority
          className="object-contain object-center"
          sizes="(max-width: 640px) 96vw, (max-width: 1024px) 88vw, 720px"
        />
      </div>

      <div
        className="pointer-events-none mx-auto -mt-2 h-5 w-[58%] rounded-[100%] bg-neutral-900/14 blur-md sm:w-[52%]"
        aria-hidden
      />
    </div>
  );
}
