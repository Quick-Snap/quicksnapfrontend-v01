'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Check,
  Copy,
  IndianRupee,
  Loader2,
  CalendarDays,
  Camera,
  ShieldCheck,
  UserCheck,
  Layers,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminBypassApi,
  adminPricingCalculatorApi,
  AIPricingCalculationResult
} from '@/lib/api';

export default function CustomPlanBuilderCard() {
  const [bypassType, setBypassType] = useState<'organizer' | 'event'>('organizer');
  const [targetId, setTargetId] = useState('');
  const [bypassTier, setBypassTier] = useState<'starter_pro' | 'studio_pro' | 'enterprise'>('studio_pro');
  const [bypassDays, setBypassDays] = useState<number>(365);
  const [customPhotoQuota, setCustomPhotoQuota] = useState<string>('150000');
  const [bypassReason, setBypassReason] = useState('Bespoke Enterprise Agreement');
  const [grantingBypass, setGrantingBypass] = useState(false);

  // Custom Feature Entitlements State
  const [customFeatures, setCustomFeatures] = useState<Record<string, boolean>>({
    googleDriveSync: true,
    liveWall: true,
    guestUploads: true,
    customWatermark: true,
    rawDownloads: true,
    customDomain: false,
    priorityAIQueue: false,
    clientProofing: true
  });
  const [maxTeamMembers, setMaxTeamMembers] = useState<number>(2);
  const [agreedPrice, setAgreedPrice] = useState<string>('');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState<string>('');
  const [aiPricing, setAiPricing] = useState<AIPricingCalculationResult | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const applyPresetTier = (tier: 'starter_pro' | 'studio_pro' | 'enterprise') => {
    setBypassTier(tier);
    if (tier === 'starter_pro') {
      setCustomPhotoQuota('30000');
      setBypassDays(180);
      setMaxTeamMembers(1);
      setCustomFeatures({
        googleDriveSync: false,
        liveWall: true,
        guestUploads: true,
        customWatermark: false,
        rawDownloads: false,
        customDomain: false,
        priorityAIQueue: false,
        clientProofing: true
      });
    } else if (tier === 'studio_pro') {
      setCustomPhotoQuota('150000');
      setBypassDays(365);
      setMaxTeamMembers(2);
      setCustomFeatures({
        googleDriveSync: true,
        liveWall: true,
        guestUploads: true,
        customWatermark: true,
        rawDownloads: true,
        customDomain: false,
        priorityAIQueue: false,
        clientProofing: true
      });
    } else {
      setCustomPhotoQuota('350000');
      setBypassDays(548);
      setMaxTeamMembers(5);
      setCustomFeatures({
        googleDriveSync: true,
        liveWall: true,
        guestUploads: true,
        customWatermark: true,
        rawDownloads: true,
        customDomain: true,
        priorityAIQueue: true,
        clientProofing: true
      });
    }
  };

  const recalculateAiPrice = useCallback(async () => {
    if (bypassType !== 'organizer') return;
    setCalculatingPrice(true);
    try {
      const quota = customPhotoQuota ? Number(customPhotoQuota) : 150000;
      const res = await adminPricingCalculatorApi.calculate({
        photoQuota: quota,
        days: bypassDays,
        features: customFeatures,
        maxTeamMembers: maxTeamMembers
      });
      if (res.success && res.data) {
        setAiPricing(res.data);
      }
    } catch (err) {
      console.error('Failed to calculate AI pricing:', err);
    } finally {
      setCalculatingPrice(false);
    }
  }, [bypassType, customPhotoQuota, bypassDays, customFeatures, maxTeamMembers]);

  useEffect(() => {
    if (bypassType === 'organizer') {
      const timer = setTimeout(() => {
        recalculateAiPrice();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [bypassType, recalculateAiPrice]);

  const handleCopyPitch = () => {
    if (!aiPricing?.salesPitchText) return;
    navigator.clipboard.writeText(aiPricing.salesPitchText);
    setCopiedPitch(true);
    toast.success('WhatsApp / Email proposal copied to clipboard!');
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const handleGrantBypass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim()) {
      toast.error(`Please provide the ${bypassType === 'organizer' ? 'Organizer Email or ID' : 'Event Code or ID'}`);
      return;
    }

    setGrantingBypass(true);
    try {
      if (bypassType === 'organizer') {
        const res = await adminBypassApi.grantOrganizerBypass({
          userId: targetId.trim(),
          email: targetId.trim(),
          effectiveTier: bypassTier,
          days: bypassDays,
          customPhotoQuota: customPhotoQuota ? Number(customPhotoQuota) : undefined,
          customFeatures,
          agreedPrice: agreedPrice ? Number(agreedPrice) : undefined,
          customInvoiceNumber: customInvoiceNumber.trim() || undefined,
          reason: bypassReason
        });
        if (res.success) {
          toast.success(res.message || 'Custom plan & entitlements activated!');
          setTargetId('');
        }
      } else {
        const res = await adminBypassApi.grantEventBypass({
          eventId: targetId.trim(),
          eventCode: targetId.trim(),
          days: bypassDays,
          customPhotoLimit: customPhotoQuota ? Number(customPhotoQuota) : undefined,
          allowGoogleDriveSync: !!customFeatures.googleDriveSync,
          allowRawDownloads: !!customFeatures.rawDownloads,
          reason: bypassReason
        });
        if (res.success) {
          toast.success(res.message || 'Event exemption granted!');
          setTargetId('');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to activate custom plan');
    } finally {
      setGrantingBypass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 backdrop-blur-xl">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6 dark:border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white">
                  Custom Enterprise Plan & AI Pricing Builder
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                  Configure bespoke organizer subscriptions, set custom photo quotas, toggle individual feature entitlements, and calculate AI-recommended pricing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3.5 py-1 text-xs font-semibold text-violet-400">
              <Zap className="h-3 w-3" />
              Bespoke Entitlements
            </span>
          </div>
        </div>

        <form onSubmit={handleGrantBypass} className="mt-6 space-y-6">
          {/* Target Mode Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
              Select Configuration Target
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              <button
                type="button"
                onClick={() => setBypassType('organizer')}
                className={`flex items-center gap-3 rounded-2xl p-3.5 text-xs font-bold border transition text-left ${
                  bypassType === 'organizer'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/40'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <UserCheck className="h-4 w-4 shrink-0 text-violet-500" />
                <div>
                  <p className="font-bold">Bespoke Organizer Plan</p>
                  <p className="text-[11px] opacity-75 font-normal">Apply custom quotas & feature toggles across all events of a studio</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBypassType('event')}
                className={`flex items-center gap-3 rounded-2xl p-3.5 text-xs font-bold border transition text-left ${
                  bypassType === 'event'
                    ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/40'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4 shrink-0 text-indigo-500" />
                <div>
                  <p className="font-bold">Specific Event Exemption</p>
                  <p className="text-[11px] opacity-75 font-normal">Exempt a single wedding or private event from limits</p>
                </div>
              </button>
            </div>
          </div>

          {/* Identifier Input */}
          <div className="max-w-2xl">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1.5">
              {bypassType === 'organizer' ? 'Organizer Email ID (or MongoDB _id)' : 'Event Code (or MongoDB _id)'}
            </label>
            <input
              type="text"
              placeholder={bypassType === 'organizer' ? 'e.g. photographer@example.com or User ID' : 'e.g. DELHI2026 or Event ID'}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value.trim())}
              required
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs sm:text-sm font-mono dark:border-white/10 dark:bg-white/5 focus:outline-none focus:border-violet-500"
            />
          </div>

          {bypassType === 'organizer' && (
            <>
              {/* Preset Blueprints */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-2">
                  Quick Blueprint Presets (Click to load defaults, then freely toggle):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => applyPresetTier('starter_pro')}
                    className={`rounded-2xl p-3 text-xs border text-left transition ${
                      bypassTier === 'starter_pro'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/40'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="font-bold text-sm">Starter Blueprint</p>
                    <p className="text-[11px] opacity-80 mt-0.5">30k photos • 6mo gallery • 1 Login</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetTier('studio_pro')}
                    className={`rounded-2xl p-3 text-xs border text-left transition ${
                      bypassTier === 'studio_pro'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/40'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="font-bold text-sm">Studio Pro Blueprint</p>
                    <p className="text-[11px] opacity-80 mt-0.5">1.5L photos • 1yr gallery • GDrive • Watermark</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPresetTier('enterprise')}
                    className={`rounded-2xl p-3 text-xs border text-left transition ${
                      bypassTier === 'enterprise'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/40'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="font-bold text-sm">Enterprise Blueprint</p>
                    <p className="text-[11px] opacity-80 mt-0.5">3.5L photos • 1.5yr gallery • White-Label CNAME</p>
                  </button>
                </div>
              </div>

              {/* Quotas & Capacity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Custom Photo Quota</label>
                  <input
                    type="number"
                    value={customPhotoQuota}
                    onChange={(e) => setCustomPhotoQuota(e.target.value)}
                    placeholder="e.g. 150000"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Validity Duration (Days)</label>
                  <input
                    type="number"
                    value={bypassDays}
                    onChange={(e) => setBypassDays(Number(e.target.value))}
                    min="1"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Team Photographer Logins</label>
                  <input
                    type="number"
                    value={maxTeamMembers}
                    onChange={(e) => setMaxTeamMembers(Number(e.target.value))}
                    min="1"
                    max="25"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              {/* Feature Entitlements Matrix (Granular Toggles) */}
              <div className="rounded-3xl border border-zinc-200 p-5 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3 dark:border-white/10">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                      Feature Entitlements Matrix
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Click any feature to enable or disable it specifically for this client.
                    </p>
                  </div>
                  <span className="text-[11px] text-violet-500 font-semibold bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                    Granular Access
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {[
                    { key: 'googleDriveSync', label: 'Google Drive Auto-Sync', desc: 'Direct camera files sync' },
                    { key: 'liveWall', label: 'Big-Screen Live Wall', desc: 'TV/Projector display with QR' },
                    { key: 'guestUploads', label: 'Guest Candid Uploads', desc: 'Crowdsourced album' },
                    { key: 'customWatermark', label: 'Custom Watermarking', desc: 'Studio logo & copyright' },
                    { key: 'rawDownloads', label: 'Original RAW Exports', desc: 'Full uncompressed files' },
                    { key: 'customDomain', label: 'White-Label CNAME', desc: 'gallery.yourstudio.com' },
                    { key: 'priorityAIQueue', label: 'VIP Priority AI Queue', desc: 'Fast-track GPU indexing' },
                    { key: 'clientProofing', label: 'Client Proofing Suite', desc: '❤️ Favorites & Lightroom' }
                  ].map(({ key, label, desc }) => {
                    const isEnabled = !!customFeatures[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCustomFeatures(prev => ({ ...prev, [key]: !prev[key] }));
                        }}
                        className={`flex flex-col justify-between rounded-2xl border p-3 text-left transition ${
                          isEnabled
                            ? 'border-emerald-500/60 bg-emerald-500/5 text-zinc-900 dark:text-white shadow-sm'
                            : 'border-zinc-200 dark:border-white/10 opacity-50 bg-transparent text-zinc-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold leading-tight">{label}</p>
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                            isEnabled
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-zinc-400 dark:border-white/20'
                          }`}>
                            {isEnabled && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-2 leading-tight">{desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REAL-TIME AI PRICING ENGINE CARD */}
              <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-purple-950/20 to-indigo-950/30 p-5 sm:p-6 backdrop-blur-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-violet-300">
                      AI Dynamic Pricing & Negotiation Intelligence
                    </h4>
                  </div>
                  {calculatingPrice && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Calculating market rates…
                    </span>
                  )}
                </div>

                {aiPricing ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                      <div className="rounded-2xl border border-violet-500/40 bg-violet-500/10 p-4 shadow-lg shadow-violet-500/10">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-violet-300">
                          💎 Recommended Quote
                        </p>
                        <p className="text-2xl sm:text-3xl font-black text-white mt-1">
                          ₹{aiPricing.recommendedPrice.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                          {aiPricing.grossMarginPercent}% Target Gross Margin
                        </p>
                      </div>

                      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                          🛡️ Walk-Away Floor
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-zinc-200 mt-1">
                          ₹{aiPricing.floorPrice.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Minimum break-even floor
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                          🌟 Premium Anchor Price
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-zinc-200 mt-1">
                          ₹{aiPricing.premiumPrice.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1">
                          Initial anchoring proposal
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setAgreedPrice(aiPricing.recommendedPrice.toString())}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition shadow-md shadow-violet-500/20"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Apply AI Recommended Price (₹{aiPricing.recommendedPrice.toLocaleString()})
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyPitch}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition"
                      >
                        {copiedPitch ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedPitch ? 'Copied Proposal Note!' : 'Copy WhatsApp / Email Proposal'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-zinc-400">Loading AI price recommendation…</p>
                )}
              </div>

              {/* Agreed Price & Invoice Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold block mb-1.5">Agreed Custom Price (₹ INR)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <input
                      type="number"
                      placeholder="e.g. 29999"
                      value={agreedPrice}
                      onChange={(e) => setAgreedPrice(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold dark:border-white/10 dark:bg-white/5 focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1.5">Custom Invoice / Agreement Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. RPX-2026-CUSTOM-01"
                    value={customInvoiceNumber}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs sm:text-sm font-mono dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>
            </>
          )}

          {/* Event Specific Fields */}
          {bypassType === 'event' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold block mb-1.5">Exemption Duration (Days)</label>
                <input
                  type="number"
                  value={bypassDays}
                  onChange={(e) => setBypassDays(Number(e.target.value))}
                  min="1"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1.5">Custom Photo Limit</label>
                <input
                  type="number"
                  value={customPhotoQuota}
                  onChange={(e) => setCustomPhotoQuota(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                />
              </div>
            </div>
          )}

          {/* Admin Memo / Reason */}
          <div>
            <label className="text-xs font-semibold block mb-1.5">Admin Memo / Contract Notes</label>
            <input
              type="text"
              value={bypassReason}
              onChange={(e) => setBypassReason(e.target.value)}
              placeholder="e.g. Bespoke studio package negotiated via WhatsApp"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs sm:text-sm dark:border-white/10 dark:bg-white/5"
            />
          </div>

          {/* Activation Action Button */}
          <div className="pt-2 border-t border-zinc-100 dark:border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={grantingBypass}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-50"
            >
              {grantingBypass ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Activating Custom Plan…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Activate Custom Plan & Entitlements
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
