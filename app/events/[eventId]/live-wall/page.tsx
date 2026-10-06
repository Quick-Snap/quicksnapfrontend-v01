'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Maximize,
  Minimize,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Settings,
  EyeOff,
  QrCode as QrCodeIcon,
  Sparkles,
  Users,
  Star,
  RefreshCw,
  X,
  Sliders,
  Tv,
  Smartphone,
  Monitor,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { eventApi } from '@/lib/api';
import { fetchAllEventPhotos, normalizePhotosFromGet } from '@/lib/photoFetch';
import { getPhotoDisplayUrl } from '@/lib/photoUrl';
import { useAuth } from '@/contexts/AuthContext';

type AspectRatioMode = 'auto' | '16-9' | '9-16';
type StreamMode = 'smart-mix' | 'official-only' | 'all-safe';

interface PhotoScoreItem {
  photo: any;
  score: number;
  id: string;
  url: string;
  isOfficial: boolean;
  groupCount: number;
  hasJoinedAttendee: boolean;
  confidence: number;
}

export default function LiveMomentsWallPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;
  const { user } = useAuth();

  // State
  const [event, setEvent] = useState<any>(null);
  const [rawPhotos, setRawPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  // Slideshow & Navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenPhotoIds, setHiddenPhotoIds] = useState<Set<string>>(new Set());
  const [emergencyToast, setEmergencyToast] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Settings (Public & Organizer)
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('auto');
  const [streamMode, setStreamMode] = useState<StreamMode>('smart-mix');
  const [prioritizeGroups, setPrioritizeGroups] = useState(true);
  const [prioritizeJoined, setPrioritizeJoined] = useState(true);
  const [slideDuration, setSlideDuration] = useState<number>(7); // seconds
  const [showQrCode, setShowQrCode] = useState(true);

  // Copy Public Live Wall Link
  const handleCopyWallLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Motion index for Ken Burns alternation
  const [motionVariation, setMotionVariation] = useState<number>(0);

  // Save and apply settings
  const [savingSettings, setSavingSettings] = useState(false);
  const handleApplySettings = async () => {
    setShowSettings(false);
    if (!isOrganizer || !eventId) return;

    try {
      setSavingSettings(true);
      await eventApi.update(eventId, {
        liveWallSettings: {
          streamMode,
          prioritizeGroups,
          prioritizeJoined,
          slideDuration,
          showQrCode,
          aspectRatio,
        }
      });
      setEmergencyToast('Live Wall settings saved successfully');
      setTimeout(() => setEmergencyToast(null), 3000);
    } catch (err) {
      console.error('Failed to persist live wall settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Inactivity timer for fading UI controls
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate QR Code URL
  useEffect(() => {
    if (!eventId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://roopixo.com';
    const targetUrl = `${origin}/events/${eventId}`;

    QRCode.toDataURL(targetUrl, {
      width: 480,
      margin: 1,
      color: {
        dark: '#110c1f',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate Live Wall QR:', err));
  }, [eventId]);

  // Compute permissions
  const isOrganizer = useMemo(() => {
    if (!user || !event) return false;
    if (user.role === 'admin' || user.roles?.includes('admin')) return true;
    const orgId = typeof event.organizer === 'string' ? event.organizer : event.organizer?._id;
    return orgId === user.id || orgId === (user as any)._id;
  }, [user, event]);

  // Load Event and Initial Photos
  const loadData = useCallback(async (isInitial = false) => {
    if (!eventId) return;
    try {
      if (isInitial) setLoading(true);

      const [eventRes, photosRes] = await Promise.allSettled([
        eventApi.getById(eventId),
        fetchAllEventPhotos(eventId, { all: true, isLiveWall: true })
      ]);

      if (eventRes.status === 'fulfilled' && (eventRes.value as any)?.data) {
        const ev = (eventRes.value as any).data;
        setEvent(ev);

        // Sync persistent Live Wall settings from event
        if (ev.liveWallSettings) {
          if (ev.liveWallSettings.streamMode) setStreamMode(ev.liveWallSettings.streamMode);
          if (ev.liveWallSettings.prioritizeGroups !== undefined) setPrioritizeGroups(ev.liveWallSettings.prioritizeGroups);
          if (ev.liveWallSettings.prioritizeJoined !== undefined) setPrioritizeJoined(ev.liveWallSettings.prioritizeJoined);
          if (ev.liveWallSettings.slideDuration) setSlideDuration(ev.liveWallSettings.slideDuration);
          if (ev.liveWallSettings.showQrCode !== undefined) setShowQrCode(ev.liveWallSettings.showQrCode);
          if (ev.liveWallSettings.aspectRatio) setAspectRatio(ev.liveWallSettings.aspectRatio);
        }
      }

      if (photosRes.status === 'fulfilled') {
        const normalized = normalizePhotosFromGet(photosRes.value);
        setRawPhotos(normalized);
      }
    } catch (err) {
      console.error('Error loading live moments wall data:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData(true);

    // Auto sync new photos every 4 minutes (calm, server-friendly interval)
    pollTimerRef.current = setInterval(() => {
      loadData(false);
    }, 4 * 60 * 1000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [loadData]);

  // Attendees lookup Set for joined guest matching
  const attendeeIdSet = useMemo(() => {
    const set = new Set<string>();
    if (!event?.attendees || !Array.isArray(event.attendees)) return set;
    for (const a of event.attendees) {
      if (typeof a === 'string') set.add(a.trim());
      else if (a && typeof a === 'object') {
        const id = a._id || a.id || a.userId;
        if (id) set.add(String(id).trim());
      }
    }
    return set;
  }, [event?.attendees]);

  // Curated, scored, and filtered photo list
  const scoredPhotos = useMemo<PhotoScoreItem[]>(() => {
    if (!rawPhotos || rawPhotos.length === 0) return [];

    // Filter 1: Moderation safety & deletion guard
    const safePhotos = rawPhotos.filter((p) => {
      const id = String(p._id || p.imageId || '');
      if (!id || hiddenPhotoIds.has(id)) return false;
      if (p.isDeleted) return false;
      
      // Strict moderation guarantee: reject any flagged or unapproved photo
      if (p.moderationStatus && p.moderationStatus !== 'approved') return false;
      return true;
    });

    // Score computation
    const scored: PhotoScoreItem[] = safePhotos.map((p) => {
      const id = String(p._id || p.imageId || '');
      const url = getPhotoDisplayUrl(p) || p.url || p.s3Url || p.imageUrl || '';
      const isOfficial = !!(p.isOfficial ?? p.is_official);
      const faceMatches: any[] = Array.isArray(p.faceMatches) ? p.faceMatches : [];
      const matchedUsers: any[] = Array.isArray(p.matchedUsers) ? p.matchedUsers : [];
      const groupCount = Math.max(faceMatches.length, matchedUsers.length);

      let hasJoinedAttendee = false;
      let highestConfidence = 0;

      for (const m of faceMatches) {
        const conf = typeof m.confidence === 'number' ? m.confidence : 0;
        if (conf > highestConfidence) highestConfidence = conf;

        const uid = m.userId ? String(m.userId._id || m.userId).trim() : '';
        if (uid && attendeeIdSet.has(uid)) {
          hasJoinedAttendee = true;
        }
      }

      for (const u of matchedUsers) {
        const uid = typeof u === 'string' ? u.trim() : (u?._id ? String(u._id).trim() : '');
        if (uid && attendeeIdSet.has(uid)) {
          hasJoinedAttendee = true;
        }
      }

      // Base Score
      let score = 10;

      // Rule 1: Official Photos get top priority
      if (isOfficial) {
        score += 50;
      }

      // Rule 2: Group Dynamics (social sweet spot)
      if (prioritizeGroups) {
        if (groupCount >= 3 && groupCount <= 15) {
          score += 35; // Ideal social sweet spot
        } else if (groupCount === 1 || groupCount === 2) {
          score += 20; // Good portrait / duo
        } else if (groupCount > 15) {
          score += 10; // Very large crowd
        }
      }

      // Rule 3: Joined event attendees
      if (prioritizeJoined && hasJoinedAttendee) {
        score += 30;
      }

      // Rule 4: Facial clarity (if confidence score is present)
      if (highestConfidence >= 90) {
        score += 15;
      } else if (highestConfidence >= 80) {
        score += 10;
      } else if (groupCount > 0) {
        // Detected faces present even without confidence float
        score += 10;
      }

      return {
        photo: p,
        score,
        id,
        url,
        isOfficial,
        groupCount,
        hasJoinedAttendee,
        confidence: highestConfidence
      };
    });

    // Apply Stream Mode Filtering
    let filtered = scored;
    if (streamMode === 'official-only') {
      filtered = scored.filter((item) => item.isOfficial);
      // Fallback: If no official photos exist, show all safe rather than a black screen
      if (filtered.length === 0) filtered = scored;
    } else if (streamMode === 'smart-mix') {
      // SMART MIX CURATION:
      // 1. All Official photos are always included (guaranteed priority)
      const officialItems = scored.filter((item) => item.isOfficial);

      // 2. Candidate pool: all safe non-official photos
      const candidatePoolItems = scored.filter((item) => !item.isOfficial);

      // Sort candidate pool by score descending (group photos, attendee photos first)
      candidatePoolItems.sort((a, b) => b.score - a.score);

      // 3. Deduplication / Anti-repetition:
      // Prevent consecutive/burst shots of the exact same subject/timeframe
      const selectedPool: PhotoScoreItem[] = [];
      const seenSignatures = new Set<string>();

      for (const item of candidatePoolItems) {
        const faceMatches: any[] = Array.isArray(item.photo.faceMatches) ? item.photo.faceMatches : [];
        const matchedUsers: any[] = Array.isArray(item.photo.matchedUsers) ? item.photo.matchedUsers : [];

        const userIds = [
          ...faceMatches.map((m) => String(m.userId?._id || m.userId || '').trim()),
          ...matchedUsers.map((u) => (typeof u === 'string' ? u.trim() : String(u?._id || '').trim()))
        ].filter(Boolean).sort().join(':');

        // Burst signature: filename prefix (e.g. IMG_1024 without trailing sequence or extension)
        const fileNameBase = (item.photo.fileName || '').replace(/[-_]?\d+\.[^/.]+$/, '').slice(0, 15);
        const burstSignature = userIds ? `users:${userIds}` : (fileNameBase ? `file:${fileNameBase}` : '');

        if (burstSignature && seenSignatures.has(burstSignature)) {
          // Skip redundant burst photo to keep stream fresh and unique
          continue;
        }

        if (burstSignature) {
          seenSignatures.add(burstSignature);
        }

        selectedPool.push(item);
        // Smart Mix: curate top 20 best unique candid shots to mix with official photos
        if (selectedPool.length >= 20) break;
      }

      // 4. Combine all official photos + top curated unique candid moments
      const combined = [...officialItems, ...selectedPool];
      filtered = combined.sort((a, b) => b.score - a.score);

      // Fallback if event has very few items
      if (filtered.length === 0) filtered = scored;
    }

    return filtered.filter((item) => !!item.url);
  }, [rawPhotos, hiddenPhotoIds, attendeeIdSet, prioritizeGroups, prioritizeJoined, streamMode]);

  // Preload next upcoming photos in background
  useEffect(() => {
    if (scoredPhotos.length === 0) return;
    const preloadAhead = 3;
    for (let i = 1; i <= preloadAhead; i++) {
      const nextIdx = (currentIndex + i) % scoredPhotos.length;
      const target = scoredPhotos[nextIdx];
      if (target?.url) {
        const img = new Image();
        img.src = target.url;
      }
    }
  }, [currentIndex, scoredPhotos]);

  // Slideshow advance timer
  const advanceSlide = useCallback((direction: 'next' | 'prev' = 'next') => {
    if (scoredPhotos.length === 0) return;
    setCurrentIndex((prev) => {
      if (direction === 'next') {
        return (prev + 1) % scoredPhotos.length;
      } else {
        return prev === 0 ? scoredPhotos.length - 1 : prev - 1;
      }
    });
    setMotionVariation((prev) => (prev + 1) % 4);
  }, [scoredPhotos.length]);

  useEffect(() => {
    if (!isPlaying || scoredPhotos.length <= 1) return;

    slideTimerRef.current = setTimeout(() => {
      advanceSlide('next');
    }, slideDuration * 1000);

    return () => {
      if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
    };
  }, [currentIndex, isPlaying, slideDuration, scoredPhotos.length, advanceSlide]);

  // Mouse movement resets auto-hide controls timer
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) {
        setShowControls(false);
      }
    }, 3500);
  }, [showSettings]);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Emergency Hide Current Photo
  const handleEmergencyHideCurrent = useCallback(() => {
    const current = scoredPhotos[currentIndex];
    if (!current) return;

    setHiddenPhotoIds((prev) => {
      const updated = new Set(prev);
      updated.add(current.id);
      return updated;
    });

    setEmergencyToast('Photo removed from Live Wall');
    setTimeout(() => setEmergencyToast(null), 3000);

    advanceSlide('next');
  }, [scoredPhotos, currentIndex, advanceSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          setIsPlaying((p) => !p);
          setShowControls(true);
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          advanceSlide('next');
          setShowControls(true);
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          advanceSlide('prev');
          setShowControls(true);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyH':
          e.preventDefault();
          handleEmergencyHideCurrent();
          break;
        case 'KeyS':
          e.preventDefault();
          setShowSettings((s) => !s);
          setShowControls(true);
          break;
        case 'Escape':
          if (showSettings) {
            setShowSettings(false);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [advanceSlide, toggleFullscreen, handleEmergencyHideCurrent, showSettings]);

  // Sync fullscreen change state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentItem = scoredPhotos[currentIndex] || null;

  // Ken Burns Motion Animation Classes based on variation
  const getKenBurnsMotion = (idx: number) => {
    switch (idx % 4) {
      case 0:
        return 'animate-kenburns-zoom-in';
      case 1:
        return 'animate-kenburns-pan-left';
      case 2:
        return 'animate-kenburns-zoom-out';
      case 3:
      default:
        return 'animate-kenburns-pan-right';
    }
  };

  // Determine stage aspect ratio wrapper styling
  const aspectContainerClasses = useMemo(() => {
    if (aspectRatio === '16-9') {
      return 'aspect-video w-full max-h-[100dvh] max-w-[177.78vh]';
    }
    if (aspectRatio === '9-16') {
      return 'aspect-[9/16] h-full max-w-[100vw] max-h-[100dvh]';
    }
    return 'w-full h-full max-w-full max-h-[100dvh]';
  }, [aspectRatio]);

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-black text-white select-none flex items-center justify-center font-sans touch-none"
    >
      {/* Background Ambience Layer: heavily blurred subtle ambient light */}
      {currentItem && (
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-125 transition-opacity duration-1000 pointer-events-none"
          style={{ backgroundImage: `url(${currentItem.url})` }}
        />
      )}

      {/* Main Stage Container */}
      <div className={`relative overflow-hidden flex items-center justify-center transition-all duration-500 ${aspectContainerClasses}`}>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 text-zinc-400">
            <RefreshCw className="w-10 h-10 animate-spin text-violet-400" />
            <p className="text-sm font-medium tracking-wide uppercase">Preparing Live Moments Stream...</p>
          </div>
        ) : scoredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center px-6 max-w-md">
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 backdrop-blur-md">
              <Sparkles className="w-10 h-10 text-violet-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-2">Awaiting Event Moments</h3>
              <p className="text-sm text-zinc-400 mb-5">
                As the photographer uploads photos, approved moments will automatically appear on this live wall.
              </p>
              {qrCodeUrl && (
                <div className="p-3 bg-white rounded-2xl inline-block shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="Event QR" className="w-36 h-36" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Active Slideshow Photo */}
            <div
              key={`${currentItem?.id}-${motionVariation}`}
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentItem?.url}
                alt="Event moment"
                className={`w-full h-full object-contain transition-transform duration-[7000ms] ease-out will-change-transform ${getKenBurnsMotion(motionVariation)}`}
              />
            </div>

            {/* Subtle Vignette Gradient for projector edge contrast */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-black/40" />

            {/* Top Left: Event Branding & Moment Badge */}
            <div className="absolute top-6 left-6 flex items-center gap-3 z-20 pointer-events-none">
              <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200">
                  {event?.name || 'Live Moments'}
                </span>
              </div>

              {currentItem?.isOfficial && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-300" />
                  <span>Featured Moment</span>
                </div>
              )}

              {currentItem && currentItem.groupCount >= 3 && currentItem.groupCount <= 15 && (
                <div className="px-3 py-1.5 rounded-xl bg-violet-500/20 backdrop-blur-md border border-violet-400/30 text-violet-300 text-xs font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>{currentItem.groupCount} Guests</span>
                </div>
              )}
            </div>

            {/* Persistent QR Overlay: Positioned according to screen orientation */}
            {showQrCode && qrCodeUrl && (
              <div
                className={`absolute z-20 transition-all duration-300 ${
                  aspectRatio === '9-16'
                    ? 'bottom-8 left-1/2 -translate-x-1/2'
                    : 'bottom-6 right-6'
                }`}
              >
                <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/15 shadow-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrCodeUrl}
                    alt="Scan for photos"
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white p-1"
                  />
                  <div className="text-left pr-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Find Your Photos
                    </p>
                    <p className="text-xs text-zinc-300 mt-0.5 leading-snug">
                      Scan or join event with code:
                    </p>
                    {event?.accessCode ? (
                      <span className="inline-block mt-1 font-mono text-sm font-bold tracking-widest text-white bg-white/10 px-2 py-0.5 rounded border border-white/15">
                        {event.accessCode}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-white">roopixo.com</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency Hide Alert Toast */}
      {emergencyToast && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl bg-red-600/90 text-white font-medium text-sm backdrop-blur-md shadow-2xl flex items-center gap-2 border border-red-400/40">
          <ShieldAlert className="w-4 h-4" />
          <span>{emergencyToast}</span>
        </div>
      )}

      {/* HUD Control Bar (Auto-hides on inactivity) */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-950/85 backdrop-blur-xl border border-white/15 shadow-2xl">
          {/* Back to Event/Dashboard Link */}
          <Link
            href={isOrganizer ? `/events/${eventId}/manage` : `/events/${eventId}`}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isOrganizer ? "Exit to Manage Dashboard" : "Exit to Event Gallery"}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* Previous Slide */}
          <button
            onClick={() => advanceSlide('prev')}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Previous (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30 transition-all"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          {/* Next Slide */}
          <button
            onClick={() => advanceSlide('next')}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Next (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* Counter */}
          <span className="text-xs font-medium text-zinc-400 px-2 tabular-nums">
            {scoredPhotos.length > 0 ? `${currentIndex + 1} / ${scoredPhotos.length}` : '0 / 0'}
          </span>

          <div className="h-5 w-px bg-white/10 mx-1" />

          {/* Emergency Hide Current Button (Organizers only) */}
          {isOrganizer && (
            <button
              onClick={handleEmergencyHideCurrent}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Emergency Hide Photo (H key)"
            >
              <EyeOff className="w-5 h-5" />
            </button>
          )}

          {/* Copy Public Live Wall Link */}
          <button
            onClick={handleCopyWallLink}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title={linkCopied ? "Link Copied!" : "Share Public Live Wall Link"}
          >
            {linkCopied ? <Check className="w-5 h-5 text-emerald-400" /> : <Share2 className="w-5 h-5" />}
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={`p-2 rounded-xl transition-colors ${
              showSettings ? 'text-violet-400 bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
            title="Wall Settings (S key)"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Toggle Fullscreen (F key)"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Floating Settings Drawer / Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-white/15 p-6 shadow-2xl text-left">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Live Wall Settings</h3>
                  <p className="text-xs text-zinc-400">Tailor presentation for your screen & event</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-sm">
              {/* Screen Orientation / Ratio */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                  Screen Aspect Ratio & Orientation
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('auto')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      aspectRatio === 'auto'
                        ? 'border-violet-500 bg-violet-500/15 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                    }`}
                  >
                    <Monitor className="w-5 h-5 mb-1.5" />
                    <span className="text-xs">Auto Responsive</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('16-9')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      aspectRatio === '16-9'
                        ? 'border-violet-500 bg-violet-500/15 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                    }`}
                  >
                    <Tv className="w-5 h-5 mb-1.5" />
                    <span className="text-xs">16:9 Landscape</span>
                    <span className="text-[10px] text-zinc-500">Projector / TV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('9-16')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                      aspectRatio === '9-16'
                        ? 'border-violet-500 bg-violet-500/15 text-white font-semibold'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mb-1.5" />
                    <span className="text-xs">9:16 Portrait</span>
                    <span className="text-[10px] text-zinc-500">Vertical Totem</span>
                  </button>
                </div>
              </div>

              {/* Stream Mode Selection (Organizers only) */}
              {isOrganizer && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                    Photo Stream Preference
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStreamMode('smart-mix')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        streamMode === 'smart-mix'
                          ? 'border-violet-500 bg-violet-500/15 text-white font-semibold'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs">Smart Mix</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">AI Recommended</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStreamMode('official-only')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        streamMode === 'official-only'
                          ? 'border-violet-500 bg-violet-500/15 text-white font-semibold'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs">Official Only</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Starred Photos</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStreamMode('all-safe')}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        streamMode === 'all-safe'
                          ? 'border-violet-500 bg-violet-500/15 text-white font-semibold'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-xs">All Safe</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">Chronological</div>
                    </button>
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-3 pt-1 border-t border-white/10">
                {isOrganizer && (
                  <>
                    <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/[0.08] cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <Users className="w-4 h-4 text-violet-400" />
                        <div>
                          <p className="text-xs font-semibold text-white">Prioritize Groups (3–15 people)</p>
                          <p className="text-[11px] text-zinc-400">Emphasize lively group pictures over solo selfies</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={prioritizeGroups}
                        onChange={(e) => setPrioritizeGroups(e.target.checked)}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-zinc-800 border-white/20"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/[0.08] cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="text-xs font-semibold text-white">Prioritize Joined Guests</p>
                          <p className="text-[11px] text-zinc-400">Favor moments of guests registered in this event</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={prioritizeJoined}
                        onChange={(e) => setPrioritizeJoined(e.target.checked)}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-zinc-800 border-white/20"
                      />
                    </label>
                  </>
                )}

                {/* Public Display Toggle */}
                <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/[0.08] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <QrCodeIcon className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Show QR Code Overlay</p>
                      <p className="text-[11px] text-zinc-400">Display corner QR badge for guest scanning</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 bg-zinc-800 border-white/20"
                  />
                </label>
              </div>

              {/* Slide Duration */}
              <div className="pt-1 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Slide Duration
                  </label>
                  <span className="text-xs font-mono text-violet-300 font-bold">{slideDuration} seconds</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 7, 10, 15].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSlideDuration(sec)}
                      className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                        slideDuration === sec
                          ? 'border-violet-500 bg-violet-500/20 text-white font-semibold'
                          : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Keyboard Shortcuts Guide */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Quick Keyboard Shortcuts:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">Space</kbd> Play / Pause</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">F</kbd> Fullscreen</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">→</kbd> Next Photo</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">H</kbd> Emergency Hide</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">S</kbd> Settings</span>
                  <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200">Esc</kbd> Close</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleApplySettings}
                disabled={savingSettings}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-lg transition-colors disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Apply & Return to Slideshow'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}