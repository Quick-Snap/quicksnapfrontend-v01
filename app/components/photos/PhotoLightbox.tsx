'use client';

import {
  X,
  EyeOff,
  Flag,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
  type WheelEvent,
  type MouseEvent,
} from 'react';
import { createPortal } from 'react-dom';

export type PhotoLightboxItem = {
  image: string;
  caption?: string;
};

type PhotoLightboxProps = {
  /** All slides (index-aligned with the gallery list). */
  items: PhotoLightboxItem[];
  /** Index of the photo that opened the lightbox. */
  startIndex?: number;
  /** Fired when the viewer commits to a new slide. */
  onIndexChange?: (index: number) => void;
  onClose: () => void;
  footer: ReactNode;
  onUntag?: () => void;
  onReport?: () => void;
  isAlbumFavorite?: boolean;
  isOriginalRequested?: boolean;
  albumCount?: number;
  originalCount?: number;
  albumTooltip?: string;
  originalTooltip?: string;
  onToggleAlbum?: () => void;
  onToggleOriginal?: () => void;
};

/**
 * High-performance, mobile-first Photo Lightbox.
 * Supports:
 * - Effortless 1-finger horizontal swipe with low commit threshold (15% screen width or velocity flick)
 * - True multi-touch pinch-to-zoom (up to 4x)
 * - Double-tap to zoom (centers on tapped point, resets on second double-tap)
 * - 1-finger pan navigation when zoomed in
 * - Desktop floating chevrons & keyboard arrows (Left/Right/Escape)
 * - Desktop mouse wheel zoom & click-drag
 * - Smooth hardware-accelerated slide transitions
 * - Uncompromised high-DPI image sharpness (no WebGL texture downsampling or CORS proxies)
 */
