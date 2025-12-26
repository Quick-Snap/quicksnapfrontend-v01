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
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-8 shadow-2xl shadow-indigo-500/20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm mb-3 border border-white/10">
              <Camera className="h-4 w-4" />
              Photographer Workspace
            </div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              Bulk upload • Auto-recognition
            </h1>
            <p className="text-indigo-100 mt-2">
              Push up to 100 RAW images per batch. Lambda + Rekognition handle moderation,
              detection, and matching automatically.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/photographer/upload">
              <Button className="bg-white/10 backdrop-blur-sm border border-white/10 text-white hover:bg-white/20">
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
            <div key={idx} className="stat-card group">
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
      <div className="card">
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
                className="group bg-white/5 border border-white/5 rounded-xl p-5 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-white line-clamp-2 group-hover:text-violet-400 transition-colors">{event.name}</p>
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
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
          <div className="text-center py-12 text-gray-400">
            <FolderOpen className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p>No active events right now. Check back soon or ask an organizer to create one.</p>
          </div>
        )}
      </div>

    </div>
  );
}
