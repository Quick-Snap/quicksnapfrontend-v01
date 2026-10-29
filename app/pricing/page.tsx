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
  HelpCircle,
  Clock,
  Heart,
  Bookmark,
  Calendar,
  PartyPopper,
  Briefcase,
  Users
} from 'lucide-react';
import { BrandLogo } from '@/components/BrandLogo';
import { useAuth } from '@/contexts/AuthContext';
import UpgradeModal from '@/components/UpgradeModal';

type Currency = 'INR' | 'USD';
type BillingCycle = 'annual' | 'monthly';
type PricingCategory = 'studio' | 'retail';

interface PricingTier {
  id: string;
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

interface SingleEventPass {
  id: string;
  name: string;
  badge?: string;
  popular?: boolean;
  tagline: string;
  photoLimit: string;
  price: {
    INR: string;
    USD: string;
  };
  eventCount: string;
  galleryDuration: string;
  cumulativeHeader?: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
}

// 1. Studio & Professional Subscription Tiers
const STUDIO_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Pro',
    tagline: 'Ideal for freelance photographers & solo creators delivering modern AI event galleries.',
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
      '30,000 Photos / year (approx 15-20 events)',
      'Unlimited Events & Galleries',
      'Unlimited Guest AI Face Searches (Zero per-guest fees)',
      'Instant AI Selfie Photo Discovery (<1 second)',
      'Client Proofing: ❤️ Album Favorites & 🔖 Keepers',
      'Adobe Lightroom Selection Export (1-click copy filenames)',
      '1 Full Year Live Guest Gallery Access',
      'QR Code Event Join & Instant Downloads'
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
    cumulativeHeader: '✨ EVERYTHING IN STARTER PRO, PLUS:',
    features: [
      '1,50,000 Photos / year (1.5 Lakh - approx 50-70 weddings)',
      'Custom Studio Watermark (Text & Logo with Opacity & Placement)',
      'Google Drive Background Auto-Sync (Dump camera files & auto-deliver)',
      'Custom Studio Logo & Branding on all Galleries',
      '2 Team Photographer / Assistant Logins',
      '2 Full Years Live Guest Gallery Access',
      'Original RAW + WebP High-Res Downloads',
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
      '3,50,000 Photos / year (3.5 Lakh - custom quota available on request)',
      'Up to 5 Team Photographer Accounts',
      'White-Label Custom Subdomain (gallery.yourstudio.com)',
      '3 Full Years Live Guest Gallery Access',
      'Dedicated WhatsApp Account Manager & VIP Setup',
      'Fast-Track Priority AI Indexing Queue'
    ],
    ctaLabel: 'Choose Enterprise',
    ctaHref: '/register?plan=enterprise'
  }
];

// 2. Individual & Retail One-Time Event Passes
const RETAIL_PASSES: SingleEventPass[] = [
  {
    id: 'single-event',
    name: 'Single Event Pass',
    badge: 'ONE-TIME PAYMENT',
    tagline: 'Perfect for a single wedding, birthday party, anniversary, or college reunion.',
    photoLimit: 'Up to 2,500 Photos',
    eventCount: '1 Event Gallery',
    galleryDuration: '6 Months Live Gallery',
    price: {
      INR: '₹799',
      USD: '$9.99'
    },
    features: [
      'Up to 2,500 High-Res Photos',
      'Unlimited Guest AI Face Searches (Zero per-guest limits)',
      'Instant AI Selfie Match Finder (<1 second)',
      'Multi-Ceremony Tabs (e.g. Haldi, Sangeet, Wedding, Reception)',
      'Client Selection: ❤️ Favorites & 🔖 High-Res Keepers',
      '6 Months Live Gallery Access (Guests view & download anytime)',
      'Event QR Code for Instant Guest Sign-In',
      'Mobile-Friendly Web Gallery (No App Download Needed)',
      'Original & WebP High-Speed Downloads'
    ],
    ctaLabel: 'Get Single Event Pass',
    ctaHref: '/register?plan=single-event'
  },
  {
    id: 'grand-event',
    name: 'Grand Celebration Pass',
    badge: 'BEST FOR MULTI-DAY WEDDINGS',
    popular: true,
    tagline: 'Ideal for big multi-day Indian weddings, 2-day conferences, or 3-day cultural festivals.',
    photoLimit: 'Up to 6,000 Photos',
    eventCount: 'Up to 2 Events or 1 Multi-Day Celebration',
    galleryDuration: '1 Year Live Gallery',
    price: {
      INR: '₹1,499',
      USD: '$18.99'
    },
    cumulativeHeader: '✨ EVERYTHING IN SINGLE EVENT PASS, PLUS:',
    features: [
      'Up to 6,000 High-Res Photos',
      'Covers up to 2 Events or 1 Massive Multi-Day Wedding',
      '1 Full Year Live Gallery Access for All Guests',
      'Google Drive Background Auto-Sync',
      'Custom Family / Event Host Logo & Branding',
      'Priority High-Speed AI Photo Indexing',
      'Guest Photo Upload Permissions (Crowdsourced Guest Album)',
      'Full Uncompressed RAW Photo Downloads',
      'Dedicated Live Support during Event Days'
    ],
    ctaLabel: 'Get Grand Celebration Pass',
    ctaHref: '/register?plan=grand-event'
  }
];

