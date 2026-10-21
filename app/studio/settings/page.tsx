'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Camera, Settings, ShieldCheck, Sparkles, User } from 'lucide-react';
import { Button } from '@/app/components/ui/Button';

export default function StudioSettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Studio Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your photography studio profile and delivery preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-[#10131d]/90 p-6 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-white/[0.08]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25">
            <Camera size={26} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{user?.name || 'Studio Owner'}</h2>
            <p className="text-xs text-zinc-400">{user?.email}</p>
            <span className="inline-block mt-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-300 uppercase">
              {user?.role || 'Photographer'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Studio / Business Name
              </label>
              <input
                type="text"
                defaultValue={user?.name}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                placeholder="e.g. Royal Heritage Photography"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                defaultValue={user?.phone || ''}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white focus:border-violet-500 focus:outline-none"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 p-4 text-xs text-zinc-400 space-y-1">
          <p className="font-semibold text-violet-300 flex items-center gap-1.5">
            <ShieldCheck size={15} />
            <span>Fast Web Proofing &amp; Watermarking Protection</span>
          </p>
          <p className="leading-relaxed">
            When you upload photos in Fast Web mode, web previews are compressed (~500KB) and unwatermarked original masters remain protected on your computer until client finalization.
          </p>
        </div>
      </div>
    </div>
  );
}
