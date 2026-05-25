'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { useStorefront } from '@/lib/context/StorefrontContext';
import { getStoreAccentColor } from '@/lib/config/storefrontDomains';
import { cn } from '@/lib/utils';

export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { settings, business } = useStorefront();
  const accent = getStoreAccentColor(settings, business?.category);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-24 right-6 z-40 w-10 h-10 rounded-full text-white shadow-lg',
        'flex items-center justify-center transition-all duration-300',
        'hover:scale-110 active:scale-95'
      )}
      style={{ backgroundColor: accent }}
      aria-label="Back to top"
    >
      <ArrowUp className="w-4 h-4" />
    </button>
  );
}
