'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Heart, Check, Sparkles, UploadCloud, Tv, ShieldCheck, Users, Zap, Layers } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';

export function AudienceSwitcher() {
  const [activeTab, setActiveTab] = useState<'photographers' | 'hosts'>('photographers');
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  return (
    <section id="landing-audience" className="relative scroll-mt-20 py-24 px-6 bg-[#090314] border-t border-white/[0.06] overflow-x-clip">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Built for Both Sides of the Lens
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-white mb-4">
            Tailored for <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Your Success</span>
          </h2>
          <p className="text-white/50 max-w-xl mx-auto text-base font-light">
            Whether you photograph 40 weddings a year or you are planning your own dream celebration.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <button
              onClick={() => setActiveTab('photographers')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-display text-xs sm:text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'photographers'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>For Photographers & Studios</span>
            </button>
            <button
              onClick={() => setActiveTab('hosts')}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-display text-xs sm:text-sm font-semibold tracking-wide transition-all ${
                activeTab === 'hosts'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>For Couples & Event Hosts</span>
            </button>
          </div>
        </div>

        {/* Tab Content Cards */}
        <AnimatePresence mode="wait">
          {activeTab === 'photographers' ? (
            <motion.div
              key="photographers"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="p-7 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Studio Suite Batch Upload</h3>
                  <p className="text-sm font-light text-white/55 leading-relaxed mb-6">
                    Drag and drop 10,000+ full-resolution photos directly into Roopixo Studio with zero throttling, background indexing, and real-time status.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-violet-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fast parallel uploads & retry</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Custom Watermark & Branding</h3>
                  <p className="text-sm font-light text-white/55 leading-relaxed mb-6">
                    Every photo downloaded or shared by guests can carry your studio watermark, logo, and social handles, turning every guest into a future client.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-violet-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Protect your creative copyright</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Extended Gallery Retention</h3>
                  <p className="text-sm font-light text-white/55 leading-relaxed mb-6">
                    Provide your couples with 6 months (Starter), 1 year (Pro), or 1.5+ years (Enterprise) of active guest galleries without recurring storage headaches.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-violet-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Guaranteed high-speed cloud retention</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="hosts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="p-7 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-5">
                    <Tv className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Live Big-Screen Photo Wall</h3>
                  <p className="text-sm font-light text-white/55 leading-relaxed mb-6">
                    Project live photos and guest selfies onto venue screens and stage LEDs in real-time with an embedded QR code for seamless guest participation.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-fuchsia-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero setup: runs on any smart TV or browser</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-5">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Guest Public Candid Contributions</h3>
                  <p className="text-sm font-light text-white/55 leading-relaxed mb-6">
                    Don’t miss any raw, fun moments. Allow guests to snap and share photos from their phones directly into the community stream with organizer moderation.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-fuchsia-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Crowdsource real emotional memories</span>
                </div>
              </div>

              <div className="p-7 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center text-fuchsia-400 mb-5">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Instant Selfie Delivery (0 App)</h3>
                  <p className="text-sm font-light text-white/55 leading-relaxed mb-6">
                    Guests don't need to install anything from the App Store. One scan of your table QR code, one quick selfie, and all their event pictures appear in seconds.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-fuchsia-300 font-medium">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Works seamlessly in Safari and Chrome</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default AudienceSwitcher;
