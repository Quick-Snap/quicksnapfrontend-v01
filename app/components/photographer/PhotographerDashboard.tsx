'use client';

import Link from 'next/link';
import { useQuery } from 'react-query';
import { eventApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  Camera,
  UploadCloud as CloudUpload,
  Eye,
  FolderOpen,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { format } from 'date-fns';

export default function PhotographerDashboard() {
  const { user } = useAuth();
  const { data: eventsData, isLoading } = useQuery('photographerEvents', () =>
    eventApi.getMyAssignedEvents()
  );

  const events = eventsData?.data || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl p-8 border border-white/5 bg-gradient-to-br from-[#181025] via-[#0f0b1d] to-[#0a0d1e] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="absolute -left-12 -bottom-10 w-64 h-64 bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-500/15 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-full text-sm">
              <Camera className="h-4 w-4 text-violet-200" />
              Photographer Workspace
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white flex items-center gap-2 tracking-tight">
              Bulk upload · Auto-recognition
            </h1>
            <p className="text-gray-300 max-w-2xl">
              Calm, focused UI matching the landing theme. Upload, moderate, and deliver AI-matched photos effortlessly.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/photographer/upload">
              <Button className="bg-white/5 border border-white/10 text-white hover:bg-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.3)]">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload (RAW)
              </Button>
            </Link>
            <Link href="/admin/moderate">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 hover:text-white">
                <Eye className="h-4 w-4 mr-2" />
                Review Queue
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick pipeline explainer */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: 'Upload (≤100)',
            desc: 'Drop JPG/PNG/WEBP; multer streams to S3 RAW with event + uploader metadata.',
            icon: CloudUpload,
            gradient: 'from-blue-500 to-blue-400',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-400'
          },
          {
            title: 'Lambda + Rekognition',
            desc: 'S3 event triggers moderation + face detection + collection match.',
            icon: Sparkles,
            gradient: 'from-violet-500 to-violet-400',
            iconBg: 'bg-violet-500/10',
            iconColor: 'text-violet-400'
          },
          {
            title: 'Delivery & review',
            desc: 'Matched photos surface to users. Public-safe items show in event galleries.',
            icon: ShieldCheck,
            gradient: 'from-emerald-500 to-emerald-400',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-400'
          }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="stat-card group bg-gradient-to-br from-[#121022] via-[#0d0c19] to-[#0b0a14] border-white/10">
              <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`h-6 w-6 ${item.iconColor}`} />
              </div>
              <p className="font-semibold text-white mb-2">{item.title}</p>
              <p className="text-sm text-gray-400">{item.desc}</p>
              <div className={`h-1 mt-4 bg-gradient-to-r ${item.gradient} rounded-full`}></div>
            </div>
          );
        })}
      </div>

      {/* Events to target */}
      <div className="card bg-[#0f0c18] border-white/5 shadow-[0_14px_50px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-violet-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Active events to upload to</h2>
          </div>
          <Link href="/events" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
            View all events →
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <div className="h-5 w-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            Loading events…
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event: any) => (
              <div
                key={event._id}
                className="group bg-[#0f0c18] border border-white/5 rounded-xl p-5 hover:border-violet-500/30 hover:-translate-y-1 transition-all shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-white line-clamp-2 group-hover:text-violet-400 transition-colors">{event.name}</p>
                  <span className="text-xs text-emerald-200 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2">{event.description}</p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-violet-400" />
                    <span className="text-gray-400">{event.photos?.length || 0} photos</span>
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-gray-400">{format(new Date(event.startDate), 'MMM dd, yyyy')}</span>
                  </p>
                </div>
                <Link
                  href={`/photographer/upload?eventId=${event._id}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload to this event
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 bg-[#0f0c18] rounded-xl border border-white/5">
            <FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p>No active events right now. Check back soon or ask an organizer to create one.</p>
          </div>
        )}
      </div>

    </div>
  );
}
