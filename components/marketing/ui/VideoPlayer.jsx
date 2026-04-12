'use client';

import { useState, useRef, useEffect } from 'react';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';

/**
 * VideoPlayer Component
 * Accessible video player with analytics tracking and lazy loading
 */
export function VideoPlayer({ 
  src, 
  poster, 
  title = 'Video',
  autoPlay = false,
  loop = false,
  muted = false,
  className = '' 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);
  const [hasTracked25, setHasTracked25] = useState(false);
  const [hasTracked50, setHasTracked50] = useState(false);
  const [hasTracked75, setHasTracked75] = useState(false);
  const [hasTrackedComplete, setHasTrackedComplete] = useState(false);

  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      if (!hasStarted) {
        setHasStarted(true);
      }
      
      // Track video play event
      if (!hasTrackedPlay) {
        trackEvent(EVENTS.VIDEO_PLAY, {
          video: title,
          src: src
        });
        setHasTrackedPlay(true);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      const currentProgress = (video.currentTime / video.duration) * 100;
      setProgress(currentProgress);

      // Track progress milestones
      if (currentProgress >= 25 && !hasTracked25) {
        trackEvent(EVENTS.VIDEO_PROGRESS, {
          video: title,
          progress: 25
        });
        setHasTracked25(true);
      }

      if (currentProgress >= 50 && !hasTracked50) {
        trackEvent(EVENTS.VIDEO_PROGRESS, {
          video: title,
          progress: 50
        });
        setHasTracked50(true);
      }

      if (currentProgress >= 75 && !hasTracked75) {
        trackEvent(EVENTS.VIDEO_PROGRESS, {
          video: title,
          progress: 75
        });
        setHasTracked75(true);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      
      // Track video completion
      if (!hasTrackedComplete) {
        trackEvent(EVENTS.VIDEO_COMPLETE, {
          video: title,
          src: src
        });
        setHasTrackedComplete(true);
      }
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src, title, hasStarted, hasTrackedPlay, hasTracked25, hasTracked50, hasTracked75, hasTrackedComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePlay();
    }
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        loading="lazy"
        className="w-full h-full rounded-lg"
        aria-label={title}
      >
        <track kind="captions" />
        Your browser does not support the video tag.
      </video>

      {/* Custom Play/Pause Button Overlay */}
      {!autoPlay && (
        <button
          onClick={togglePlay}
          onKeyDown={handleKeyDown}
          className={`
            absolute inset-0 flex items-center justify-center
            bg-black bg-opacity-30 rounded-lg
            transition-opacity duration-200
            ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
            focus:outline-none focus:ring-2 focus:ring-wine-500 focus:ring-offset-2
          `}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          <div className="w-16 h-16 flex items-center justify-center bg-white bg-opacity-90 rounded-full shadow-lg">
            {isPlaying ? (
              // Pause Icon
              <svg 
                className="w-8 h-8 text-wine-600" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              // Play Icon
              <svg 
                className="w-8 h-8 text-wine-600 ml-1" 
                fill="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </button>
      )}

      {/* Progress Bar */}
      {hasStarted && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 bg-opacity-50"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Video progress"
        >
          <div 
            className="h-full bg-wine-600 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
