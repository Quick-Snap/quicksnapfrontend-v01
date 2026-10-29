'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Camera,
  Crown,
  Star,
  FolderSync,
  Layers,
  Infinity as InfinityIcon,
  HelpCircle,
  Clock,
  Heart,
  Bookmark
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';

type Currency = 'INR' | 'USD';
type BillingCycle = 'annual' | 'monthly';

interface PricingTier {
  id: 'starter' | 'pro' | 'enterprise';
  name: string;
  badge?: string;
  popular?: boolean;
  tagline: string;
  photoLimit: string;
  price: {
    INR: {
      annualTotal: string;
      annualPerMonth: string;
      monthly: string;
    };
    USD: {
      annualTotal: string;
      annualPerMonth: string;
      monthly: string;
    };
  };
  cumulativeHeader?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal for freelance photographers & solo creators delivering modern event galleries.',
    photoLimit: '30,000 Photos / year',
    price: {
      INR: {
        annualTotal: '₹2,999',
        annualPerMonth: '₹249',
        monthly: '₹349'
      },
      USD: {
        annualTotal: '$36',
        annualPerMonth: '$3.00',
        monthly: '$4.50'
      }
    },
    features: [
      '30,000 Photos Annual Allowance',
      'Unlimited Events & Galleries',
      'Unlimited Guest AI Face Searches',
      'AuraFace-v1 Lightning Matching (<1s)',
      'Client Proofing: ❤️ Album Favorites & 🔖 Keepers',
      'Custom Watermark Protection (Included)',
      'Multi-Ceremony Event Tabs (Haldi, Sangeet, etc.)',
      '6 Months Cloud Storage per event',
      'QR Code Event Join & Instant Guest Delivery'
    ],
    ctaLabel: 'Get Started with Starter',
    ctaHref: '/register?plan=starter'
  },
  {
    id: 'pro',
    name: 'Studio Pro',
    badge: 'MOST POPULAR • BEST VALUE',
    popular: true,
    tagline: 'For active wedding studios & commercial photographers doing 2 to 4 shoots a month.',
    photoLimit: '1,50,000 Photos / year (1.5 Lakh)',
    price: {
      INR: {
        annualTotal: '₹7,999',
        annualPerMonth: '₹666',
        monthly: '₹899'
      },
      USD: {
        annualTotal: '$96',
        annualPerMonth: '$8.00',
        monthly: '$11.00'
      }
    },
    cumulativeHeader: '✨ EVERYTHING IN STARTER, PLUS:',
    features: [
      '1,50,000 Photos Annual Allowance (1.5 Lakh)',
      'Google Drive Background Auto-Sync',
      'Custom Studio Logo & Branding on Galleries',
      '2 Photographer Team Member Logins',
      '1 Year Cloud Storage per event',
      'Uncompressed Full-Resolution RAW Downloads',
      'Instant WebP & High-Res Dual Delivery',
      'Studio Client Selections Dashboard & CSV Export',
      'Priority Email & Live Chat Support'
    ],
    ctaLabel: 'Choose Studio Pro',
    ctaHref: '/register?plan=pro'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'HIGH-VOLUME PRODUCTION',
    tagline: 'For high-volume wedding production houses, collegiate fests & event agencies.',
    photoLimit: '3,50,000 Photos / year (3.5 Lakh)',
    price: {
      INR: {
        annualTotal: '₹19,999',
        annualPerMonth: '₹1,666',
        monthly: '₹2,199'
      },
      USD: {
        annualTotal: '$240',
        annualPerMonth: '$20.00',
        monthly: '$26.50'
      }
    },
    cumulativeHeader: '👑 EVERYTHING IN STUDIO PRO, PLUS:',
    features: [
      '3,50,000 Photos Annual Allowance (3.5 Lakh)',
      'Up to 5 Team Photographer Accounts',
      'White-Label Custom Subdomain (gallery.yourstudio.com)',
      'Dual Cloud Sync: Google Drive + Google Photos',
      '2 Years Cloud Archival Storage per event',
      'Priority VIP AI Indexing Queue',
      'Custom Watermark Presets per event',
      'Dedicated Account Manager & WhatsApp Onboarding',
      'Custom SLA & Invoicing Support'
    ],
    ctaLabel: 'Choose Enterprise',
    ctaHref: '/register?plan=enterprise'
  }
];

