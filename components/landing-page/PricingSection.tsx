'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
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
    id: 'free',
    name: 'Free Trial',
    price: '₹0',
    period: 'forever',
    description: 'Perfect to test AI face matching for small personal gatherings.',
    features: [
      '1 Event included',
      '100 Photos upload limit',
      'Instant AI Face Matching',
      '7 Days live guest gallery access',
      'Mobile-optimized web gallery',
    ],
    cta: 'Try for Free',
  },
  {
    id: 'starter',
    name: 'Starter Plan',
    badge: 'Couples & Parties',
    price: '₹1,999',
    period: 'per month',
    description: 'Everything you need for weddings, birthdays, and private parties.',
    features: [
      'Up to 5 active events',
      '10,000 high-resolution photos',
      '6 Months live guest gallery access',
      'Live Big-Screen Photo Wall',
      'Guest Public Candid Contributions',
      'Instant QR Code join flow',
    ],
    cta: 'Get Starter Plan',
  },
  {
    id: 'pro',
    name: 'Pro Studio',
    badge: 'Most Popular',
    popular: true,
    price: '₹4,999',
    period: 'per month',
    description: 'Built for professional photographers and event planning agencies.',
    features: [
      'Up to 15 active events',
      '50,000 high-resolution photos',
      '1 Full Year live gallery retention',
      'Roopixo Studio Suite batch uploader',
      'Custom watermark & studio branding',
      'Geo-fenced QR distance protection',
      'Priority biometric processing',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Custom Tailored',
    price: 'Custom',
    period: 'tailored quota',
    description: 'Custom quotas and bespoke entitlement controls for large festivals.',
    features: [
      'Unlimited events & multi-day galas',
      '100,000+ photo quota',
      '1.5 Years extended gallery retention',
      'Custom feature toggle entitlements',
      'Instant Razorpay link activation',
      'Dedicated SLA & 24/7 account manager',
    ],
    cta: 'Contact for Enterprise',
  },
];

export function PricingSection() {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = !!user;

  return (
    <section id="landing-pricing" className="relative scroll-mt-20 py-24 md:py-32 px-6 bg-[#080214] border-t border-white/[0.06]">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Event Pricing
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-[-0.03em] text-white mb-5">
            Plans Built for Events of <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">Any Scale</span>
          </h2>
          <p className="text-white/55 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
            All plans include AI face recognition, high-res guest downloads, and zero app downloads.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, index) => {
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 ${
                  plan.popular
                    ? 'border-2 border-violet-500 bg-gradient-to-b from-violet-900/25 to-[#120826] shadow-2xl shadow-violet-600/25 ring-1 ring-violet-400/40'
                    : 'border border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500 text-white shadow-md">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-xs text-white/50 font-light mb-6 min-h-[36px]">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="font-display text-3xl sm:text-4xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    <span className="text-xs text-white/40 font-light">
                      /{plan.period}
                    </span>
                  </div>

                  <div className="pt-6 border-t border-white/10 space-y-3 mb-8">
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
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
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
