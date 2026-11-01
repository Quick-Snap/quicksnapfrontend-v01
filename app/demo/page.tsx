'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  Check,
  Heart,
  Download,
  Share2,
  Users,
  ArrowRight,
  Shield,
  Zap,
  RefreshCw,
  Eye,
  X,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import BrandLogo from '@/components/BrandLogo';

interface DemoFaceBox {
  name: string;
  personaId: string;
  confidence: number;
  box: { x: number; y: number; w: number; h: number };
}

interface DemoPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  photoIds: number[];
}

interface DemoPhoto {
  id: number;
  url: string;
  caption: string;
  tag: string;
  matchedPersonaIds: string[];
  faces: DemoFaceBox[];
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'rohan',
    name: 'Rohan',
    role: "Groom's Brother",
    avatar: '/demo/rohan_1.jpg',
    photoIds: [1, 5, 7, 8, 11, 12]
  },
  {
    id: 'priya',
    name: 'Priya',
    role: "Bride's Sister",
    avatar: '/demo/priya_1.jpg',
    photoIds: [2, 6, 7, 9, 11]
  },
  {
    id: 'kabir',
    name: 'Kabir',
    role: 'College Bestie',
    avatar: '/demo/kabir_1.jpg',
    photoIds: [3, 5, 9, 10, 11]
  },
  {
    id: 'ananya',
    name: 'Ananya',
    role: 'Childhood Friend',
    avatar: '/demo/ananya_1.jpg',
    photoIds: [4, 6, 8, 10, 11]
  }
];