const COMPARISON_ROWS = [
  {
    category: 'Capacity & Events',
    items: [
      { name: 'Annual Photos Limit', starter: '30,000', pro: '1,50,000 (1.5 Lakh)', enterprise: '3,50,000 (3.5 Lakh)' },
      { name: 'Active Events', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Cloud Storage Duration', starter: '6 Months / event', pro: '1 Year / event', enterprise: '2 Years / event' },
      { name: 'Full-Res RAW & WebP Downloads', starter: 'WebP Optimized', pro: 'Raw + WebP', enterprise: 'Raw + WebP' }
    ]
  },
  {
    category: 'AI Face Recognition',
    items: [
      { name: 'Guest Selfie Searches', starter: 'Unlimited (No extra fee)', pro: 'Unlimited (No extra fee)', enterprise: 'Unlimited (No extra fee)' },
      { name: 'AI Engine', starter: 'AuraFace-v1 (Apache 2.0)', pro: 'AuraFace-v1 (Apache 2.0)', enterprise: 'AuraFace-v1 (Priority Queue)' },
      { name: 'Face Match Speed', starter: '<10ms Vector Matching', pro: '<10ms Vector Matching', enterprise: '<5ms VIP Pipeline' },
      { name: 'Multi-Face Group Photos', starter: 'Yes (Up to 100 faces)', pro: 'Yes (Up to 100 faces)', enterprise: 'Yes (Up to 100 faces)' }
    ]
  },
  {
    category: 'Studio & Client Proofing',
    items: [
      { name: 'Client Proofing Suite (❤️ & 🔖)', starter: 'Included Free', pro: 'Included Free', enterprise: 'Included Free' },
      { name: 'Custom Watermarking', starter: 'Standard Watermark', pro: 'Custom Studio Watermark', enterprise: 'Unlimited Presets' },
      { name: 'Multi-Ceremony Event Tabs', starter: 'Yes', pro: 'Yes', enterprise: 'Yes' },
      { name: 'Selection CSV / File Export', starter: 'Basic', pro: 'Advanced Studio Export', enterprise: 'Advanced Studio Export' }
    ]
  },
  {
    category: 'Automation & Collaboration',
    items: [
      { name: 'Google Drive Auto-Sync', starter: '—', pro: 'Included', enterprise: 'Included' },
      { name: 'Google Photos Direct Sync', starter: '—', pro: '—', enterprise: 'Included' },
      { name: 'Team Photographer Logins', starter: '1 Login', pro: '2 Logins', enterprise: 'Up to 5 Logins' },
      { name: 'Studio Logo & Branding', starter: 'Roopixo Powered', pro: 'Custom Studio Brand', enterprise: 'Full White-Label' },
      { name: 'Custom Domain / CNAME', starter: '—', pro: '—', enterprise: 'gallery.yourstudio.com' }
    ]
  },
  {
    category: 'Support & Onboarding',
    items: [
      { name: 'Support Channel', starter: 'Email Support', pro: 'Priority Live Chat & Email', enterprise: 'Dedicated WhatsApp Manager' },
      { name: 'Onboarding Assistance', starter: 'Documentation & Guides', pro: 'Priority Onboarding', enterprise: '1-on-1 VIP Session' }
    ]
  }
];

const FAQS = [
  {
    q: 'Are guest selfie searches really unlimited?',
    a: 'Yes, 100% unlimited. Unlike other platforms that meter guest face scans or charge per attendee, Roopixo runs on our self-hosted AuraFace-v1 microservice. You never pay a single rupee extra when 100 or 1,000 guests find their photos.'
  },
  {
    q: 'What happens if I cross my annual photo allowance?',
    a: 'You can easily purchase photo top-up packs or upgrade to the next tier anytime with prorated billing. Your existing galleries and client links will never be interrupted or locked.'
  },
  {
    q: 'How does Google Drive Auto-Sync work?',
    a: 'Simply connect your Google Drive folder URL in your event settings. As your team dumps photos into Drive from camera cards, Roopixo detects new files in the background, compresses them, runs AI face indexing, and delivers them live to guests automatically.'
  },
  {
    q: 'Do guests or clients need to download a mobile app?',
    a: 'No app download is needed. Guests simply scan your event QR code or open your gallery link on any phone browser, snap a quick selfie, and see all their photos matched in under a second.'
  },
  {
    q: 'Are client proofing (❤️) and watermarking charged as add-ons?',
    a: 'No! Unlike other platforms that charge ₹3,000 to ₹5,000 extra for watermarking and proofing, all these professional tools are completely included in your plan at zero additional cost.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major Indian payment methods (UPI, GPay, PhonePe, Paytm, NetBanking, Credit & Debit Cards) as well as international Visa, MasterCard, and American Express cards.'
  }
];

export default function PricingPage() {
  const [currency, setCurrency] = useState<Currency>('INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isAnnual = billingCycle === 'annual';

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500 selection:text-white">
      {/* Top Background Glow Accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[500px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-2/3 -left-40 h-[400px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Standalone Navigation Header */}
      <header className="relative z-30 border-b border-white/10 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <BrandLogo href="/" size="md" tone="light" />

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/#features"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Features
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-semibold text-violet-400 transition"
            >
              Pricing
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-300 transition hover:text-white hover:bg-white/5"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-indigo-500"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 mx-auto max-w-7xl px-6 pt-16 pb-24 sm:px-8 sm:pt-20">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            Transparent Pricing • Zero Paid Add-Ons
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Simple, Predictable Plans for Modern Photographers
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Deliver instant AI face-matching galleries to wedding and event guests. All professional features—client favorites, watermarks, and multi-ceremony tabs—are 100% included.
          </p>
        </div>

        {/* Dual Interactive Switchers: Billing Cycle + Currency */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          {/* Annual vs Monthly Toggle */}
          <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`relative flex items-center gap-2 rounded-xl px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                isAnnual
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Annual Billing
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                Save 25%
              </span>
            </button>

            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                !isAnnual
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-md shadow-inner">
            <button
              type="button"
              onClick={() => setCurrency('INR')}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                currency === 'INR'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              INR (₹)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                currency === 'USD'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 items-stretch">
          {TIERS.map((tier) => {
            const priceData = tier.price[currency];
            const displayPrice = isAnnual ? priceData.annualPerMonth : priceData.monthly;
            const billingSubtext = isAnnual
              ? `billed ${priceData.annualTotal} annually`
              : 'billed month-to-month';

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
                  tier.popular
                    ? 'border-violet-500/80 bg-gradient-to-b from-violet-950/40 via-[#131022] to-[#0c0a17] shadow-2xl shadow-violet-500/20 ring-1 ring-violet-500/50 lg:-translate-y-2'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]'
                }`}
              >
                {/* Popular / Tier Badge */}
                {tier.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1 text-[11px] font-bold tracking-wider text-white shadow-lg shadow-violet-500/30 uppercase">
                      <Star className="h-3 w-3 fill-current" />
                      {tier.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Tier Title & Tagline */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">{tier.name}</h3>
                    <p className="text-xs text-zinc-400 min-h-[36px] leading-relaxed">
                      {tier.tagline}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="mt-6 border-y border-white/10 py-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl sm:text-5xl font-extrabold text-white">
                        {displayPrice}
                      </span>
                      <span className="text-sm font-medium text-zinc-400">/ month</span>
                    </div>
                    <p className="mt-1 text-xs text-violet-300 font-medium">
                      {billingSubtext}
                    </p>

                    {/* Photo Limit Highlight Pill */}
                    <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200">
                      <Camera className="h-3.5 w-3.5 text-violet-400" />
                      {tier.photoLimit}
                    </div>
                  </div>

                  {/* Cumulative Header (if applicable) */}
                  {tier.cumulativeHeader && (
                    <div className="mt-6 text-[11px] font-bold tracking-wider text-violet-400 uppercase">
                      {tier.cumulativeHeader}
                    </div>
                  )}

                  {/* Features List */}
                  <ul className={`space-y-3 text-xs sm:text-sm text-zinc-300 ${tier.cumulativeHeader ? 'mt-3' : 'mt-6'}`}>
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card CTA */}
                <div className="mt-8 pt-4">
                  <Link
                    href={tier.ctaHref}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${
                      tier.popular
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500'
                        : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {tier.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="mt-2 text-center text-[11px] text-zinc-500">
                    Instant setup • Cancel anytime
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Value Prop Banner: Zero Hidden Fees */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-r from-violet-950/30 via-indigo-950/20 to-purple-950/30 p-8 text-center backdrop-blur-md">
          <div className="mx-auto max-w-3xl space-y-3">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-violet-400" />
              What You See Is What You Pay — No Sneaky Add-On Charges
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Unlike other platforms that charge ₹3,000 for proofing, ₹3,000 for watermarking, and ₹5,000 for branding, Roopixo includes everything in the plan. Plus, our self-hosted AuraFace-v1 AI delivers <strong>unlimited guest face searches</strong> at zero marginal cost.
            </p>
          </div>
        </div>

        {/* Comprehensive Feature Comparison Matrix */}
        <section className="mt-24">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Detailed Plan Comparison
            </h2>
            <p className="text-sm text-zinc-400">
              Compare features and choose the exact tier that fits your studio volume.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-zinc-400">
                  <th className="py-4 px-6 font-semibold">Feature</th>
                  <th className="py-4 px-4 text-center font-semibold text-white">Starter</th>
                  <th className="py-4 px-4 text-center font-semibold text-violet-400">Studio Pro</th>
                  <th className="py-4 px-4 text-center font-semibold text-indigo-400">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_ROWS.map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <tr className="bg-white/[0.04]">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-violet-300"
                      >
                        {section.category}
                      </td>
                    </tr>
                    {section.items.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-6 font-medium text-zinc-200">{row.name}</td>
                        <td className="py-3.5 px-4 text-center text-zinc-400">
                          {row.starter === 'Yes' || row.starter === 'Included' || row.starter === 'Included Free' ? (
                            <span className="inline-flex items-center text-emerald-400 font-semibold">
                              <Check className="h-4 w-4 mr-1" /> {row.starter}
                            </span>
                          ) : (
                            row.starter
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-zinc-300 font-semibold bg-violet-950/10">
                          {row.pro === 'Yes' || row.pro === 'Included' || row.pro === 'Included Free' ? (
                            <span className="inline-flex items-center text-emerald-400 font-semibold">
                              <Check className="h-4 w-4 mr-1" /> {row.pro}
                            </span>
                          ) : (
                            row.pro
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-zinc-300">
                          {row.enterprise === 'Yes' || row.enterprise === 'Included' || row.enterprise === 'Included Free' ? (
                            <span className="inline-flex items-center text-emerald-400 font-semibold">
                              <Check className="h-4 w-4 mr-1" /> {row.enterprise}
                            </span>
                          ) : (
                            row.enterprise
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="mt-24 max-w-4xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-violet-400" />
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400">
              Everything you need to know about Roopixo plans, limits, and AI delivery.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-6 text-left"
                  >
                    <span className="text-sm sm:text-base font-semibold text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-violet-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom Conversion CTA */}
        <section className="mt-24 rounded-3xl border border-violet-500/40 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-2xl shadow-violet-500/20">
          <div className="mx-auto max-w-2xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Supercharge Your Event Photography?
            </h2>
            <p className="text-sm sm:text-base text-violet-100">
              Join forward-thinking studios delivering magic to guests with instant AI face-matching. Zero per-search fees, zero hidden add-ons.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register?plan=pro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-violet-900 shadow-lg transition hover:bg-violet-50"
              >
                Start with Studio Pro
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition"
              >
                Talk to Sales
              </Link>
            </div>
            <p className="text-xs text-violet-200 pt-2">
              No credit card required for free trial • Cancel anytime with 1 click
            </p>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-[#070709] py-12 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row sm:px-8">
          <BrandLogo href="/" size="sm" tone="light" />

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/terms" className="hover:text-zinc-300 transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition">
              Privacy Policy
            </Link>
            <Link href="/contact" className="hover:text-zinc-300 transition">
              Contact & Support
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-300 transition">
              Client Portal
            </Link>
          </div>

          <p>© {new Date().getFullYear()} Roopixo Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
