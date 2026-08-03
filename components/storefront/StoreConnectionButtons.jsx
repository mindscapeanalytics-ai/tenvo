'use client';

import Link from 'next/link';
import { ArrowRight, Phone, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  resolveStoreConnectionActions,
  supportsStoreConnectionButtons,
} from '@/lib/storefront/storeConnectionActions';

const ICONS = {
  arrow: ArrowRight,
  phone: Phone,
  mail: Mail,
  whatsapp: MessageCircle,
};

/**
 * Quote / Call / Mail connection pills for marine & industrial public stores.
 *
 * @param {{
 *   business?: object | null,
 *   settings?: object | null,
 *   businessDomain?: string,
 *   storeBase?: string,
 *   accent?: string,
 *   className?: string,
 *   force?: boolean,
 *   actions?: ReturnType<typeof resolveStoreConnectionActions> | null,
 * }} props
 */
export function StoreConnectionButtons({
  business,
  settings,
  businessDomain,
  storeBase,
  accent = '#0d9488',
  className,
  force = false,
  actions: actionsProp = null,
}) {
  const actions =
    actionsProp ||
    resolveStoreConnectionActions({
      business,
      settings,
      businessDomain,
      storeBase,
      force: force || supportsStoreConnectionButtons(business?.category),
    });

  if (!actions.length) return null;

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {actions.map((action) => {
        const Icon = ICONS[action.icon] || ArrowRight;
        const primary = action.variant === 'primary';
        const classNameBtn = cn(
          'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-95',
          primary
            ? 'text-white shadow-lg shadow-black/15'
            : 'border border-white/80 bg-white text-neutral-900 shadow-md shadow-black/10'
        );
        const style = primary ? { backgroundColor: accent } : undefined;
        const iconClass = cn('h-4 w-4 shrink-0', primary ? 'text-white' : '');
        const iconStyle = primary ? undefined : { color: accent };

        if (action.external) {
          return (
            <a
              key={action.id}
              href={action.href}
              className={classNameBtn}
              style={style}
              target={action.href.startsWith('http') ? '_blank' : undefined}
              rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <Icon className={iconClass} style={iconStyle} aria-hidden />
              {action.label}
            </a>
          );
        }

        return (
          <Link key={action.id} href={action.href} className={classNameBtn} style={style}>
            <Icon className={iconClass} style={iconStyle} aria-hidden />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}
