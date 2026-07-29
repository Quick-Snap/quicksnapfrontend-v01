'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, UserPlus, ArrowRight, Camera, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SpottedPreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const photoId = params?.photoId as string;
  const referredBy = searchParams?.get('referredBy') || '';

  const backendApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
  const previewImageUrl = `${backendApi}/api/photos/${photoId}/spotted-preview`;

  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-500/30">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">QuickSnap</span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-5 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3.5 py-1.5 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/20">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>You&apos;ve Been Spotted!</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
              Someone spotted you in a photo!
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Your friend shared a photo where you appear. Sign up or log in to unblur your photo and unlock instant face matching!
            </p>
          </div>

          {/* Blurred preview container */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-inner group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImageUrl}
              alt="Spotted preview"
              crossOrigin="anonymous"
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition duration-500 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            )}
            
            {/* Overlay badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
                <EyeOff className="h-4 w-4 text-violet-400" />
                <span>Faces blurred for privacy</span>
              </div>
            </div>
          </div>

          {/* CTA actions */}
          <div className="space-y-3 pt-2">
            {user ? (
              <Link
                href="/photos"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 active:scale-[0.98]"
              >
                Go to My Photos
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href={`/register${referredBy ? `?referredBy=${referredBy}` : ''}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up & Unlock My Photos
                </Link>
                <Link
                  href="/login"
                  className="block text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Already have an account? Log in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Security footer note */}
        <p className="text-center text-xs text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>QuickSnap uses AI face recognition to automatically deliver your photos securely.</span>
        </p>
      </div>
    </main>
  );
}
