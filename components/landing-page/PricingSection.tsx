'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';

interface Plan {
  id: string;
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  popular?: boolean;
  features: string[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Couples & Freelancers',
    price: '₹1,999',
    period: 'per month',
    description: 'Perfect for weddings, private parties, and solo event creators.',
    features: [
      'Up to 5 active events',
      '10,000 high-resolution photos',
      '6 Months live guest gallery access',
      'Live Big-Screen Photo Wall (TV / Projector)',
      'Guest Public Candid Contributions',
      'Instant QR Code join with 0 app downloads',
      'Unlimited guest AI selfie searches',
    ],
    cta: 'Get Starter Plan',
  },
  {
    id: 'pro',
    name: 'Studio Pro',
    badge: 'Most Popular • Best Value',
    popular: true,
    price: '₹4,999',
    period: 'per month',
    description: 'Built for active wedding studios, commercial photographers & agencies.',
    features: [
      'Up to 15 active events',
      '50,000 high-resolution photos',
      '1 Full Year live gallery retention',
      'Roopixo Studio Suite batch uploader',
      'Custom studio watermark & logo branding',
      'Geo-fenced QR distance protection',
      'Priority biometric AI indexing queue',
      'Lightroom & client proofing favorites',
    ],
    cta: 'Upgrade to Studio Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Custom Entitlements',
    price: 'Custom',
    period: 'tailored quota',
    description: 'Custom photo quotas, bespoke SLAs & custom entitlement toggles.',
    features: [
      'Unlimited events & multi-day festivals',
      '100,000+ photo quota',
      '1.5 Years (18 Months) gallery retention',
      'Custom feature toggle entitlements',
      'Instant Razorpay link activation',
      'White-label gallery & custom branding',
      'Dedicated WhatsApp VIP account manager',
    ],
    cta: 'Talk to Enterprise',
  },
];

export function PricingSection() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  return (
    <section id="landing-pricing" className="relative scroll-mt-20 py-24 md:py-32 px-4 sm:px-6 bg-[#080214] border-t border-white/[0.06] overflow-x-clip">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Event Pricing
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-white mb-4">
            Plans Built for Events of <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Any Scale</span>
          </h2>
          <p className="text-white/55 max-w-xl mx-auto text-base font-light leading-relaxed">
            All plans include AI face recognition, high-res guest downloads, and zero app downloads.
          </p>
        </motion.div>

        {/* Free Trial Banner */}
        <div className="flex justify-center mb-12">
          <div className="w-full max-w-2xl p-4 sm:p-4.5 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/15 via-indigo-600/10 to-violet-600/15 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-violet-600 text-xs font-bold text-white uppercase tracking-wider shrink-0">
                Free Trial
              </span>
              <p className="text-xs sm:text-sm text-white/85 font-light">
                Want to test first? <strong className="font-medium text-white">1 Event & 100 Photos</strong> with full AI face matching.
              </p>
            </div>
            <Link
              href={isLoggedIn ? '/pricing' : '/register'}
              className="text-xs font-semibold text-violet-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 group"
            >
              <span>{isLoggedIn ? 'View Details' : 'Start Free'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full">
          {PLANS.map((plan, index) => {
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'border-2 border-violet-500 bg-gradient-to-b from-violet-900/30 via-[#120826] to-[#0c051a] shadow-2xl shadow-violet-600/30 ring-1 ring-violet-400/40'
                    : 'border border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white shadow-md border border-violet-400/30 whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-white/50 font-light mb-6 min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="mb-6 pb-6 border-b border-white/10">
                    <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {plan.price}
                    </div>
                    <div className="text-xs text-white/45 font-light mt-1">
                      {plan.period}
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {plan.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5 text-xs text-white/75 font-light">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={isLoggedIn ? '/pricing' : plan.id === 'enterprise' ? '/contact' : '/register'}
                  className={`w-full py-3.5 px-4 rounded-xl font-display text-xs font-semibold tracking-wider text-center transition-all flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  <span>{isLoggedIn ? (plan.id === 'enterprise' ? 'Contact Sales' : 'Select Plan') : plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View Full Comparison Link */}
        <div className="mt-12 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            <span>View complete plan feature matrix and custom enterprise options</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
