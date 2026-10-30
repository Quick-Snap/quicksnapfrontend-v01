'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle2, PartyPopper, Camera } from 'lucide-react';
import Link from 'next/link';

export function PricingSection() {
  return (
    <section id="landing-pricing" className="relative scroll-mt-20 py-24 md:py-32 px-4 sm:px-6 bg-[#080214] border-t border-white/[0.06] overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 w-full text-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Event Pricing
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-white mb-5">
            Plans for Hosts, Creators & Studios of <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Any Scale</span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed">
            Choose a one-time pass for your wedding or private celebration, or subscribe for high-volume studio shoots. Zero per-guest fees.
          </p>
        </motion.div>

        {/* ROW 1: Individual & Retail Event Passes (One-Time & Free Trial) */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px bg-white/10 flex-1 max-w-[120px]" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-300 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20">
              <PartyPopper className="w-3.5 h-3.5 text-fuchsia-400" />
              For Couples, Families & One-Time Events
            </span>
            <div className="h-px bg-white/10 flex-1 max-w-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left"
          >
            {/* Free Trial */}
            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/[0.08] backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">Zero Risk • 100% Free</div>
                <h3 className="text-xl font-bold text-white mb-2">14-Day Free Trial</h3>
                <div className="text-3xl font-extrabold text-white mb-1">
                  ₹0 <span className="text-xs text-white/50 font-normal">/ test event</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mb-3">
                  No credit card required
                </div>
                <ul className="space-y-2 text-xs text-white/70 font-light mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1 Live Test Event Gallery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Up to 200 High-Res Photos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Instant AI Selfie Match Finder (&lt;1s)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>14 Days Full Feature Access</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Single Event Pass */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1">Single Wedding or Party</div>
                <h3 className="text-xl font-bold text-white mb-2">Single Event Pass</h3>
                <div className="text-3xl font-extrabold text-white mb-1">
                  ₹799 <span className="text-xs text-white/50 font-normal">one-time</span>
                </div>
                <div className="text-[11px] text-white/45 font-medium mb-3">
                  Flat fee • No recurring charges
                </div>
                <ul className="space-y-2 text-xs text-white/70 font-light mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Up to 2,500 High-Res Photos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1 Dedicated Event Gallery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited Guest AI Selfie Searches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>6 Months Live Guest Gallery Access</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Grand Celebration Pass */}
            <div className="p-6 rounded-2xl border border-fuchsia-500/40 bg-gradient-to-b from-fuchsia-950/20 via-[#140824] to-[#0c051a] shadow-lg shadow-fuchsia-600/10 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300 mb-1">Multi-Day Big Wedding / Fest</div>
                <h3 className="text-xl font-bold text-white mb-2">Grand Celebration</h3>
                <div className="text-3xl font-extrabold text-white mb-1">
                  ₹1,499 <span className="text-xs text-white/50 font-normal">one-time</span>
                </div>
                <div className="text-[11px] text-fuchsia-300/80 font-medium mb-3">
                  Flat fee • Covers multi-day ceremonies
                </div>
                <ul className="space-y-2 text-xs text-white/75 font-light mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Up to 6,000 High-Res Photos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Up to 2 Events or 1 Multi-Day Wedding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1 Full Year Live Guest Gallery Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Crowdsourced Guest Candid Uploads</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ROW 2: Photographer & Studio Subscriptions */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px bg-white/10 flex-1 max-w-[120px]" />
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
              <Camera className="w-3.5 h-3.5 text-violet-400" />
              For Photographers, Studios & Production Houses
            </span>
            <div className="h-px bg-white/10 flex-1 max-w-[120px]" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left"
          >
            {/* Starter Pro */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-400 mb-1">Freelancers & Creators</div>
                <h3 className="text-xl font-bold text-white mb-2">Starter Pro</h3>
                <div className="text-3xl font-extrabold text-white mb-1">
                  ₹249 <span className="text-xs text-white/50 font-normal">/ month</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mb-3">
                  billed annually (₹2,999/yr)
                </div>
                <ul className="space-y-2 text-xs text-white/70 font-light mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>30,000 Photos / year</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Interactive Big-Screen Live Wall</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Guest Candid Photo Contributions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>6 Months Live Guest Gallery Access</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Studio Pro */}
            <div className="p-6 rounded-2xl border-2 border-violet-500 bg-gradient-to-b from-violet-900/30 via-[#120826] to-[#0c051a] shadow-xl shadow-violet-600/25 relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white shadow-md border border-violet-400/40">
                Most Popular
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-violet-300 mb-1">Active Wedding Studios</div>
                <h3 className="text-xl font-bold text-white mb-2">Studio Pro</h3>
                <div className="text-3xl font-extrabold text-white mb-1">
                  ₹666 <span className="text-xs text-white/50 font-normal">/ month</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mb-3">
                  billed annually (₹7,999/yr) • Save 25%
                </div>
                <ul className="space-y-2 text-xs text-white/75 font-light mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1,50,000 Photos / year (1.5 Lakh)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Custom Studio Watermark & Branding</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Google Drive Background Auto-Sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1 Full Year Live Gallery Retention</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">Production Houses & Fests</div>
                <h3 className="text-xl font-bold text-white mb-2">Enterprise</h3>
                <div className="text-3xl font-extrabold text-white mb-1">
                  ₹1,666 <span className="text-xs text-white/50 font-normal">/ month</span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium mb-3">
                  billed annually (₹19,999/yr)
                </div>
                <ul className="space-y-2 text-xs text-white/70 font-light mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>3,50,000+ Photos / year (Custom Quota)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>White-Label Custom Subdomain & Wall</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>1.5 Years (18 Months) Gallery Retention</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Custom Feature Entitlements & Razorpay</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>

        {/* BIG Prominent Action Button to /pricing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-4"
        >
          <Link
            href="/pricing"
            className="group inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:via-indigo-500 hover:to-violet-500 text-white font-display text-base font-bold tracking-wide shadow-2xl shadow-violet-600/40 hover:shadow-violet-600/60 transition-all border border-violet-400/40 hover:scale-[1.02]"
          >
            <span>Explore All Pricing Plans & One-Time Passes</span>
            <ArrowRight className="w-5 h-5 text-violet-200 group-hover:translate-x-1.5 transition-transform" />
          </Link>

          <p className="text-xs text-white/45 font-light">
            Includes INR / USD currency switch, monthly billing options, and custom organizer entitlements.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingSection;
