'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Percent,
  IndianRupee,
  ShieldCheck,
  UserCheck,
  CalendarDays,
  Sparkles,
  Copy,
  Check,
  Zap,
  Sliders,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminCouponsApi,
  adminBypassApi,
  adminPricingCalculatorApi,
  CouponInfo,
  AIPricingCalculationResult
} from '@/lib/api';

export default function CouponsControlCard() {
  const [coupons, setCoupons] = useState<CouponInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBypassModal, setShowBypassModal] = useState(false);

  // Form state for new coupon
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [validDays, setValidDays] = useState<number>(30);
  const [usageLimit, setUsageLimit] = useState<string>('50');
  const [creating, setCreating] = useState(false);

  // Form state for Admin Bypass
  const [bypassType, setBypassType] = useState<'organizer' | 'event'>('organizer');
  const [targetId, setTargetId] = useState('');
  const [bypassTier, setBypassTier] = useState<'starter_pro' | 'studio_pro' | 'enterprise'>('studio_pro');
  const [bypassDays, setBypassDays] = useState<number>(365);
  const [customPhotoQuota, setCustomPhotoQuota] = useState<string>('150000');
  const [bypassReason, setBypassReason] = useState('Custom Enterprise Plan');
  const [grantingBypass, setGrantingBypass] = useState(false);

  // Custom Feature Entitlements & AI Pricing State
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
    if (showBypassModal && bypassType === 'organizer') {
      const timer = setTimeout(() => {
        recalculateAiPrice();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [showBypassModal, bypassType, recalculateAiPrice]);

  const handleCopyPitch = () => {
    if (!aiPricing?.salesPitchText) return;
    navigator.clipboard.writeText(aiPricing.salesPitchText);
    setCopiedPitch(true);
    toast.success('WhatsApp proposal copied to clipboard!');
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  const fetchCoupons = async () => {
    try {
      const res = await adminCouponsApi.getAll();
      if (res.success && res.data) {
        setCoupons(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) {
      toast.error('Code and discount value are required');
      return;
    }

    setCreating(true);
    try {
      const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
      const res = await adminCouponsApi.create({
        code: code.trim().toUpperCase(),
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        validUntil,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        applicableTiers: ['all']
      });

      if (res.success) {
        toast.success(`Coupon "${code.toUpperCase()}" created!`);
        setShowCreateModal(false);
        setCode('');
        setDescription('');
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await adminCouponsApi.toggle(id);
      if (res.success) {
        toast.success(res.message || 'Status updated');
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string, codeStr: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${codeStr}"?`)) return;
    try {
      const res = await adminCouponsApi.delete(id);
      if (res.success) {
        toast.success('Coupon deleted');
        fetchCoupons();
      }
    } catch (err: any) {
      toast.error('Failed to delete coupon');
    }
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
          setShowBypassModal(false);
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
          setShowBypassModal(false);
          setTargetId('');
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to grant bypass');
    } finally {
      setGrantingBypass(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Tag className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Discount Coupons & Admin Bypass
            </h2>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Generate promotional discount promo codes for checkout or grant custom exemptions to organizers & events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBypassModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 transition"
          >
            <ShieldCheck className="h-4 w-4 text-violet-500" />
            Grant Custom Bypass
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading coupons…
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl">
            <Tag className="h-8 w-8 text-zinc-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No active coupons created yet</p>
            <p className="text-xs text-zinc-500 mt-1">Click "Create Coupon" above to generate your first promotional code.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                  <th className="py-3 px-4 font-semibold">Code</th>
                  <th className="py-3 px-4 font-semibold">Discount</th>
                  <th className="py-3 px-4 font-semibold">Redemptions</th>
                  <th className="py-3 px-4 font-semibold">Valid Until</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                {coupons.map((c) => {
                  const isExpired = new Date(c.validUntil).getTime() < Date.now();
                  return (
                    <tr key={c._id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-violet-600 dark:text-violet-400">
                        {c.code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                        {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} flat off`}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-400">
                        {c.usageCount} {c.usageLimit ? `/ ${c.usageLimit}` : 'uses'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {new Date(c.validUntil).toLocaleDateString()}
                        {isExpired && <span className="ml-1.5 text-rose-500 font-semibold">(Expired)</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c._id)}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            c.isActive && !isExpired
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                          }`}
                        >
                          {c.isActive && !isExpired ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(c._id, c.code)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE COUPON MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900 text-zinc-900 dark:text-white">
            <h3 className="text-lg font-bold">Create Discount Promo Code</h3>
            <p className="text-xs text-zinc-500 mt-1">Generated code can be used on checkout across all plans.</p>

            <form onSubmit={handleCreateCoupon} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold block mb-1">Coupon Code</label>
                <input
                  type="text"
                  placeholder="e.g. STUDIO25 or DIWALI50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs uppercase font-mono font-bold dark:border-white/10 dark:bg-white/5 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed_amount">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Discount Value</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    required
                    min="1"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold block mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    min="1"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="e.g. 50 (blank = infinite)"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white hover:bg-violet-500 transition disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM PLAN & AI PRICING BUILDER MODAL */}
      {showBypassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-white/10 dark:bg-zinc-900 text-zinc-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-bold">Custom Enterprise Plan & AI Pricing Builder</h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Toggle individual features, set custom photo quotas, and get instant AI-recommended pricing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBypassModal(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGrantBypass} className="mt-5 space-y-5">
              {/* Target Type Selector */}
              <div>
                <label className="text-xs font-semibold block mb-1">Target Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBypassType('organizer')}
                    className={`rounded-xl py-2 text-xs font-bold border transition ${
                      bypassType === 'organizer'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-400'
                    }`}
                  >
                    Bespoke Organizer Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setBypassType('event')}
                    className={`rounded-xl py-2 text-xs font-bold border transition ${
                      bypassType === 'event'
                        ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-400'
                    }`}
                  >
                    Specific Event Exemption
                  </button>
                </div>
              </div>

              {/* Target Identifier Input */}
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {bypassType === 'organizer' ? 'Organizer Email ID (or User ID)' : 'Event Code (or Event ID)'}
                </label>
                <input
                  type="text"
                  placeholder={bypassType === 'organizer' ? 'e.g. photographer@example.com or User ID' : 'e.g. WED2026 or Event ID'}
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value.trim())}
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-mono dark:border-white/10 dark:bg-white/5 focus:outline-none focus:border-violet-500"
                />
              </div>

              {bypassType === 'organizer' && (
                <>
                  {/* Preset Blueprints */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-zinc-500">
                      Preset Blueprints (Click to load defaults, then freely customize):
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => applyPresetTier('starter_pro')}
                        className={`rounded-xl px-3 py-2 text-xs font-medium border text-left transition ${
                          bypassTier === 'starter_pro'
                            ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                            : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="font-bold">Starter Preset</p>
                        <p className="text-[10px] opacity-75">30k photos • 6mo</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetTier('studio_pro')}
                        className={`rounded-xl px-3 py-2 text-xs font-medium border text-left transition ${
                          bypassTier === 'studio_pro'
                            ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                            : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="font-bold">Studio Pro Preset</p>
                        <p className="text-[10px] opacity-75">1.5L photos • GDrive</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPresetTier('enterprise')}
                        className={`rounded-xl px-3 py-2 text-xs font-medium border text-left transition ${
                          bypassTier === 'enterprise'
                            ? 'border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                            : 'border-zinc-200 dark:border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <p className="font-bold">Enterprise Preset</p>
                        <p className="text-[10px] opacity-75">3.5L photos • CNAME</p>
                      </button>
                    </div>
                  </div>

                  {/* Quota & Capacity Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1">Custom Photo Quota</label>
                      <input
                        type="number"
                        value={customPhotoQuota}
                        onChange={(e) => setCustomPhotoQuota(e.target.value)}
                        placeholder="e.g. 150000"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Duration (Days)</label>
                      <input
                        type="number"
                        value={bypassDays}
                        onChange={(e) => setBypassDays(Number(e.target.value))}
                        min="1"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1">Team Photographer Logins</label>
                      <input
                        type="number"
                        value={maxTeamMembers}
                        onChange={(e) => setMaxTeamMembers(Number(e.target.value))}
                        min="1"
                        max="20"
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                  </div>

                  {/* Feature Entitlements Checklist */}
                  <div className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Feature Entitlements (Enable or Disable against each feature)
                      </label>
                      <span className="text-[11px] text-violet-500 font-medium">Bespoke Access Control</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { key: 'googleDriveSync', label: 'Google Drive Background Auto-Sync', desc: 'Direct camera file dump' },
                        { key: 'liveWall', label: 'Big-Screen Live Photo Wall', desc: 'Projector slideshow with QR' },
                        { key: 'guestUploads', label: 'Guest Candid Photo Uploads', desc: 'Crowdsourced guest album' },
                        { key: 'customWatermark', label: 'Custom Studio Watermarking', desc: 'PNG logo & copyright protection' },
                        { key: 'rawDownloads', label: 'Original RAW Photo Downloads', desc: 'High-res uncompressed exports' },
                        { key: 'customDomain', label: 'White-Label CNAME Custom Domain', desc: 'gallery.yourstudio.com' },
                        { key: 'priorityAIQueue', label: 'Fast-Track Priority AI Indexing', desc: 'Dedicated GPU pipeline' },
                        { key: 'clientProofing', label: 'Client Proofing & Lightroom Export', desc: '❤️ Favorites & 🔖 Keepers' }
                      ].map(({ key, label, desc }) => {
                        const isEnabled = !!customFeatures[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setCustomFeatures(prev => ({ ...prev, [key]: !prev[key] }));
                            }}
                            className={`flex items-start gap-3 rounded-xl border p-2.5 text-left transition ${
                              isEnabled
                                ? 'border-emerald-500/50 bg-emerald-500/5 text-zinc-900 dark:text-white'
                                : 'border-zinc-200 dark:border-white/10 opacity-50 bg-transparent text-zinc-400'
                            }`}
                          >
                            <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                              isEnabled
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-zinc-400 dark:border-white/20'
                            }`}>
                              {isEnabled && <Check className="h-3 w-3 stroke-[3]" />}
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-xs font-semibold leading-tight truncate">{label}</p>
                              <p className="text-[10px] text-zinc-400 leading-tight">{desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AI SMART PRICING ENGINE CARD */}
                  <div className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-purple-950/20 to-indigo-950/30 p-4 sm:p-5 backdrop-blur-md space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-violet-300">
                          AI Pricing & Sales Pitch Recommendation
                        </span>
                      </div>
                      {calculatingPrice && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                          <Loader2 className="h-3 w-3 animate-spin" /> Calculating…
                        </span>
                      )}
                    </div>

                    {aiPricing ? (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5">
                            <p className="text-[10px] uppercase font-bold text-violet-300">💎 Recommended Quote</p>
                            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">
                              ₹{aiPricing.recommendedPrice.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                              {aiPricing.grossMarginPercent}% Gross Margin
                            </p>
                          </div>

                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
                            <p className="text-[10px] uppercase font-bold text-amber-300">🛡️ Floor Minimum</p>
                            <p className="text-lg sm:text-xl font-bold text-zinc-200 mt-0.5">
                              ₹{aiPricing.floorPrice.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Cost break-even</p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                            <p className="text-[10px] uppercase font-bold text-zinc-400">🌟 Premium Anchor</p>
                            <p className="text-lg sm:text-xl font-bold text-zinc-200 mt-0.5">
                              ₹{aiPricing.premiumPrice.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-0.5">Initial anchor pitch</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setAgreedPrice(aiPricing.recommendedPrice.toString())}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-500 transition"
                          >
                            <Zap className="h-3 w-3" />
                            Apply AI Price (₹{aiPricing.recommendedPrice.toLocaleString()})
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyPitch}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10 transition"
                          >
                            {copiedPitch ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                            {copiedPitch ? 'Copied to Clipboard!' : 'Copy WhatsApp Pitch'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-zinc-400">Adjust features or quota above to compute AI pricing recommendation.</p>
                    )}
                  </div>

                  {/* Agreed Price & Invoice Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold block mb-1">Agreed Final Price (₹ INR)</label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                        <input
                          type="number"
                          placeholder="e.g. 29999"
                          value={agreedPrice}
                          onChange={(e) => setAgreedPrice(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-white/5 focus:border-violet-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold block mb-1">Invoice / Reference No.</label>
                      <input
                        type="text"
                        placeholder="e.g. RPX-2026-CUSTOM-01"
                        value={customInvoiceNumber}
                        onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-mono dark:border-white/10 dark:bg-white/5"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Event Exemption Fields */}
              {bypassType === 'event' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold block mb-1">Exemption Duration (Days)</label>
                    <input
                      type="number"
                      value={bypassDays}
                      onChange={(e) => setBypassDays(Number(e.target.value))}
                      min="1"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold block mb-1">Custom Photo Limit</label>
                    <input
                      type="number"
                      value={customPhotoQuota}
                      onChange={(e) => setCustomPhotoQuota(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>
              )}

              {/* Reason / Admin Memo */}
              <div>
                <label className="text-xs font-semibold block mb-1">Admin Memo / Reason</label>
                <input
                  type="text"
                  value={bypassReason}
                  onChange={(e) => setBypassReason(e.target.value)}
                  placeholder="e.g. Enterprise Custom Contract signed via WhatsApp"
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs dark:border-white/10 dark:bg-white/5"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowBypassModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={grantingBypass}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-50"
                >
                  {grantingBypass ? 'Activating Plan…' : 'Activate Custom Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
