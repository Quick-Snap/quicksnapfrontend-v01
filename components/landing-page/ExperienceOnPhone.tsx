'use client';

import { motion } from 'framer-motion';
import { Smartphone, QrCode, Sparkles, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';

export function ExperienceOnPhone() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  // Point QR code directly to the public interactive demo
  const demoQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fwww.roopixo.com%2Fdemo&color=ffffff&bgcolor=15082a';

  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-white border-t border-zinc-200/80 dark:bg-[#06010f] dark:border-white/[0.06] overflow-hidden transition-colors duration-200">
      {/* Glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            <div className="mb-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 text-xs font-semibold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" />
              Zero Friction Mobile Web
            </div>
            <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white mb-4 sm:mb-6 leading-tight">
              Scan with Your Phone. <br />
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 dark:from-violet-400 dark:via-fuchsia-300 dark:to-amber-300 bg-clip-text text-transparent">
                Experience It Right Now.
              </span>
            </h2>
            <p className="text-zinc-600 dark:text-white/60 text-sm sm:text-base md:text-lg font-normal dark:font-light leading-relaxed mb-6 sm:mb-8 max-w-xl">
              Point your smartphone camera at the QR code. No App Store visit. No 150MB download. Guests join in under 3 seconds directly in Safari or Chrome.
            </p>

            {/* Direct Mobile Launch Pill for phones */}
            <div className="block lg:hidden mb-6 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-transparent border border-violet-500/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-white">Browsing on your phone?</p>
                  <p className="text-[11px] text-zinc-500 dark:text-white/50">Experience the live guest flow directly in your browser.</p>
                </div>
                <Link
                  href="/demo"
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition-all"
                >
                  <span>Try Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Instant Table QR Scan</h4>
                  <p className="text-xs text-zinc-500 dark:text-white/50 font-normal dark:font-light">Guests simply point their default phone camera at table tents or venue posters.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">One Selfie Matches All Photos</h4>
                  <p className="text-xs text-zinc-500 dark:text-white/50 font-normal dark:font-light">No tedious manual searching through 3,000 unorganized event photos.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Live Candid Uploads & Wall Projection</h4>
                  <p className="text-xs text-zinc-500 dark:text-white/50 font-normal dark:font-light">Guests snap real-time moments that project live onto the reception screens.</p>
                </div>
              </div>
            </div>

            <Link
              href={isLoggedIn ? '/dashboard' : '/pricing'}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-display text-sm font-semibold tracking-wider transition-all shadow-xl shadow-violet-600/25"
            >
              <span>{isLoggedIn ? 'Go to Dashboard' : 'Host Your Event Today'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Right Phone & QR Code Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="lg:col-span-5 flex justify-center"
          >
            <div className="relative p-7 sm:p-9 rounded-3xl border border-zinc-200/90 bg-white/90 shadow-xl dark:border-white/10 dark:bg-gradient-to-b dark:from-white/[0.05] dark:to-white/[0.01] backdrop-blur-2xl dark:shadow-2xl flex flex-col items-center text-center max-w-sm w-full transition-colors duration-200">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300 text-xs font-semibold mb-6 border border-violet-500/20 dark:border-violet-500/30">
                <QrCode className="w-3.5 h-3.5" />
                <span>Live Event Demo QR</span>
              </div>

              {/* QR Code Container with animated scanner effect */}
              <div className="relative p-4 rounded-2xl bg-zinc-100/90 border border-violet-400/30 dark:bg-[#15082a] dark:border-violet-500/40 shadow-inner mb-6 group">
                <img
                  src={demoQrUrl}
                  alt="Scan Roopixo demo on phone"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain"
                />
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent shadow-[0_0_12px_#a855f7] animate-pulse pointer-events-none" />
              </div>

              <p className="text-xs font-medium text-zinc-900 dark:text-white mb-1">
                Scan with your phone camera
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-white/45 font-medium dark:font-light">
                Opens live Roopixo mobile guest experience instantly
              </p>

              <Link
                href="/demo"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 underline underline-offset-4 transition-colors"
              >
                <span>Or open interactive demo in browser</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ExperienceOnPhone;
