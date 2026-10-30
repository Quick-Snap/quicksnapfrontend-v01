'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Scan, CheckCircle2, Download, ArrowRight, Shield, Layers } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';

interface DemoGuest {
  id: string;
  name: string;
  role: string;
  avatar: string;
  confidence: string;
  matchedCount: number;
  matchTime: string;
  photos: {
    url: string;
    caption: string;
    time: string;
  }[];
}

const DEMO_GUESTS: DemoGuest[] = [
  {
    id: 'ananya',
    name: 'Ananya Sharma',
    role: "Bride's Sister",
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
    confidence: '99.8%',
    matchedCount: 6,
    matchTime: '0.34s',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
        caption: 'Ceremony entrance moment',
        time: '7:42 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
        caption: 'Haldi laughter with family',
        time: '3:15 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=800&q=80',
        caption: 'Toast to the couple',
        time: '9:10 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1546961342-ea5f71b193f3?w=800&q=80',
        caption: 'Bridesmaids candid group',
        time: '8:05 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&q=80',
        caption: 'Sangeet dance celebration',
        time: '10:30 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
        caption: 'Dinner reception laugh',
        time: '9:45 PM',
      },
    ],
  },
  {
    id: 'rohan',
    name: 'Rohan Mehra',
    role: 'Best Man / Host',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
    confidence: '99.6%',
    matchedCount: 5,
    matchTime: '0.41s',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
        caption: 'Keynote opening speech',
        time: '6:15 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&q=80',
        caption: 'Groomsmen toast',
        time: '8:20 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
        caption: 'Welcome entrance',
        time: '5:45 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80',
        caption: 'Stage moment with music',
        time: '11:00 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
        caption: 'DJ booth celebration',
        time: '11:45 PM',
      },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Verma',
    role: 'VIP Guest',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80',
    confidence: '99.5%',
    matchedCount: 4,
    matchTime: '0.29s',
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
        caption: 'Gala table conversation',
        time: '7:50 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80',
        caption: 'Celebration group portrait',
        time: '9:15 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
        caption: 'Outdoor cocktail candid',
        time: '8:40 PM',
      },
      {
        url: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=800&q=80',
        caption: 'Aisle blessing moment',
        time: '7:10 PM',
      },
    ],
  },
];

export function LiveDemoSection() {
  const [selectedGuest, setSelectedGuest] = useState<DemoGuest>(DEMO_GUESTS[0]);
  const [isScanning, setIsScanning] = useState(false);
  const [matchedPhotos, setMatchedPhotos] = useState(DEMO_GUESTS[0].photos);
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  const handleSelectGuest = (guest: DemoGuest) => {
    if (guest.id === selectedGuest.id && !isScanning) return;
    setSelectedGuest(guest);
    setIsScanning(true);
    setMatchedPhotos([]);

    // Simulate instant AI facial recognition match sequence
    setTimeout(() => {
      setIsScanning(false);
      setMatchedPhotos(guest.photos);
    }, 450);
  };

  return (
    <section id="landing-demo" className="relative scroll-mt-20 py-24 md:py-32 px-6 bg-[#080214] overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-violet-400/50" />
            <span className="text-xs font-semibold tracking-[0.2em] text-violet-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive AI Demo
            </span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-violet-400/50" />
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-white mb-5">
            Experience Face Matching in <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Real Time</span>
          </h2>
          <p className="text-white/55 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
            Click on any test guest below to see how Roopixo scans 1,800+ event photos and delivers exact matches in milliseconds.
          </p>
        </motion.div>

        {/* Guest Selector Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
          {DEMO_GUESTS.map((guest) => {
            const isSelected = guest.id === selectedGuest.id;
            return (
              <button
                key={guest.id}
                onClick={() => handleSelectGuest(guest)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all duration-300 ${
                  isSelected
                    ? 'border-violet-500 bg-violet-600/20 text-white shadow-lg shadow-violet-600/25 ring-2 ring-violet-500/40'
                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="relative">
                  <img
                    src={guest.avatar}
                    alt={guest.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/20"
                  />
                  {isSelected && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#080214]" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{guest.name}</div>
                  <div className="text-[11px] text-violet-300/80 font-light">{guest.role}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Simulation Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-violet-500/50 shrink-0">
                <img
                  src={selectedGuest.avatar}
                  alt={selectedGuest.name}
                  className="w-full h-full object-cover"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-violet-600/30 animate-pulse flex items-center justify-center">
                    <Scan className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">{selectedGuest.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Selfie Match
                  </span>
                </div>
                <div className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
                  <span>Confidence: <strong className="text-emerald-400">{selectedGuest.confidence}</strong></span>
                  <span>•</span>
                  <span>Match Time: <strong className="text-violet-300">{selectedGuest.matchTime}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>{selectedGuest.matchedCount} Photos Found</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                <span>Zero Indexing Privacy</span>
              </div>
            </div>
          </div>

          {/* Photos Grid */}
          <div className="min-h-[300px]">
            {isScanning ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16">
                  <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                  <Scan className="w-7 h-7 text-violet-400 absolute inset-0 m-auto" />
                </div>
                <div className="text-sm font-medium text-white/80 animate-pulse">
                  Scanning 1,850 event photos with face biometric vectors...
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
              >
                {matchedPhotos.map((photo, index) => (
                  <motion.div
                    key={photo.url}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/40"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Simulated Face Bounding Box */}
                    <div className="absolute top-1/4 left-1/3 w-16 h-16 border-2 border-emerald-400/80 rounded-xl pointer-events-none group-hover:border-violet-400 transition-colors">
                      <span className="absolute -top-4 left-0 px-1.5 py-0.2 bg-emerald-500 text-[9px] font-bold text-black rounded tracking-wide">
                        MATCH
                      </span>
                    </div>

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5">
                      <div className="flex justify-end">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-black/60 backdrop-blur-md text-white/80 border border-white/10">
                          {photo.time}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white line-clamp-1">{photo.caption}</p>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Matched in {selectedGuest.matchTime}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-white/50 text-center sm:text-left">
              Want this instant guest experience at your upcoming wedding, festival, or corporate gala?
            </div>
            <Link
              href={isLoggedIn ? '/dashboard' : '/pricing'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-display text-xs font-semibold tracking-wider transition-all shadow-lg shadow-violet-600/30"
            >
              <span>{isLoggedIn ? 'Go to Dashboard' : 'Explore Event Plans'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LiveDemoSection;
