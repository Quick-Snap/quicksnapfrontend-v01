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

const statShell =
  'border-zinc-200/80 bg-gradient-to-br from-white via-zinc-50/90 to-white shadow-sm shadow-zinc-900/5 dark:border-white/10 dark:from-[#121022] dark:via-[#0d0c19] dark:to-[#0b0a14] dark:shadow-none';

export default function PhotographerDashboard() {
  const { data: eventsData, isLoading } = useQuery('photographerEvents', () => eventApi.getMyAssignedEvents());

  const events = eventsData?.data || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 p-8 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-gradient-to-br dark:from-[#181025] dark:via-[#0f0b1d] dark:to-[#0a0d1e] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-25 dark:opacity-60" />
        <div className="absolute -bottom-10 -left-12 h-64 w-64 bg-violet-300/35 blur-3xl dark:bg-violet-500/20" />
        <div className="absolute right-0 top-0 h-72 w-72 bg-indigo-300/25 blur-3xl dark:bg-indigo-500/15" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50/90 px-3 py-1.5 text-sm text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-white">
              <Camera className="h-4 w-4 text-violet-600 dark:text-violet-200" />
              Photographer Workspace
            </div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-4xl">
              Bulk upload · Auto-recognition
            </h1>
            <p className="max-w-2xl text-zinc-600 dark:text-gray-300">
              Calm, focused UI matching the landing theme. Upload, moderate, and deliver AI-matched photos effortlessly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/photographer/upload">
              <Button className="border border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-500/20 hover:bg-violet-500 dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_35px_rgba(0,0,0,0.3)] dark:hover:bg-white/10">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Upload (RAW)
              </Button>
            </Link>
            <Link href="/admin/moderate">
              <Button
                variant="outline"
                className="border-zinc-300 text-zinc-800 hover:bg-zinc-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
              >
                <Eye className="mr-2 h-4 w-4" />
                Review Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick pipeline explainer */}
      <div className="grid gap-4 md:grid-cols-3">
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
            <div key={idx} className={`stat-card group ${statShell}`}>
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.iconBg} transition-transform group-hover:scale-110`}
              >
                <Icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <p className="mb-2 font-semibold text-zinc-900 dark:text-white">{item.title}</p>
              <p className="text-sm text-zinc-600 dark:text-gray-400">{item.desc}</p>
              <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${item.gradient}`} />
            </div>
          );
        })}
      </div>

      {/* Events to target */}
      <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:border-white/5 dark:bg-[#0f0c18] dark:shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/10">
              <FolderOpen className="h-5 w-5 text-violet-700 dark:text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Active events to upload to</h2>
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
                className="group rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-violet-300/70 hover:shadow-md dark:border-white/5 dark:bg-[#14101f] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] dark:hover:border-violet-500/30"
              >
                <div className="mb-3 flex items-start justify-between">
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
          <div className="rounded-xl border border-zinc-200/90 bg-zinc-50/80 py-12 text-center text-zinc-500 dark:border-white/5 dark:bg-[#14101f] dark:text-gray-400">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-zinc-400 dark:text-gray-600" />
            <p>No active events right now. Check back soon or ask an organizer to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
