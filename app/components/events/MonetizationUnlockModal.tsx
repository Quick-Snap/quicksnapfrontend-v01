'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  Users,
  User,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { eventMonetizationApi } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';
import toast from 'react-hot-toast';

interface MonetizationUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName?: string;
  isFaceMismatch?: boolean;
  attendeePriceINR?: number;
  circlePassPriceINR?: number;
  selectedCircleId?: string;
  circleName?: string;
  onSuccess: () => void;
}

export function MonetizationUnlockModal({
  isOpen,
  onClose,
  eventId,
  eventName = 'Event Gallery',
  isFaceMismatch = false,
  attendeePriceINR = 49,
  circlePassPriceINR = 99,
  selectedCircleId,
  circleName,
  onSuccess,
}: MonetizationUnlockModalProps) {
  const [passType, setPassType] = useState<'individual' | 'circle'>(
    selectedCircleId ? 'circle' : 'individual'
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const currentPrice = passType === 'circle' ? circlePassPriceINR : attendeePriceINR;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Create Checkout Order
      const res = await eventMonetizationApi.checkoutPass(eventId, {
        passType,
        circleId: passType === 'circle' ? selectedCircleId : undefined,
      });

      if (!res.success || !res.data?.orderId) {
        throw new Error(res.message || 'Failed to initiate pass checkout');
      }

      const orderId = res.data.orderId;

      // 2. Complete / Verify Payment (Seamless simulation / Cashfree capture)
      const verifyRes = await eventMonetizationApi.verifyPass(eventId, {
        orderId,
        gatewayPaymentId: `pay_${Date.now()}`,
      });

      if (verifyRes.success) {
        toast.success(
          passType === 'circle'
            ? '🎉 Squad Pass Unlocked! All circle & personal photos are now clean and downloadable for your squad!'
            : '🎉 Photo Pass Unlocked! High-resolution clean downloads are now enabled!',
          { duration: 5000 }
        );
        onSuccess();
        onClose();
      } else {
        throw new Error(verifyRes.message || 'Payment verification failed');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.message || err.message || 'Payment checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-[#121217] text-white shadow-2xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-white/10 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-semibold text-violet-300 border border-violet-400/30">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              Official Gallery Pass
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Unlock Pristine Photos
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 truncate max-w-[320px] sm:max-w-md">
              {eventName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {isFaceMismatch && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-xs text-amber-300 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">New face registered!</p>
              <p className="mt-0.5 text-amber-300/90">
                Your previous pass was biometrically licensed for your original selfie. You can unlock clean downloads for this new face below, or restore your previous selfie.
              </p>
            </div>
          </div>
        )}

        {/* Pass Selector Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-3 p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            type="button"
            onClick={() => setPassType('individual')}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition text-center ${
              passType === 'individual'
                ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <User className="h-5 w-5 mb-1" />
            <span className="text-xs font-bold">Individual Pass</span>
            <span className="text-sm font-extrabold mt-0.5">₹{attendeePriceINR}</span>
          </button>

          <button
            type="button"
            onClick={() => setPassType('circle')}
            className={`relative flex flex-col items-center justify-center p-3 rounded-xl transition text-center ${
              passType === 'circle'
                ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Save 60%
            </span>
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs font-bold">Squad Circle Pass</span>
            <span className="text-sm font-extrabold mt-0.5">₹{circlePassPriceINR}</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-5 space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-xs">
          {passType === 'individual' ? (
            <>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Unlimited watermark-free downloads for all your event photos</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Original full-resolution camera quality (RAW &amp; 1920px WebP)</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-violet-400 shrink-0" />
                <span>Biometric face license bound permanently to your account</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  Unlocks for up to <strong>5 members</strong> in your Circle
                  {circleName ? ` (${circleName})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>All mutual group moments + individual photos in each member’s account</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Strict privacy preserved: Private solo photos remain in individual accounts</span>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={handleCheckout}
            loading={loading}
            className={`w-full py-3.5 text-base font-bold text-white shadow-xl ${
              passType === 'circle'
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
                : 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/30'
            }`}
          >
            Unlock Now for ₹{currentPrice}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" />
            One-time payment • Instant activation • No recurring subscription
          </p>
        </div>
      </div>
    </div>
  );
}

export default MonetizationUnlockModal;