const DEMO_PHOTOS: DemoPhoto[] = [
  {
    id: 1,
    url: '/demo/rohan_1.jpg',
    caption: "Rohan's Sangeet Reception Portrait",
    tag: 'Sangeet',
    matchedPersonaIds: ['rohan'],
    faces: [
      { name: 'Rohan', personaId: 'rohan', confidence: 99.4, box: { x: 30, y: 14, w: 40, h: 36 } }
    ]
  },
  {
    id: 2,
    url: '/demo/priya_1.jpg',
    caption: "Priya's Bridal Sister Portrait",
    tag: 'Ceremony',
    matchedPersonaIds: ['priya'],
    faces: [
      { name: 'Priya', personaId: 'priya', confidence: 99.6, box: { x: 30, y: 14, w: 40, h: 36 } }
    ]
  },
  {
    id: 3,
    url: '/demo/kabir_1.jpg',
    caption: "Kabir's Cocktail Evening Portrait",
    tag: 'Cocktail',
    matchedPersonaIds: ['kabir'],
    faces: [
      { name: 'Kabir', personaId: 'kabir', confidence: 99.1, box: { x: 30, y: 14, w: 40, h: 36 } }
    ]
  },
  {
    id: 4,
    url: '/demo/ananya_1.jpg',
    caption: "Ananya's Haldi & Mehendi Glow",
    tag: 'Haldi',
    matchedPersonaIds: ['ananya'],
    faces: [
      { name: 'Ananya', personaId: 'ananya', confidence: 98.9, box: { x: 30, y: 14, w: 40, h: 36 } }
    ]
  },
  {
    id: 5,
    url: '/demo/rohan_kabir.jpg',
    caption: 'Rohan & Kabir Celebrating at Sangeet',
    tag: 'Sangeet',
    matchedPersonaIds: ['rohan', 'kabir'],
    faces: [
      { name: 'Rohan', personaId: 'rohan', confidence: 99.2, box: { x: 18, y: 18, w: 28, h: 30 } },
      { name: 'Kabir', personaId: 'kabir', confidence: 98.8, box: { x: 54, y: 20, w: 28, h: 30 } }
    ]
  },
  {
    id: 6,
    url: '/demo/priya_ananya.jpg',
    caption: 'Priya & Ananya Sisterhood Moments',
    tag: 'Mehendi',
    matchedPersonaIds: ['priya', 'ananya'],
    faces: [
      { name: 'Priya', personaId: 'priya', confidence: 99.5, box: { x: 18, y: 18, w: 28, h: 30 } },
      { name: 'Ananya', personaId: 'ananya', confidence: 99.1, box: { x: 54, y: 19, w: 28, h: 30 } }
    ]
  },
  {
    id: 7,
    url: '/demo/rohan_priya.jpg',
    caption: 'Rohan & Priya at Wedding Mandap',
    tag: 'Ceremony',
    matchedPersonaIds: ['rohan', 'priya'],
    faces: [
      { name: 'Rohan', personaId: 'rohan', confidence: 99.3, box: { x: 20, y: 18, w: 28, h: 30 } },
      { name: 'Priya', personaId: 'priya', confidence: 99.4, box: { x: 52, y: 19, w: 28, h: 30 } }
    ]
  },
  {
    id: 8,
    url: '/demo/rohan_ananya.jpg',
    caption: 'Rohan & Ananya on the Dance Floor',
    tag: 'Sangeet',
    matchedPersonaIds: ['rohan', 'ananya'],
    faces: [
      { name: 'Rohan', personaId: 'rohan', confidence: 98.9, box: { x: 22, y: 18, w: 28, h: 30 } },
      { name: 'Ananya', personaId: 'ananya', confidence: 99.2, box: { x: 52, y: 20, w: 28, h: 30 } }
    ]
  },
  {
    id: 9,
    url: '/demo/kabir_priya.jpg',
    caption: 'Kabir & Priya at Reception Banquet',
    tag: 'Reception',
    matchedPersonaIds: ['kabir', 'priya'],
    faces: [
      { name: 'Kabir', personaId: 'kabir', confidence: 98.9, box: { x: 20, y: 18, w: 28, h: 30 } },
      { name: 'Priya', personaId: 'priya', confidence: 99.3, box: { x: 52, y: 19, w: 28, h: 30 } }
    ]
  },
  {
    id: 10,
    url: '/demo/kabir_ananya.jpg',
    caption: 'Kabir & Ananya Toasting Cocktail Hour',
    tag: 'Cocktail',
    matchedPersonaIds: ['kabir', 'ananya'],
    faces: [
      { name: 'Kabir', personaId: 'kabir', confidence: 99.0, box: { x: 20, y: 18, w: 28, h: 30 } },
      { name: 'Ananya', personaId: 'ananya', confidence: 99.1, box: { x: 52, y: 19, w: 28, h: 30 } }
    ]
  },
  {
    id: 11,
    url: '/demo/squad_all.jpg',
    caption: 'The Entire Squad Together Under Fairy Lights',
    tag: 'Reception',
    matchedPersonaIds: ['rohan', 'priya', 'kabir', 'ananya'],
    faces: [
      { name: 'Rohan', personaId: 'rohan', confidence: 99.1, box: { x: 10, y: 18, w: 20, h: 26 } },
      { name: 'Kabir', personaId: 'kabir', confidence: 98.6, box: { x: 32, y: 20, w: 20, h: 26 } },
      { name: 'Priya', personaId: 'priya', confidence: 99.4, box: { x: 54, y: 19, w: 20, h: 26 } },
      { name: 'Ananya', personaId: 'ananya', confidence: 98.8, box: { x: 74, y: 21, w: 20, h: 26 } }
    ]
  },
  {
    id: 12,
    url: '/demo/rohan_dance.jpg',
    caption: "Rohan's Energetic Baraat Dance",
    tag: 'Baraat',
    matchedPersonaIds: ['rohan'],
    faces: [
      { name: 'Rohan', personaId: 'rohan', confidence: 99.0, box: { x: 30, y: 14, w: 40, h: 36 } }
    ]
  }
];

