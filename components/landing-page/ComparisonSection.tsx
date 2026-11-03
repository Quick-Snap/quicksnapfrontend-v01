'use client';

import { motion } from 'framer-motion';
import { Sparkles, Check, X, Zap, Smartphone, Tv, ShieldCheck, HeartHandshake } from 'lucide-react';

interface ComparisonRow {
  aspect: string;
  driveWhatsApp: string;
  roopixo: string;
  icon: React.ReactNode;
}

const COMPARISONS: ComparisonRow[] = [
  {
    aspect: 'Finding Your Photos',
    driveWhatsApp: 'Guests scroll through 3,000+ unorganized photos for hours. Most give up.',
    roopixo: 'Snap 1 quick selfie and see every photo you appear in across the entire event in under 1 second.',
    icon: <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />,
  },
  {
    aspect: 'Photo Quality & Resolution',
    driveWhatsApp: 'WhatsApp heavily compresses photos by up to 80%. Google Drive requires complex access permissions.',
    roopixo: 'Crystal-clear original RAW and high-res WebP downloads with zero compression loss.',
    icon: <Smartphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
  },
  {
    aspect: 'Big-Screen Live Event Experience',
    driveWhatsApp: 'Not possible. Static cloud storage folders only.',
    roopixo: 'Built-in Live Photo Wall for venue TVs & LED projectors with real-time streaming and QR join.',
    icon: <Tv className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />,
  },
  {
    aspect: 'Crowdsourced Guest Candids',
    driveWhatsApp: 'Chaotic group chat dumps with duplicate files, memes, and zero moderation.',
    roopixo: 'Dedicated guest candid uploads with organizer moderation and instant big-screen sync.',
    icon: <HeartHandshake className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    aspect: 'Studio Branding & Proofing',
    driveWhatsApp: 'Zero branding. Clients send messy WhatsApp text lists with file numbers.',
    roopixo: 'Custom studio watermarks, logo branding, and 1-click Adobe Lightroom Classic export.',
    icon: <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
  },
];

export function ComparisonSection() {
  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-zinc-50 border-t border-zinc-200/80 dark:bg-[#080214] dark:border-white/[0.06] overflow-hidden transition-colors duration-200">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-violet-600/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="mb-3.5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            The Modern Event Standard
          </div>
          <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-zinc-900 dark:text-white mb-3 sm:mb-5 leading-tight">
            Why Leading Studios & Couples Choose <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 dark:from-violet-400 dark:via-fuchsia-300 dark:to-indigo-300 bg-clip-text text-transparent">Roopixo</span>
          </h2>
          <p className="text-zinc-600 dark:text-white/60 max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-normal dark:font-light leading-relaxed">
            Stop sending unorganized Google Drive folders and compressed WhatsApp links. Give your guests and clients a modern, interactive experience.
          </p>
        </motion.div>

        {/* ========================================================================= */}
        {/* MOBILE CARDS VIEW (Visible strictly on small mobile screens < sm)          */}
        {/* ========================================================================= */}
        <div className="block sm:hidden space-y-4">
          {COMPARISONS.map((row, idx) => (
            <motion.div
              key={row.aspect}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03] backdrop-blur-md"
            >
              {/* Feature Title */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-100 dark:border-white/5">
                <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200/70 dark:bg-white/[0.06] dark:border-white/10 shrink-0">
                  {row.icon}
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {row.aspect}
                </h3>
              </div>

              {/* Side-by-Side Comparison Blocks */}
              <div className="space-y-2.5 pt-3">
                {/* Traditional / Old Way */}
                <div className="p-3 rounded-xl bg-red-50/70 border border-red-200/60 dark:bg-red-950/20 dark:border-red-500/20">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-700 dark:text-red-400 mb-1 tracking-wide uppercase">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Google Drive / WhatsApp</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-5">
                    {row.driveWhatsApp}
                  </p>
                </div>

                {/* Roopixo AI Way */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-violet-50/90 via-fuchsia-50/40 to-transparent border border-violet-300/80 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-transparent dark:border-violet-500/30 shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-800 dark:text-violet-300 mb-1 tracking-wide uppercase">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span>Roopixo AI Experience</span>
                  </div>
                  <p className="text-xs font-medium text-zinc-850 dark:text-white/95 leading-relaxed pl-5">
                    {row.roopixo}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP & TABLET TABLE VIEW (Visible on sm: and up)                       */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true }}
          className="hidden sm:block rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-white/10 dark:bg-white/[0.02] backdrop-blur-xl overflow-hidden dark:shadow-2xl transition-colors duration-200"
        >
          {/* Header row */}
          <div className="grid grid-cols-12 bg-zinc-100/70 border-b border-zinc-200 dark:bg-white/[0.03] dark:border-white/10 p-5 sm:p-6 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            <div className="col-span-4 text-zinc-500 dark:text-white/50">Feature & Experience</div>
            <div className="col-span-4 text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              Google Drive / WhatsApp
            </div>
            <div className="col-span-4 text-violet-600 dark:text-violet-300 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Roopixo AI
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-200/80 dark:divide-white/[0.06]">
            {COMPARISONS.map((row) => (
              <div
                key={row.aspect}
                className="grid grid-cols-12 p-5 sm:p-6 items-center gap-4 hover:bg-zinc-50/80 dark:hover:bg-white/[0.02] transition-colors"
              >
                {/* Aspect Label */}
                <div className="col-span-4 flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-white/[0.05] dark:border-white/10 shrink-0">
                    {row.icon}
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-white">
                    {row.aspect}
                  </span>
                </div>

                {/* Old Way */}
                <div className="col-span-4 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                    <X className="w-3 h-3" />
                  </div>
                  <span className="text-xs sm:text-sm font-normal dark:font-light text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {row.driveWhatsApp}
                  </span>
                </div>

                {/* Roopixo Way */}
                <div className="col-span-4 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-white/90 leading-relaxed">
                    {row.roopixo}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default ComparisonSection;