const COMPARISON_ROWS = [
  {
    category: 'Capacity & Gallery Limits',
    items: [
      { name: 'Annual Photos Allowance', starter: '30,000', pro: '1,50,000 (1.5 Lakh)', enterprise: '3,50,000 (3.5 Lakh) / Custom' },
      { name: 'Active Events Allowed', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Live Guest Gallery Duration', starter: '1 Full Year', pro: '2 Full Years', enterprise: '3 Full Years' },
      { name: 'Download Quality', starter: 'WebP High-Res', pro: 'Original RAW + WebP', enterprise: 'Original RAW + WebP' }
    ]
  },
  {
    category: 'AI Face Recognition & Speed',
    items: [
      { name: 'Guest Selfie Searches', starter: 'Unlimited (Zero extra fees)', pro: 'Unlimited (Zero extra fees)', enterprise: 'Unlimited (Zero extra fees)' },
      { name: 'Face Match Speed', starter: 'Instant (<1 second)', pro: 'Instant (<1 second)', enterprise: 'Priority VIP Pipeline' },
      { name: 'Group Photo AI Matching', starter: 'Up to 100+ faces per photo', pro: 'Up to 100+ faces per photo', enterprise: 'Up to 100+ faces per photo' },
      { name: 'Mobile App Required?', starter: 'No (Direct Browser)', pro: 'No (Direct Browser)', enterprise: 'No (Direct Browser)' }
    ]
  },
  {
    category: 'Photographer Workflow & Proofing',
    items: [
      { name: 'Client Proofing Suite (❤️ & 🔖)', starter: 'Included Free', pro: 'Included Free', enterprise: 'Included Free' },
      { name: 'Adobe Lightroom Filename Export', starter: 'Included Free', pro: 'Included Free', enterprise: 'Included Free' },
      { name: 'Custom Studio Watermark (Text & Logo)', starter: '—', pro: 'Included Free', enterprise: 'Included Free' },
      { name: 'Multi-Ceremony Event Tabs', starter: 'Included Free', pro: 'Included Free', enterprise: 'Included Free' }
    ]
  },
  {
    category: 'Automation & Branding',
    items: [
      { name: 'Google Drive Auto-Sync', starter: '—', pro: 'Included Free', enterprise: 'Included Free' },
      { name: 'Team Member Logins', starter: '1 Account', pro: '2 Accounts', enterprise: 'Up to 5 Accounts' },
      { name: 'Gallery Branding', starter: 'Roopixo Powered', pro: 'Custom Studio Logo & Name', enterprise: 'Full White-Label' },
      { name: 'Custom Domain / CNAME', starter: '—', pro: '—', enterprise: 'gallery.yourstudio.com' }
    ]
  },
  {
    category: 'Support & Onboarding',
    items: [
      { name: 'Support Channel', starter: 'Standard Email', pro: 'Priority Live Chat & Email', enterprise: 'Dedicated WhatsApp Manager' },
      { name: 'Onboarding Assistance', starter: 'Documentation & Guides', pro: 'Priority Setup Support', enterprise: '1-on-1 VIP Setup Session' }
    ]
  }
];

const STUDIO_FAQS = [
  {
    q: 'What does "Live Guest Gallery Duration" mean?',
    a: 'Your subscription gives you 1 full year of platform access to host events and upload photos. "Live Guest Gallery Duration" is how long your clients and wedding guests can open the gallery link, search photos with selfies, and download pictures. Starter Pro includes 1 full year per event, Studio Pro includes 2 full years, and Enterprise includes 3 full years! Even if you upload an event in the 11th month of your subscription, your clients enjoy the full multi-year duration.'
  },
  {
    q: 'How does client selection for album design work?',
    a: 'Clients open their private gallery link on any phone or laptop and tap the Heart (❤️) or Bookmark (🔖) icon to shortlist photos for their wedding album. In your studio dashboard, you can 1-click copy the chosen filenames straight into Adobe Lightroom Classic, Photoshop, or Photo Mechanic to filter and edit without manual cross-referencing.'
  },
  {
    q: 'Are client proofing and watermarking charged as paid add-ons?',
    a: 'No! Unlike other platforms that charge ₹3,000 to ₹5,000 extra for watermarking and proofing, custom watermarking (your studio text or PNG logo with opacity and position control) and Lightroom selection exports are 100% included across all plans at zero extra cost.'
  },
  {
    q: 'Are guest selfie searches really unlimited?',
    a: 'Yes, 100% unlimited. Unlike other platforms that meter guest face scans or charge ₹0.50 to ₹1.00 per attendee, Roopixo includes unlimited AI face searches. You never pay a single rupee extra when 100 or 1,000 guests find their photos.'
  },
  {
    q: 'How does Google Drive Auto-Sync work?',
    a: 'Simply connect your Google Drive folder link in your event settings. As your team dumps photos into Drive from camera memory cards, Roopixo automatically detects new files in the background, compresses them, runs AI face indexing, and delivers them live to guests automatically.'
  },
  {
    q: 'What happens if I cross my annual photo allowance?',
    a: 'You can easily purchase photo top-up packs or upgrade to the next tier anytime with prorated billing. Your existing galleries and client links will never be interrupted or locked.'
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major Indian payment methods (UPI, GPay, PhonePe, Paytm, NetBanking, Credit & Debit Cards) as well as international Visa, MasterCard, and American Express cards.'
  }
];

const RETAIL_FAQS = [
  {
    q: 'Can I buy an Event Pass for my own wedding or birthday?',
    a: 'Yes, absolutely! The Single Event Pass (₹799) is designed specifically for couples, families, and individuals hosting a wedding, anniversary, or private celebration. You do not need to be a professional photographer.'
  },
  {
    q: 'Is the Single Event Pass a recurring subscription?',
    a: 'No! Event Passes are 100% one-time payments. There are zero auto-renewals, zero recurring monthly bills, and zero hidden fees.'
  },
  {
    q: 'How long can my wedding guests download their photos?',
    a: 'With the Single Event Pass, your gallery stays active online for 6 months. With the Grand Celebration Pass, your gallery stays active for 1 full year. Guests can open the link anytime on their phones and download their photos in original quality.'
  },
  {
    q: 'How do my wedding guests find their photos?',
    a: 'You simply place your event QR code on tables or share the link via WhatsApp. Guests scan the QR code on their phone browser, take a quick selfie, and all photos containing them appear instantly in their personal "My Photos" tab!'
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState<PricingCategory>('studio');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [upgradeTier, setUpgradeTier] = useState<'starter_pro' | 'studio_pro' | 'enterprise' | null>(null);

  const isAnnual = billingCycle === 'annual';
  const isStudio = category === 'studio';

  const handlePlanClick = (tierId: string, href: string) => {
    if (user) {
      const mapped = tierId === 'starter' ? 'starter_pro' : tierId === 'enterprise' ? 'enterprise' : 'studio_pro';
      setUpgradeTier(mapped);
    } else {
      window.location.href = href;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-violet-500 selection:text-white">
      {/* Top Background Glow Accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-violet-600/20 via-indigo-600/10 to-transparent blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[500px] rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute top-2/3 -left-40 h-[400px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Hero Section */}
      <main className="relative z-20 mx-auto max-w-7xl px-6 pt-10 pb-24 sm:px-8 sm:pt-14">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            Transparent Pricing • Zero Paid Add-Ons
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            Simple, Transparent Pricing for Every Event
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed">
            Deliver instant AI face-matching galleries to wedding and party guests. Choose between annual studio memberships or one-time event passes.
          </p>
        </div>

        {/* Primary Category Switcher: Studios vs Individuals */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center rounded-2xl border border-white/15 bg-white/[0.06] p-1.5 backdrop-blur-xl shadow-xl">
            <button
              type="button"
              onClick={() => setCategory('studio')}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                isStudio
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Briefcase className="h-4 w-4" />
              Photographers & Studios
              <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-semibold text-violet-200 border border-violet-400/30">
                Annual / Monthly
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCategory('retail')}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                !isStudio
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <PartyPopper className="h-4 w-4" />
              Individual & Single Events
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                One-Time Pass
              </span>
            </button>
          </div>
        </div>

        {/* Sub-Switchers: Currency & Billing Cycle (Only for Studio) */}
        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
          {isStudio && (
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
          )}

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

        {/* 14-Day Free Trial Banner */}
        <div className="mt-10 max-w-4xl mx-auto rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-indigo-950/20 to-purple-950/40 p-6 sm:p-8 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              100% Free • Zero Credit Card Required
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Try Roopixo Free for 14 Days
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl leading-relaxed">
              Experience instant AI face matching firsthand. Create 1 live test event, upload up to 200 photos, and see your guests find their photos in less than 1 second.
            </p>
          </div>
          <Link
            href="/register?plan=free_trial"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-zinc-900 px-6 py-3.5 text-sm font-bold shadow-lg hover:bg-zinc-100 transition shrink-0"
          >
            Start 14-Day Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* SECTION A: Photographers & Studios Cards */}
        {isStudio && (
          <>
            <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-8 items-stretch">
            {STUDIO_TIERS.map((tier) => {
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
                    <button
                      type="button"
                      onClick={() => handlePlanClick(tier.id, tier.ctaHref)}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${
                        tier.popular
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500'
                          : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {tier.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <p className="mt-2 text-center text-[11px] text-zinc-500">
                      Instant setup • Cancel anytime
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom & High-Volume Enterprise Plan Callout */}
          <div className="mt-10 rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-indigo-950/30 p-6 sm:p-8 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300 border border-violet-400/30">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  Custom Volumes & Enterprise Customization
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Need a custom plan or higher photo volume than Enterprise?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                  Shooting more than 3,50,000 photos/year or need multi-brand franchise support, custom CNAME domain mapping, and dedicated AI GPU pipelines? We craft custom enterprise packages with tailored SLAs and volume pricing.
                </p>
              </div>
              <Link
                href="/contact"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-zinc-950 transition hover:bg-zinc-200 shadow-lg shadow-white/10"
              >
                Get in Touch with Us
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          </>
        )}

        {/* SECTION B: Individual & Single Event Passes */}
        {!isStudio && (
          <div className="mt-14 max-w-4xl mx-auto grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
            {RETAIL_PASSES.map((pass) => {
              const displayPrice = pass.price[currency];

              return (
                <div
                  key={pass.id}
                  className={`relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
                    pass.popular
                      ? 'border-violet-500/80 bg-gradient-to-b from-violet-950/40 via-[#131022] to-[#0c0a17] shadow-2xl shadow-violet-500/20 ring-1 ring-violet-500/50 md:-translate-y-2'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.03]'
                  }`}
                >
                  {/* Badge */}
                  {pass.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1 text-[11px] font-bold tracking-wider text-white shadow-lg shadow-violet-500/30 uppercase">
                        <Star className="h-3 w-3 fill-current" />
                        {pass.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Title & Tagline */}
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">{pass.name}</h3>
                      <p className="text-xs text-zinc-400 min-h-[36px] leading-relaxed">
                        {pass.tagline}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="mt-6 border-y border-white/10 py-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white">
                          {displayPrice}
                        </span>
                        <span className="text-sm font-medium text-zinc-400">/ event</span>
                      </div>
                      <p className="mt-1 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> One-time payment • Zero monthly subscription
                      </p>

                      {/* Photo Limit & Duration Badges */}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-violet-200">
                          <Camera className="h-3.5 w-3.5 text-violet-400" />
                          {pass.photoLimit}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-zinc-300">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" />
                          {pass.galleryDuration}
                        </span>
                      </div>
                    </div>

                    {/* Cumulative Header (if applicable) */}
                    {pass.cumulativeHeader && (
                      <div className="mt-6 text-[11px] font-bold tracking-wider text-violet-400 uppercase">
                        {pass.cumulativeHeader}
                      </div>
                    )}

                    {/* Features List */}
                    <ul className={`space-y-3 text-xs sm:text-sm text-zinc-300 ${pass.cumulativeHeader ? 'mt-3' : 'mt-6'}`}>
                      {pass.features.map((feature, idx) => (
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
                      href={pass.ctaHref}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all ${
                        pass.popular
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500'
                          : 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
                      }`}
                    >
                      {pass.ctaLabel}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <p className="mt-2 text-center text-[11px] text-zinc-500">
                      Instant gallery setup • Share via QR or WhatsApp
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Value Prop Banner: Zero Hidden Fees */}
        <div className="mt-16 rounded-3xl border border-white/10 bg-gradient-to-r from-violet-950/30 via-indigo-950/20 to-purple-950/30 p-8 text-center backdrop-blur-md">
          <div className="mx-auto max-w-3xl space-y-3">
            <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-2">
              <ShieldCheck className="h-6 w-6 text-violet-400" />
              What You See Is What You Pay — No Sneaky Add-On Charges
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Unlike other platforms that charge extra for client proofing, watermarking, branding, or per-guest face scans, Roopixo includes everything in your tier. Guests enjoy <strong>unlimited instant selfie searches</strong> with zero hidden per-match charges.
            </p>
          </div>
        </div>

        {/* Comprehensive Feature Comparison Matrix (Only on Studio View) */}
        {isStudio && (
          <section className="mt-24">
            <div className="text-center space-y-2 mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Detailed Studio Plan Comparison
              </h2>
              <p className="text-sm text-zinc-400">
                Compare features and choose the exact tier that fits your annual shoot volume.
              </p>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-zinc-400">
                    <th className="py-4 px-6 font-semibold">Feature</th>
                    <th className="py-4 px-4 text-center font-semibold text-white">Starter Pro</th>
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
        )}

        {/* Frequently Asked Questions */}
        <section className="mt-24 max-w-4xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-violet-400" />
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400">
              Everything you need to know about {isStudio ? 'photographer memberships' : 'individual event passes'} and instant AI delivery.
            </p>
          </div>

          <div className="space-y-4">
            {(isStudio ? STUDIO_FAQS : RETAIL_FAQS).map((faq, idx) => {
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
              Ready to Supercharge Your Event Photos?
            </h2>
            <p className="text-sm sm:text-base text-violet-100">
              Deliver instant AI face-matching galleries to your guests. Fast, private, and effortless.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={isStudio ? '/register?plan=pro' : '/register?plan=single-event'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-violet-900 shadow-lg transition hover:bg-violet-50"
              >
                {isStudio ? 'Start with Studio Pro' : 'Get Single Event Pass'}
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
              Instant activation • No app download required for guests
            </p>
          </div>
        </section>
      </main>

      {/* Public Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-[#070709] py-12 text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:px-8">
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

      {/* Upgrade & Checkout Modal */}
      {upgradeTier && (
        <UpgradeModal
          isOpen={!!upgradeTier}
          onClose={() => setUpgradeTier(null)}
          targetTier={upgradeTier}
        />
      )}
    </div>
  );
}
