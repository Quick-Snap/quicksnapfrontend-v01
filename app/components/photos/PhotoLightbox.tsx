'use client';

import { ChevronLeft, ChevronRight, X, EyeOff } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type PhotoLightboxProps = {
  imageSrc: string;
  imageAlt: string;
  onClose: () => void;
  footer: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  onUntag?: () => void;
};

/**
 * Full-viewport photo preview: image uses remaining space (object-contain), no page scroll.
 * Portals to document.body so fixed layering isn't clipped by layout; top bar keeps the close
 * control clear of the notch / status bar.
 * Supports Next / Previous navigation buttons, keyboard arrows, and mobile swipe gestures.
 */
export function PhotoLightbox({
  imageSrc,
  imageAlt,
  onClose,
  footer,
  onNext,
  onPrev,
  onUntag,
}: PhotoLightboxProps) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Keyboard navigation: Escape to close, Left/Right arrows to navigate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNext, onPrev]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex max-h-[100dvh] flex-col bg-zinc-950/95 backdrop-blur-md"
      role="presentation"
    >
      {/* Top chrome: safe-area + row so the close control is never clipped */}
      <div
        className="flex shrink-0 items-center justify-end gap-2 border-b border-white/10 bg-black/40 px-3 pb-3 pt-[max(12px,calc(env(safe-area-inset-top,0px)+8px))] backdrop-blur-md sm:px-4 sm:pb-3 sm:pt-[max(14px,calc(env(safe-area-inset-top,0px)+10px))]"
        onClick={(e) => e.stopPropagation()}
      >
        {onUntag && (
          <button
            type="button"
            className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-full border border-red-500/25 bg-red-950/40 text-red-400 shadow-lg shadow-black/40 transition-colors hover:bg-red-900/60 active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              onUntag();
            }}
            title="Untag me from this photo"
            aria-label="Untag me"
          >
            <EyeOff className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
          </button>
        )}
        <button
          type="button"
          className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-zinc-900/90 text-white shadow-lg shadow-black/40 transition-colors hover:bg-zinc-800 active:scale-[0.98]"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X className="h-6 w-6 shrink-0" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      {/* Main dialog area containing chevrons and image */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-1 pt-2 sm:px-4 sm:pb-2 sm:pt-3"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Photo preview"
      >
        {/* Previous Button (desktop floating chevron) */}
        {onPrev && (
          <button
            type="button"
            className="absolute left-3 md:left-6 z-[210] flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-zinc-900/60 text-white shadow-md backdrop-blur-sm transition-all hover:bg-zinc-800/80 hover:scale-105 active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.25} />
          </button>
        )}

        {imageSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageSrc}
            alt={imageAlt}
            className="max-h-full max-w-full object-contain shadow-2xl ring-1 ring-white/15 select-none sm:rounded-lg"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        ) : (
          <p className="px-4 text-center text-sm text-gray-400" onClick={(e) => e.stopPropagation()}>
            Preview unavailable for this photo.
          </p>
        )}

        {/* Next Button (desktop floating chevron) */}
        {onNext && (
          <button
            type="button"
            className="absolute right-3 md:right-6 z-[210] flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-zinc-900/60 text-white shadow-md backdrop-blur-sm transition-all hover:bg-zinc-800/80 hover:scale-105 active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6 md:h-7 md:w-7" strokeWidth={2.25} />
          </button>
        )}
      </div>

      <div
        className="shrink-0 border-t border-white/10 bg-gradient-to-t from-[#0a0812] to-[#14121f]/98 px-3 pt-3 backdrop-blur-xl sm:px-5 sm:py-4"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {footer}
      </div>
    </div>,
    document.body
  );
}
