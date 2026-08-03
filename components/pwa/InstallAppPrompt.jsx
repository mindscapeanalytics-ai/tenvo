'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOBILE_BOTTOM_NAV_CLASS } from '@/lib/utils/mobileLayout';
import {
  INSTALL_PROMPT_DELAY_MS,
  dismissInstallPrompt,
  isIosSafari,
  shouldOfferInstall,
} from '@/lib/pwa/installApp';

/**
 * Deferred, dismissible hub install chip. No service worker.
 * Mount only in authenticated hub shell — never on public storefronts.
 */
export function InstallAppPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const deferredRef = useRef(null);
  const delayPassedRef = useRef(false);
  const revealedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const tryReveal = () => {
      if (revealedRef.current) return;
      const hasDeferred = Boolean(deferredRef.current);
      if (!shouldOfferInstall({ hasDeferredPrompt: hasDeferred })) return;
      revealedRef.current = true;
      setIosHint(!hasDeferred && isIosSafari());
      setVisible(true);
    };

    const onBeforeInstall = (event) => {
      event.preventDefault();
      deferredRef.current = event;
      if (delayPassedRef.current) tryReveal();
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const afterDelay = () => {
      delayPassedRef.current = true;
      tryReveal();
    };

    const schedule = () => {
      timerRef.current = window.setTimeout(afterDelay, INSTALL_PROMPT_DELAY_MS);
    };

    let idleId = null;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(schedule, { timeout: 4000 });
    } else {
      schedule();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  const hide = () => {
    dismissInstallPrompt();
    setVisible(false);
    deferredRef.current = null;
  };

  const onInstall = async () => {
    const deferred = deferredRef.current;
    if (!deferred) return;
    try {
      deferredRef.current = null;
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      // User dismissed native sheet or browser blocked — stay quiet
    } finally {
      hide();
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Install TENVO"
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[55] flex justify-center px-3',
        MOBILE_BOTTOM_NAV_CLASS
      )}
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border border-gray-200 bg-white p-3',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300',
          'motion-reduce:animate-none'
        )}
      >
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={40}
          height={40}
          className="mt-0.5 size-10 shrink-0 rounded-lg"
          priority={false}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">Install TENVO</p>
          {iosHint ? (
            <p className="mt-0.5 text-xs leading-snug text-gray-600">
              On iPhone: tap Share, then Add to Home Screen for a faster app-style shortcut.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-snug text-gray-600">
              Add a home screen shortcut for quicker access. Offline POS stays as you configured it.
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {!iosHint ? (
              <button
                type="button"
                onClick={onInstall}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
              >
                <Download className="size-3.5" aria-hidden />
                Install
              </button>
            ) : null}
            <button
              type="button"
              onClick={hide}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={hide}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
