'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Mute looping furniture video. Returns null on missing URL, error, or reduced-motion
 * so the caller can keep a still poster underneath.
 * @param {{ videoUrl?: string; poster?: string; className?: string }} props
 */
export function FurnitureVideoBackdrop({ videoUrl, poster = '', className = 'absolute inset-0 h-full w-full object-cover' }) {
  const videoRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(Boolean(mq.matches));
    sync();
    mq.addEventListener?.('change', sync);
    return () => mq.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    setFailed(false);
    const el = videoRef.current;
    if (!el || !videoUrl || reduceMotion) return undefined;
    el.muted = true;
    el.defaultMuted = true;
    el.playsInline = true;
    const tryPlay = () => {
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };
    tryPlay();
    el.addEventListener('canplay', tryPlay);
    return () => el.removeEventListener('canplay', tryPlay);
  }, [videoUrl, reduceMotion]);

  if (!videoUrl || failed || reduceMotion) return null;

  return (
    <video
      ref={videoRef}
      key={videoUrl}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      poster={poster || undefined}
      preload="metadata"
      onError={() => setFailed(true)}
      aria-hidden
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}
