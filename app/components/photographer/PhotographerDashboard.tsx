'use client';

import Link from 'next/link';
import { useQuery } from 'react-query';
import { eventApi } from '@/lib/api';
import {
  Camera,
  UploadCloud as CloudUpload,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { format } from 'date-fns';
import { softSurface, softSurfaceHover } from '@/lib/dashboardUi';

export default function PhotographerDashboard() {
  const { data: eventsData, isLoading } = useQuery('photographerEvents', () => eventApi.getMyAssignedEvents());

  const events = eventsData?.data || [];

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Header */}
      <header className="relative overflow-hidden rounded-[1.65rem] bg-gradient-to-br from-violet-50/98 via-white to-indigo-50/90 p-6 shadow-[0_20px_60px_-28px_rgba(91,33,182,0.28)] ring-1 ring-violet-200/60 dark:from-[#1a1428] dark:via-[#120f1c] dark:to-[#0c1222] dark:shadow-[0_28px_80px_-20px_rgba(0,0,0,0.65)] dark:ring-white/[0.08] sm:rounded-3xl sm:p-9">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-[0.35] dark:opacity-50" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-56 w-56 rounded-full bg-violet-400/25 blur-3xl dark:bg-violet-500/15" />
        <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/12" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm shadow-sm ring-1 ring-zinc-900/[0.06] dark:bg-white/[0.07] dark:ring-white/10">
              <Camera className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" />
              <span className="text-zinc-800 dark:text-white">Photographer</span>
            </div>
            <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-3xl md:text-4xl">
              Upload &amp; deliver
            </h1>
            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-gray-400">
              RAW uploads, moderation, and AI-matched delivery — built for fast workflows on laptop or phone.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/photographer/upload" className="w-full sm:w-auto">
              <Button className="w-full border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 sm:w-auto">
                <Upload className="mr-2 h-4 w-4" />
                Bulk upload
              </Button>
            </Link>
            <Link href="/admin/moderate" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10 sm:w-auto">
                <Eye className="mr-2 h-4 w-4" />
                Review queue
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Quick pipeline explainer */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {[
          {
            title: 'Upload (≤50)',
            desc: 'Drop JPG/PNG/WEBP; multer streams to S3 RAW with event + uploader metadata.',
            icon: CloudUpload,
            gradient: 'from-blue-500 to-blue-400',
            iconBg: 'bg-blue-100 dark:bg-blue-500/10',
            iconColor: 'text-blue-700 dark:text-blue-400',
          },
          {
            title: 'Lambda + Rekognition',
            desc: 'S3 event triggers moderation + face detection + collection match.',
            icon: Sparkles,
            gradient: 'from-violet-500 to-violet-400',
            iconBg: 'bg-violet-100 dark:bg-violet-500/10',
            iconColor: 'text-violet-700 dark:text-violet-400',
          },
          {
            title: 'Delivery & review',
            desc: 'Matched photos surface to users. Public-safe items show in event galleries.',
            icon: ShieldCheck,
            gradient: 'from-emerald-500 to-emerald-400',
            iconBg: 'bg-emerald-100 dark:bg-emerald-500/10',
            iconColor: 'text-emerald-700 dark:text-emerald-400',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`group p-5 ${softSurface}`}>
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg} transition-transform group-hover:scale-110`}
              >
                <Icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <p className="mb-2 font-semibold text-zinc-900 dark:text-white">{item.title}</p>
              <p className="text-sm text-zinc-600 dark:text-gray-400">{item.desc}</p>
              <div className={`mt-4 h-0.5 rounded-full bg-gradient-to-r ${item.gradient}`} />
            </div>
          );
        })}
      </div>

      {/* Events to target */}
      <section className={`p-5 sm:p-8 ${softSurface}`}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/10">
              <FolderOpen className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-gray-500">Assignments</p>
              <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl dark:text-white">Events you can upload to</h2>
            </div>
          </div>
          <Link
            href="/events"
            className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
          >
            View all events →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 text-zinc-500 dark:text-gray-400">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600 dark:border-white/20 dark:border-t-violet-500" />
            Loading events…
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event: any) => (
              <div
                key={event._id}
                className={`group relative overflow-hidden p-5 ${softSurface} ${softSurfaceHover}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-90" />
                <div className="mb-3 flex items-start justify-between pt-1">
                  <p className="line-clamp-2 font-semibold text-zinc-900 transition-colors group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-400">
                    {event.name}
                  </p>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
                    Active
                  </span>
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-zinc-600 dark:text-gray-400">{event.description}</p>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-gray-500">
                    <ImageIcon className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-zinc-600 dark:text-gray-400">{event.photos?.length || 0} photos</span>
                  </p>
                  <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-gray-500">
                    <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-zinc-600 dark:text-gray-400">{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                  </p>
                </div>
                <Link
                  href={`/photographer/upload?eventId=${event._id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-600 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  <Upload className="h-4 w-4" />
                  Upload to this event
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-zinc-50/90 py-12 text-center text-zinc-600 ring-1 ring-zinc-900/[0.05] dark:bg-white/[0.04] dark:text-gray-400 dark:ring-white/10">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-zinc-400 dark:text-gray-600" />
            <p>No active events right now. Check back soon or ask an organizer to create one.</p>
          </div>
        )}
      </section>
    </div>
  );
}
