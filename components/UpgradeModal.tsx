'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Tag,
  Zap,
  Lock,
  Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi, CouponCalculationResult } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTier?: 'starter_pro' | 'studio_pro' | 'enterprise';
  featureName?: string;
  reason?: string;
  onSuccess?: () => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  targetTier = 'studio_pro',
  featureName = 'Google Drive Auto-Sync',
  reason = 'Upgrade to Studio Pro to unlock this feature and supercharge your photography workflow.',
  onSuccess
}: UpgradeModalProps) {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponResult, setCouponResult] = useState<CouponCalculationResult | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  if (!isOpen) return null;

  const isAnnual = billingCycle === 'annual';
  const tierName = targetTier === 'enterprise' ? 'Enterprise' : 'Studio Pro';
  const basePrice = isAnnual ? 7999 : 899;

  const currentPrice = couponResult?.finalAmount ?? basePrice;
  const discountAmount = couponResult?.discountAmount ?? 0;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setApplyingCoupon(true);
    try {
      const res = await paymentApi.applyCoupon({
        code: couponCode.trim(),
        tierId: targetTier,
        billingCycle
      });

      if (res.success && res.data) {
        setCouponResult(res.data);
        toast.success(`Coupon applied! Saved ${res.data.label}`);
      } else {
        toast.error(res.message || 'Failed to apply coupon');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired coupon code');
      setCouponResult(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      // 1. Create order on backend
      const orderRes = await paymentApi.createOrder({
        tierId: targetTier,
        billingCycle,
        couponCode: couponResult?.code
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Could not initiate checkout');
      }

      const orderData = orderRes.data;

      // 2. If sandbox test mode, verify and activate directly
      if (orderData.isSandbox || typeof window === 'undefined' || !window.Razorpay) {
        const verifyRes = await paymentApi.verifyPayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'sandbox_bypass_signature',
          tierId: targetTier,
          billingCycle,
          couponCode: couponResult?.code
        });

        if (verifyRes.success) {
          toast.success(`🎉 Upgraded to ${tierName}! All features are now unlocked.`);
          if (onSuccess) onSuccess();
          onClose();
          window.location.reload();
          return;
        }
      }

      // 3. Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency,
        name: 'Roopixo',
        description: `${tierName} Plan (${isAnnual ? 'Annual' : 'Monthly'})`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#7c3aed'
        },
        handler: async (response: any) => {
          try {
            const verifyRes = await paymentApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tierId: targetTier,
              billingCycle,
              couponCode: couponResult?.code
            });

            if (verifyRes.success) {
              toast.success(`🎉 Upgraded to ${tierName}!`);
              if (onSuccess) onSuccess();
              onClose();
              window.location.reload();
            }
          } catch (verifyErr: any) {
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        toast.error(resp.error?.description || 'Payment was cancelled or failed');
      });
      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl border border-violet-500/30 bg-[#0e0c18] p-6 sm:p-8 text-zinc-100 shadow-2xl shadow-violet-600/20 overflow-hidden">
        {/* Glow Accent */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
            <Lock className="h-3 w-3 text-violet-400" />
            {featureName} Locked
          </div>
          <h2 className="text-2xl font-extrabold text-white">Upgrade to {tierName}</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{reason}</p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          <button
            type="button"
            onClick={() => {
              setBillingCycle('annual');
              setCouponResult(null);
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              isAnnual
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Annual Billing
            <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300">
              Save 25%
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setBillingCycle('monthly');
              setCouponResult(null);
            }}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              !isAnnual
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
        </div>

        {/* Price & Perks Highlight */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-extrabold text-white">
                ₹{currentPrice.toLocaleString()}
              </span>
              <span className="text-xs text-zinc-400 ml-1">
                {isAnnual ? '/ year' : '/ month'}
              </span>
            </div>
            {discountAmount > 0 && (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ₹{discountAmount} Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>1,50,000 Photos Allowance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Google Drive Auto-Sync</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>2 Full Years Guest Gallery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>2 Photographer Logins</span>
            </div>
          </div>
        </div>

        {/* Discount Coupon Form */}
        <form onSubmit={handleApplyCoupon} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Promo code (e.g. STUDIO20)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={applyingCoupon || !couponCode.trim()}
            className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 transition disabled:opacity-40"
          >
            {applyingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
          </button>
        </form>

        {/* Action Button */}
        <div className="mt-6 space-y-2">
          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkingOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 hover:from-violet-500 hover:to-indigo-500 transition disabled:opacity-50"
          >
            {checkingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing Checkout…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-current" />
                Upgrade to {tierName} (₹{currentPrice.toLocaleString()})
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-zinc-500">
            Instant activation • Secure payment via UPI, Cards, NetBanking
          </p>
        </div>
      </div>
    </div>
  );
}