export function PhotoLightbox({
  items,
  startIndex = 0,
  onIndexChange,
  onClose,
  footer,
  onUntag,
  onReport,
  isAlbumFavorite = false,
  isOriginalRequested = false,
  albumCount = 0,
  originalCount = 0,
  albumTooltip,
  originalTooltip,
  onToggleAlbum,
  onToggleOriginal,
}: PhotoLightboxProps) {
  // Normalize slides
  const slides = (items || []).map((item) => ({
    image: item.image || '',
    caption: item.caption || '',
  }));

  const safeStart = Math.max(0, Math.min(startIndex, Math.max(slides.length - 1, 0)));
  const [currentIndex, setCurrentIndex] = useState(safeStart);

  // Sync if parent startIndex changes
  useEffect(() => {
    if (startIndex >= 0 && startIndex < slides.length) {
      setCurrentIndex(startIndex);
    }
  }, [startIndex, slides.length]);

  const onIndexChangeRef = useRef(onIndexChange);
  onIndexChangeRef.current = onIndexChange;

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isZoomAnimating, setIsZoomAnimating] = useState(false);

  // Slide drag / transition state
  const [dragOffset, setDragOffset] = useState(0);
  const [isSlideAnimating, setIsSlideAnimating] = useState(false);

  // Touch & Gesture tracking refs
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const touchCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const isPinchingRef = useRef(false);
  const pinchStartDistRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const isSwipingRef = useRef(false);

  // Prevent background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Preload adjacent images for instantaneous transitions
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const preloadUrls = [
      slides[currentIndex - 1]?.image,
      slides[currentIndex + 1]?.image,
    ].filter(Boolean);

    preloadUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [currentIndex, slides]);

  // Reset zoom & pan helper
  const resetZoom = useCallback(() => {
    setIsZoomAnimating(true);
    setScale(1);
    setPan({ x: 0, y: 0 });
    setTimeout(() => setIsZoomAnimating(false), 240);
  }, []);

  // Commit index helper
  const commitIndex = useCallback(
    (newIdx: number) => {
      const clamped = Math.max(0, Math.min(newIdx, slides.length - 1));
      setCurrentIndex(clamped);
      setScale(1);
      setPan({ x: 0, y: 0 });
      setDragOffset(0);
      setIsSlideAnimating(false);
      onIndexChangeRef.current?.(clamped);
    },
    [slides.length]
  );

  // Navigate next / prev with smooth animation
  const goToNext = useCallback(() => {
    if (currentIndex >= slides.length - 1 || isSlideAnimating) return;
    const width = containerRef.current?.offsetWidth || window.innerWidth;
    setIsSlideAnimating(true);
    setDragOffset(-width);
    setTimeout(() => {
      commitIndex(currentIndex + 1);
    }, 250);
  }, [currentIndex, slides.length, isSlideAnimating, commitIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex <= 0 || isSlideAnimating) return;
    const width = containerRef.current?.offsetWidth || window.innerWidth;
    setIsSlideAnimating(true);
    setDragOffset(width);
    setTimeout(() => {
      commitIndex(currentIndex - 1);
    }, 250);
  }, [currentIndex, isSlideAnimating, commitIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, goToNext, goToPrev]);

  // Compute pan limits for a given scale and container
  const getPanBounds = useCallback((targetScale: number) => {
    const container = containerRef.current;
    if (!container || targetScale <= 1) return { maxX: 0, maxY: 0 };
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    const maxX = Math.max(0, ((targetScale - 1) * width) / 2);
    const maxY = Math.max(0, ((targetScale - 1) * height) / 2);
    return { maxX, maxY };
  }, []);

  // Double tap handler: toggle between 1x and 2.5x centered at tap point
  const handleDoubleTap = useCallback(
    (clientX: number, clientY: number) => {
      if (scale > 1.05) {
        resetZoom();
      } else {
        const container = containerRef.current;
        const targetScale = 2.5;
        let targetPanX = 0;
        let targetPanY = 0;

        if (container) {
          const rect = container.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const tapOffsetX = clientX - centerX;
          const tapOffsetY = clientY - centerY;

          const { maxX, maxY } = getPanBounds(targetScale);
          targetPanX = Math.max(-maxX, Math.min(maxX, -tapOffsetX * (targetScale - 1)));
          targetPanY = Math.max(-maxY, Math.min(maxY, -tapOffsetY * (targetScale - 1)));
        }

        setIsZoomAnimating(true);
        setScale(targetScale);
        setPan({ x: targetPanX, y: targetPanY });
        setTimeout(() => setIsZoomAnimating(false), 240);
      }
    },
    [scale, resetZoom, getPanBounds]
  );

  // Touch Events
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (isSlideAnimating) return;

    if (e.touches.length === 2) {
      // 2-finger pinch
      isPinchingRef.current = true;
      isSwipingRef.current = false;
      isPanningRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      pinchStartDistRef.current = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartScaleRef.current = scale;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      const lastTap = lastTapRef.current;

      // Detect double-tap (< 300ms, < 35px drift)
      if (
        now - lastTap.time < 300 &&
        Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < 35
      ) {
        lastTapRef.current = { time: 0, x: 0, y: 0 };
        handleDoubleTap(touch.clientX, touch.clientY);
        return;
      }

      lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now };
      touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };

      if (scale > 1.05) {
        // Pan mode
        isPanningRef.current = true;
        isSwipingRef.current = false;
        startPanRef.current = { ...pan };
      } else {
        // Swipe mode
        isSwipingRef.current = true;
        isPanningRef.current = false;
      }
    }
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (isPinchingRef.current && e.touches.length === 2) {
      // Handle pinch zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / Math.max(pinchStartDistRef.current, 1);
      const newScale = Math.max(0.85, Math.min(4.5, pinchStartScaleRef.current * ratio));
      setScale(newScale);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchCurrentRef.current = { x: touch.clientX, y: touch.clientY };
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (isPanningRef.current && scale > 1.05) {
        // Pan the zoomed image
        const { maxX, maxY } = getPanBounds(scale);
        const newX = Math.max(-maxX, Math.min(maxX, startPanRef.current.x + deltaX));
        const newY = Math.max(-maxY, Math.min(maxY, startPanRef.current.y + deltaY));
        setPan({ x: newX, y: newY });
      } else if (isSwipingRef.current && scale <= 1.05) {
        // Track swipe gesture horizontally
        // Resistance at ends
        let offset = deltaX;
        if ((currentIndex === 0 && deltaX > 0) || (currentIndex === slides.length - 1 && deltaX < 0)) {
          offset = deltaX * 0.28;
        }
        setDragOffset(offset);
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (isPinchingRef.current) {
      isPinchingRef.current = false;
      if (scale < 1.05) {
        resetZoom();
      } else if (scale > 4) {
        setIsZoomAnimating(true);
        setScale(4);
        setTimeout(() => setIsZoomAnimating(false), 200);
      } else {
        // Clamp pan bounds after pinch
        const { maxX, maxY } = getPanBounds(scale);
        setPan((prev) => ({
          x: Math.max(-maxX, Math.min(maxX, prev.x)),
          y: Math.max(-maxY, Math.min(maxY, prev.y)),
        }));
      }
      return;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (isSwipingRef.current) {
      isSwipingRef.current = false;
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const duration = Date.now() - touchStartRef.current.time;
      const velocity = Math.abs(dragOffset) / Math.max(duration, 1); // px/ms

      // Effortless swipe threshold:
      // Either > 15% of viewport width, OR flick velocity > 0.22 px/ms with at least 25px travel
      const distanceThreshold = containerWidth * 0.15;
      const isQuickFlick = velocity > 0.22 && Math.abs(dragOffset) > 25;
      const isPastDistance = Math.abs(dragOffset) > distanceThreshold;

      if ((isPastDistance || isQuickFlick) && dragOffset < 0 && currentIndex < slides.length - 1) {
        // Slide to next
        setIsSlideAnimating(true);
        setDragOffset(-containerWidth);
        setTimeout(() => {
          commitIndex(currentIndex + 1);
        }, 240);
      } else if ((isPastDistance || isQuickFlick) && dragOffset > 0 && currentIndex > 0) {
        // Slide to prev
        setIsSlideAnimating(true);
        setDragOffset(containerWidth);
        setTimeout(() => {
          commitIndex(currentIndex - 1);
        }, 240);
      } else {
        // Rubber band snap back to center
        setIsSlideAnimating(true);
        setDragOffset(0);
        setTimeout(() => {
          setIsSlideAnimating(false);
        }, 200);
      }
    }
  };

  // Mouse Wheel Zoom (Desktop)
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomFactor = -e.deltaY * 0.003;
    const newScale = Math.max(1, Math.min(4, scale + zoomFactor));
    if (newScale <= 1.02) {
      resetZoom();
    } else {
      setScale(newScale);
      const { maxX, maxY } = getPanBounds(newScale);
      setPan((prev) => ({
        x: Math.max(-maxX, Math.min(maxX, prev.x)),
        y: Math.max(-maxY, Math.min(maxY, prev.y)),
      }));
    }
  };

  // Report Photo confirmation
  const handleReportClick = () => {
    if (!onReport) return;
    const confirmed = window.confirm(
      'Are you sure you want to report this photo as inappropriate? Photos with multiple reports are automatically hidden for moderation.'
    );
    if (confirmed) {
      onReport();
    }
  };

  if (typeof document === 'undefined') {
    return null;
  }

  const hasSlides = slides.length > 0 && slides.some((s) => s.image);
  const currentSlide = slides[currentIndex];
  const prevSlide = slides[currentIndex - 1];
  const nextSlide = slides[currentIndex + 1];

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex h-[100dvh] flex-col overflow-hidden bg-zinc-950/95 backdrop-blur-md select-none"
      role="presentation"
    >
      {/* Top Chrome */}
      <div
        className="flex shrink-0 items-center justify-between border-b border-white/10 bg-black/40 px-3 pb-3 pt-[max(12px,calc(env(safe-area-inset-top,0px)+8px))] backdrop-blur-md sm:px-4 sm:pb-3 sm:pt-[max(14px,calc(env(safe-area-inset-top,0px)+10px))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100vw-110px)] sm:max-w-none">
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

          {onReport && (
            <button
              type="button"
              className="flex h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 items-center justify-center rounded-full border border-amber-500/25 bg-amber-950/40 text-amber-400 shadow-lg shadow-black/40 transition-colors hover:bg-amber-900/60 active:scale-[0.98]"
              onClick={(e) => {
                e.stopPropagation();
                handleReportClick();
              }}
              title="Report this photo"
              aria-label="Report photo"
            >
              <Flag className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
            </button>
          )}

          {onToggleAlbum && (
            <button
              type="button"
              className={`flex h-11 min-h-[44px] ${
                albumCount > 0 ? 'px-3.5' : 'w-11 min-w-[44px]'
              } shrink-0 items-center justify-center gap-1.5 rounded-full border shadow-lg shadow-black/40 transition-all active:scale-[0.95] ${
                isAlbumFavorite
                  ? 'border-rose-500/60 bg-rose-600 text-white shadow-rose-500/30'
                  : albumCount > 0
                  ? 'border-white/25 bg-zinc-900/90 text-white/90 hover:text-rose-400 hover:border-rose-400/40'
                  : 'border-white/20 bg-zinc-900/90 text-zinc-300 hover:text-rose-400 hover:border-rose-400/40'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleAlbum();
              }}
              title={albumTooltip || (isAlbumFavorite ? 'Remove from Album selection' : 'Select for Album (❤️)')}
              aria-label="Toggle album selection"
            >
              <Heart
                className={`h-5 w-5 shrink-0 transition-transform ${
                  isAlbumFavorite ? 'fill-current text-white scale-110' : ''
                }`}
                strokeWidth={2}
                aria-hidden
              />
              {albumCount > 0 && <span className="text-xs font-bold leading-none">{albumCount}</span>}
            </button>
          )}

          {onToggleOriginal && (
            <button
              type="button"
              className={`flex h-11 min-h-[44px] ${
                originalCount > 0 ? 'px-3.5' : 'w-11 min-w-[44px]'
              } shrink-0 items-center justify-center gap-1.5 rounded-full border shadow-lg shadow-black/40 transition-all active:scale-[0.95] ${
                isOriginalRequested
                  ? 'border-amber-500/60 bg-amber-600 text-white shadow-amber-500/30'
                  : originalCount > 0
                  ? 'border-white/25 bg-zinc-900/90 text-white/90 hover:text-amber-400 hover:border-amber-400/40'
                  : 'border-white/20 bg-zinc-900/90 text-zinc-300 hover:text-amber-400 hover:border-amber-400/40'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleOriginal();
              }}
              title={
                originalTooltip ||
                (isOriginalRequested ? 'Remove from High-Res requests' : 'Save for High-Res Master (🔖)')
              }
              aria-label="Toggle high-res bookmark"
            >
              <Bookmark
                className={`h-5 w-5 shrink-0 transition-transform ${
                  isOriginalRequested ? 'fill-current text-white scale-110' : ''
                }`}
                strokeWidth={2}
                aria-hidden
              />
              {originalCount > 0 && <span className="text-xs font-bold leading-none">{originalCount}</span>}
            </button>
          )}
        </div>

        {/* Counter indicator & Close button */}
        <div className="flex items-center gap-2">
          {slides.length > 1 && (
            <div className="hidden sm:inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold tracking-wider text-zinc-300">
              {currentIndex + 1} / {slides.length}
            </div>
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
      </div>

      {/* Main Viewport Container */}
      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden touch-none"
        role="dialog"
        aria-modal="true"
        aria-label="Photo preview"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        onClick={(e) => {
          // If user clicked background area outside active zoom or drag, close
          if (e.target === containerRef.current && scale <= 1.05 && Math.abs(dragOffset) < 5) {
            onClose();
          }
        }}
      >
        {/* Left Floating Chevron (Desktop & Tablet) */}
        {currentIndex > 0 && (
          <button
            type="button"
            className="hidden sm:flex absolute left-4 z-[210] h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-zinc-950/70 text-white shadow-xl backdrop-blur-md transition-all hover:bg-zinc-900/90 hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-7 w-7" strokeWidth={2.25} />
          </button>
        )}

        {/* Right Floating Chevron (Desktop & Tablet) */}
        {currentIndex < slides.length - 1 && (
          <button
            type="button"
            className="hidden sm:flex absolute right-4 z-[210] h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-zinc-950/70 text-white shadow-xl backdrop-blur-md transition-all hover:bg-zinc-900/90 hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next photo"
          >
            <ChevronRight className="h-7 w-7" strokeWidth={2.25} />
          </button>
        )}

        {/* Slide Carousel Track */}
        {hasSlides ? (
          <div className="relative h-full w-full overflow-hidden">
            {/* Previous Slide (if exists) */}
            {prevSlide && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none p-2 sm:p-4"
                style={{
                  transform: `translate3d(calc(-100% + ${dragOffset}px), 0, 0)`,
                  transition: isSlideAnimating
                    ? 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)'
                    : 'none',
                  willChange: 'transform',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={prevSlide.image}
                  alt={prevSlide.caption || 'Previous photo'}
                  className="max-h-full max-w-full object-contain rounded-md shadow-2xl opacity-90"
                  draggable={false}
                />
              </div>
            )}

            {/* Current Slide */}
            {currentSlide && (
              <div
                className="absolute inset-0 flex items-center justify-center p-2 sm:p-4"
                style={{
                  transform: `translate3d(${dragOffset}px, 0, 0)`,
                  transition: isSlideAnimating
                    ? 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)'
                    : 'none',
                  willChange: 'transform',
                }}
              >
                <div
                  className="relative flex h-full w-full items-center justify-center"
                  style={{
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
                    transformOrigin: 'center center',
                    transition: isZoomAnimating ? 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                    willChange: 'transform',
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleDoubleTap(e.clientX, e.clientY);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.caption || 'Photo preview'}
                    className={`max-h-full max-w-full object-contain rounded-md shadow-2xl ring-1 ring-white/10 select-none ${
                      scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                    }`}
                    draggable={false}
                  />
                </div>
              </div>
            )}

            {/* Next Slide (if exists) */}
            {nextSlide && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none p-2 sm:p-4"
                style={{
                  transform: `translate3d(calc(100% + ${dragOffset}px), 0, 0)`,
                  transition: isSlideAnimating
                    ? 'transform 250ms cubic-bezier(0.16, 1, 0.3, 1)'
                    : 'none',
                  willChange: 'transform',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={nextSlide.image}
                  alt={nextSlide.caption || 'Next photo'}
                  className="max-h-full max-w-full object-contain rounded-md shadow-2xl opacity-90"
                  draggable={false}
                />
              </div>
            )}
          </div>
        ) : (
          <p className="px-4 text-center text-sm text-gray-400">Preview unavailable for this photo.</p>
        )}

        {/* Reset Zoom Pill (Appears whenever user is zoomed in) */}
        {scale > 1.05 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              resetZoom();
            }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[215] flex items-center gap-1.5 rounded-full border border-white/20 bg-black/80 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-all hover:bg-black/95 active:scale-95 animate-in fade-in zoom-in-95 duration-150"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{Math.round(scale * 100)}% · Tap to reset</span>
          </button>
        )}

        {/* Mobile Swipe / Zoom Helper hint (fades out or shows slide dots if multiple) */}
        {slides.length > 1 && scale <= 1.05 && (
          <div className="sm:hidden absolute top-3 left-1/2 -translate-x-1/2 z-[205] pointer-events-none flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-zinc-300 backdrop-blur-sm border border-white/10">
            {currentIndex + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div
        className="shrink-0 border-t border-white/10 bg-gradient-to-t from-[#0a0812] to-[#14121f]/98 px-3 pt-3 backdrop-blur-xl sm:px-5 sm:py-4"
        style={{ paddingBottom: 'max(0.75rem, calc(env(safe-area-inset-bottom, 0px) + 0.5rem))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {footer}
      </div>
    </div>,
    document.body
  );
}
