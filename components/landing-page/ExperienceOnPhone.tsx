'use client';

import { motion } from 'framer-motion';
import { Smartphone, QrCode, Sparkles, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';

export function ExperienceOnPhone() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  // Use a reliable QR code generator URL pointing to live app
  const demoQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fwww.roopixo.com%2Fevents&color=ffffff&bgcolor=15082a';

  return (
    <section className="relative py-24 px-6 bg-[#06010f] border-t border-white/[0.06] overflow-hidden">
      {/* Glow */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-semibold uppercase tracking-wider">
              <Smartphone className="w-3.5 h-3.5" />
              Zero Friction Mobile Web
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-white mb-6">
              Scan with Your Phone. <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
                Experience It Right Now.
              </span>
            </h2>
            <p className="text-white/60 text-base md:text-lg font-light leading-relaxed mb-8 max-w-xl">
              Point your smartphone camera at the QR code on the right. No App Store visit. No 150MB download. Guests join in under 3 seconds directly in Safari or Chrome.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Instant Table QR Scan</h4>
                  <p className="text-xs text-white/50 font-light">Guests simply point their default phone camera at table tents or venue posters.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">One Selfie Matches All Photos</h4>
                  <p className="text-xs text-white/50 font-light">No tedious manual searching through 3,000 unorganized event photos.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Candid Uploads & Wall Projection</h4>
                  <p className="text-xs text-white/50 font-light">Guests snap real-time moments that project live onto the reception screens.</p>
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
            <div className="relative p-7 sm:p-9 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center max-w-sm w-full">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 text-violet-300 text-xs font-semibold mb-6 border border-violet-500/30">
                <QrCode className="w-3.5 h-3.5" />
                <span>Live Event Demo QR</span>
              </div>

              {/* QR Code Container with animated scanner effect */}
              <div className="relative p-4 rounded-2xl bg-[#15082a] border border-violet-500/40 shadow-inner mb-6 group">
                <img
                  src={demoQrUrl}
                  alt="Scan Roopixo demo on phone"
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain"
                />
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_12px_#a855f7] animate-pulse pointer-events-none" />
              </div>

              <p className="text-xs font-medium text-white mb-1">
                Scan with your phone camera
              </p>
              <p className="text-[11px] text-white/45 font-light">
                Opens live Roopixo mobile guest experience instantly
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ExperienceOnPhone;
