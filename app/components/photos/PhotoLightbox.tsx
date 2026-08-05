'use client';

import { X, EyeOff } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import MorphSlider from '@/components/MorphSlider/MorphSlider';

export type PhotoLightboxItem = {
  image: string;
  caption?: string;
};

type PhotoLightboxProps = {
  /** All slides for MorphSlider (index-aligned with the gallery list). */
  items: PhotoLightboxItem[];
  /** Index of the photo that opened the lightbox. */
  startIndex?: number;
  /** Fired when the morph transition commits to a new slide. */
  onIndexChange?: (index: number) => void;
  onClose: () => void;
  footer: ReactNode;
  onUntag?: () => void;
};

/**
 * Full-viewport photo preview with MorphSlider melt transitions between photos.
 * Portals to document.body; chrome (close / untag / footer) stays outside the slider.
 */
export function PhotoLightbox({
  items,
  startIndex = 0,
  onIndexChange,
  onClose,
  footer,
  onUntag,
}: PhotoLightboxProps) {
  // Freeze the opening slide list + index for the whole lightbox session.
  // Live parent updates (signed URLs, selection sync) must not remount WebGL mid-tween.
  const [session] = useState(() => {
    // Keep index alignment with the parent gallery list (do not drop empty URLs).
    const slides = (items || []).map((item) => ({
      image: item.image || '',
      caption: item.caption || '',
    }));
    const safeStart = Math.max(0, Math.min(startIndex, Math.max(slides.length - 1, 0)));
    return { slides, startIndex: safeStart };
  });

  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  const hasSlides = session.slides.some((item) => item.image);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex h-[100dvh] flex-col overflow-hidden bg-zinc-950/95 backdrop-blur-md"
      role="presentation"
    >
      <div
        className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-3 pb-3 pt-[max(12px,calc(env(safe-area-inset-top,0px)+8px))] backdrop-blur-md sm:px-4 sm:pb-3 sm:pt-[max(14px,calc(env(safe-area-inset-top,0px)+10px))]"
        onClick={(e) => e.stopPropagation()}
      >
        {onUntag ? (
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
        ) : (
          <div className="w-11" />
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

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Photo preview"
        onClick={(e) => e.stopPropagation()}
      >
        {hasSlides ? (
          <MorphSlider
            items={session.slides}
            startIndex={session.startIndex}
            onIndexChange={(i: number) => onIndexChangeRef.current?.(i)}
            showCaptions={false}
            showIndicators={false}
            showControls={session.slides.filter((s) => s.image).length > 1}
            loop={false}
            radius={0}
            fit="contain"
            drift={0}
            aberration={0.15}
            intensity={0.4}
            transition="melt"
            duration={0.9}
            className="h-full w-full bg-transparent"
            overlayColor="#09090b"
          />
        ) : (
          <p className="px-4 text-center text-sm text-gray-400">Preview unavailable for this photo.</p>
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