export default function DemoPage() {
  const [selectedPersona, setSelectedPersona] = useState<DemoPersona | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<DemoPhoto | null>(null);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error('Camera access denied or unavailable. Please select a persona below!');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraSelfie = () => {
    stopCamera();
    // Simulate instant match to first demo persona (Rohan)
    simulateMatch(DEMO_PERSONAS[0]);
  };

  const simulateMatch = (persona: DemoPersona) => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setSelectedPersona(persona);
          toast.success(`Matched ${persona.name}! Found ${persona.photoIds.length} photos 🎉`, {
            duration: 4000
          });
          return 100;
        }
        return prev + 25;
      });
    }, 250);
  };

  const handleReset = () => {
    setSelectedPersona(null);
  };

  const toggleFavorite = (photoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
        toast('Removed from album favorites', { icon: '💔' });
      } else {
        next.add(photoId);
        toast.success('Added to album favorites (❤️)!');
      }
      return next;
    });
  };

  const displayPhotos = selectedPersona
    ? DEMO_PHOTOS.filter((p) => p.matchedPersonaIds.includes(selectedPersona.id))
    : DEMO_PHOTOS;

  return (
    <div className="min-h-screen bg-[#07050e] text-white selection:bg-violet-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#07050e]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo href="/" size="sm" tone="light" />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Live Interactive Demo
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Exit Demo
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/25 transition-all"
            >
              Host Your Event &rarr;
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Interactive Tester */}
      <section className="relative pt-10 pb-12 px-4 sm:px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 mb-4 backdrop-blur-md">
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span>No app download or sign-up required</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Test Roopixo AI Face Matching in{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">
            5 Seconds
          </span>
        </h1>

        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Simulate being an event guest at <strong>Aarav &amp; Meera&apos;s Grand Wedding</strong>. Tap any guest persona below (or snap your camera) to watch our AI isolate their exact photos!
        </p>

        {/* Persona Selectors Bar */}
        <div className="mt-8 p-4 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-md max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3 px-1 text-xs">
            <span className="font-semibold text-zinc-300">
              Pick a guest persona to match:
            </span>
            {selectedPersona && (
              <button
                onClick={handleReset}
                className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Show All Event Photos</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {DEMO_PERSONAS.map((persona) => {
              const isSelected = selectedPersona?.id === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => simulateMatch(persona)}
                  className={`relative p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                    isSelected
                      ? 'bg-violet-600/25 border-violet-500 shadow-lg shadow-violet-500/20 scale-102 ring-1 ring-violet-400'
                      : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden shrink-0 border border-white/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={persona.avatar}
                      alt={persona.name}
                      className="h-full w-full object-cover object-top"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-violet-600/40 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white font-bold" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {persona.name}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {persona.role}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Selfie Camera Button */}
          <div className="mt-3 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span className="text-[11px] text-zinc-400">
              Want to try with your own face?
            </span>
            {isCameraActive ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={captureCameraSelfie}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Snap Selfie &amp; Match</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 text-zinc-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-colors"
              >
                <Camera className="h-3.5 w-3.5 text-violet-400" />
                <span>Take a Quick Selfie</span>
              </button>
            )}
          </div>

          {/* Video preview if camera active */}
          {isCameraActive && (
            <div className="mt-3 relative w-44 h-44 mx-auto rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
            </div>
          )}
        </div>
      </section>

      {/* Match Confirmation Banner */}
      {selectedPersona && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-purple-950/40 border border-violet-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl overflow-hidden border border-violet-400/50 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPersona.avatar}
                  alt={selectedPersona.name}
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Matched {selectedPersona.name}&apos;s Photos
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    99.2% Accuracy
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Showing {displayPhotos.length} photos containing {selectedPersona.name} ({selectedPersona.role})
                </p>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white transition-colors self-start sm:self-auto"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Photos Gallery Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {displayPhotos.map((photo) => {
            const isFav = favorites.has(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-violet-400/60 transition-all cursor-pointer shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />

                {/* AI Detected Face Bounding Targets */}
                {photo.faces.map((face) => {
                  const isMatchedPerson = selectedPersona?.id === face.personaId;
                  return (
                    <div
                      key={face.name}
                      style={{
                        left: `${face.box.x}%`,
                        top: `${face.box.y}%`,
                        width: `${face.box.w}%`,
                        height: `${face.box.h}%`,
                      }}
                      className={`absolute pointer-events-none rounded-xl transition-all duration-300 ${
                        isMatchedPerson
                          ? 'border-2 border-violet-400 bg-violet-500/15 shadow-[0_0_20px_rgba(168,85,247,0.5)] opacity-100 scale-100'
                          : 'border border-white/40 opacity-0 group-hover:opacity-100 group-hover:border-violet-400/80 group-hover:bg-violet-500/10'
                      }`}
                    >
                      {/* Corner accents */}
                      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-violet-400 rounded-tl-sm" />
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-violet-400 rounded-tr-sm" />
                      <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-violet-400 rounded-bl-sm" />
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-violet-400 rounded-br-sm" />

                      {/* Name Tag */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-[9px] font-bold text-violet-200 border border-violet-400/50 shadow-md flex items-center gap-1">
                        <span>{face.name}</span>
                        <span className="text-[8px] text-emerald-400 font-mono">{face.confidence}%</span>
                      </div>
                    </div>
                  );
                })}

                {/* Top Overlay Tag */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-zinc-300 border border-white/10">
                    {photo.tag}
                  </span>
                </div>

                {/* Top Right Heart Favorite Button */}
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(photo.id, e)}
                  title="Save to Album Favorites"
                  className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md transition-all ${
                    isFav
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-black/50 text-white/70 hover:text-white hover:bg-black/70'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                </button>

                {/* Bottom Caption Pill with in-photo members */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/95 via-black/60 to-transparent">
                  <p className="text-xs font-semibold text-white truncate drop-shadow-sm">
                    {photo.caption}
                  </p>
                  <div className="flex items-center gap-1 mt-1 overflow-hidden">
                    <span className="text-[9px] text-violet-300/80 font-medium shrink-0">In photo:</span>
                    <div className="flex items-center gap-1 truncate">
                      {photo.faces.map((f) => (
                        <span
                          key={f.name}
                          className={`text-[9px] px-1 py-0.5 rounded font-semibold ${
                            selectedPersona?.id === f.personaId
                              ? 'bg-violet-600 text-white shadow-sm'
                              : 'bg-white/15 text-zinc-300'
                          }`}
                        >
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Scanning AI Simulation Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#120f24] border border-violet-500/30 p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 animate-pulse">
              <Sparkles className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Roopixo AI Facial Engine
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Calculating 512-dim facial geometry &amp; scanning 16 event photos...
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              />
            </div>

            <p className="text-[11px] font-mono text-violet-300">
              Matching vectors: {scanProgress}% complete
            </p>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative aspect-[4/3] sm:aspect-[16/10] w-full bg-black flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.caption}
                className="h-full w-full object-contain"
              />

              {/* Detected Face Overlay on Lightbox */}
              {selectedPhoto.faces.map((face) => (
                <div
                  key={face.name}
                  style={{
                    left: `${face.box.x}%`,
                    top: `${face.box.y}%`,
                    width: `${face.box.w}%`,
                    height: `${face.box.h}%`,
                  }}
                  className="absolute pointer-events-none rounded-xl border-2 border-violet-400 bg-violet-500/15 shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                >
                  <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-violet-400 rounded-tl-sm" />
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-violet-400 rounded-tr-sm" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-violet-400 rounded-bl-sm" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-violet-400 rounded-br-sm" />

                  <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-black/90 backdrop-blur-md text-[10px] font-bold text-violet-200 border border-violet-400/50 shadow-md flex items-center gap-1.5">
                    <span>{face.name}</span>
                    <span className="text-[9px] text-emerald-400 font-mono">{face.confidence}% Match</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 border-t border-white/10 bg-[#0d0a19]">
              <div>
                <h4 className="text-sm font-bold text-white">
                  {selectedPhoto.caption}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Category: {selectedPhoto.tag} • Detected: {selectedPhoto.faces.map((f) => `${f.name} (${f.confidence}%)`).join(', ')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(selectedPhoto.id, e)}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    favorites.has(selectedPhoto.id)
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${favorites.has(selectedPhoto.id) ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">
                    {favorites.has(selectedPhoto.id) ? 'Favorited' : 'Favorite'}
                  </span>
                </button>

                <a
                  href={selectedPhoto.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white flex items-center gap-1.5 shadow-md shadow-violet-500/25 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Conversion CTA */}
      <section className="border-t border-white/10 bg-gradient-to-b from-[#0e0b1c] to-[#07050e] py-16 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            Ready for your event?
          </span>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Give Your Guests This Magical Experience
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Weddings, corporate summits, birthdays, and college fests. Create your event in under 60 seconds and let guests find their photos with zero waiting.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Host Your Event (14-Day Free Trial)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-sm font-semibold transition-all"
            >
              View Pricing &amp; Passes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
