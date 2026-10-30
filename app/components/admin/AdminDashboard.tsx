'use client';

import { useQuery } from 'react-query';
import { Shield, Clock, CheckCircle, XCircle, Sparkles, Tag, Building2 } from 'lucide-react';
import Link from 'next/link';
import { adminOrganizerRequestApi } from '@/lib/api';
import { softSurface } from '@/lib/dashboardUi';
import AIEngineControlCard from './AIEngineControlCard';

export default function AdminDashboard() {
  const { data: statsData } = useQuery('organizerRequestStats', () =>
    adminOrganizerRequestApi.stats()
  );

  const stats = statsData?.data || { pending: 0, approved: 0, rejected: 0, cancelled: 0, total: 0 };

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="relative overflow-hidden rounded-[1.65rem] border border-violet-400/30 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 shadow-[0_24px_70px_-20px_rgba(91,33,182,0.55)] sm:rounded-3xl sm:p-9 md:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-100" />
              <span className="text-sm font-medium text-violet-100">Admin Control Center</span>
            </div>
            <h1 className="mb-2 flex flex-wrap items-center gap-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              <Shield className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />
              Organizer Controls
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-violet-100/95 sm:text-base">
              Browse studios and shoots by organizer, configure bespoke enterprise plans, and manage platform permissions.
            </p>
          </div>
          {stats.pending > 0 && (
            <div className="w-full rounded-2xl border border-amber-400/30 bg-amber-500/20 px-4 py-3 backdrop-blur-md md:max-w-xs md:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-100/80">Awaiting review</p>
              <p className="mt-1 text-2xl font-bold text-amber-100">{stats.pending} pending</p>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.pending}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/10">
              <Clock className="h-6 w-6 text-amber-700 dark:text-amber-400" />
            </div>
          </div>
        </div>

        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Approved</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.approved}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/10">
              <CheckCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Rejected</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.rejected}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/10">
              <XCircle className="h-6 w-6 text-red-700 dark:text-red-400" />
            </div>
          </div>
        </div>

        <div className={`group p-5 ${softSurface}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-sm text-zinc-500 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
              <Shield className="h-6 w-6 text-violet-700 dark:text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* AI Face Recognition Dual-Engine Control & Stats */}
      <AIEngineControlCard />

      <section className={`p-5 sm:p-8 ${softSurface}`}>
        <h2 className="mb-5 text-lg font-semibold text-zinc-900 dark:text-white sm:text-xl">Organizer & Platform Controls</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin?tab=directory" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 transition-colors group-hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:group-hover:bg-emerald-500/20">
              <Building2 className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                Studios & Events Directory
              </p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">
                Browse studios and all events sorted by organizer
              </p>
            </div>
          </Link>

          <Link href="/admin?tab=custom_plans" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 transition-colors group-hover:bg-indigo-200/80 dark:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20">
              <Sparkles className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                Custom Plans & AI Pricing
              </p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">
                Configure bespoke quotas & Razorpay payment links
              </p>
            </div>
          </Link>

          <Link href="/admin?tab=coupons" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 transition-colors group-hover:bg-amber-200/80 dark:bg-amber-500/10 dark:group-hover:bg-amber-500/20">
              <Tag className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                Discount Coupons
              </p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">
                Create promotional promo codes for checkout
              </p>
            </div>
          </Link>

          <Link href="/admin?tab=requests" className="action-card group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 transition-colors group-hover:bg-violet-200/80 dark:bg-violet-500/10 dark:group-hover:bg-violet-500/20">
              <Shield className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                Organizer Requests
                {stats.pending > 0 && (
                  <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
                    {stats.pending}
                  </span>
                )}
              </p>
              <p className="text-sm text-zinc-500 dark:text-gray-400">
                Approve or reject pending organizer access
              </p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
