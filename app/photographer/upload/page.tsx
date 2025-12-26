'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from 'react-query';
import {
  ArrowLeft,
  CheckCircle2,
  UploadCloud as CloudUpload,
  Image as ImageIcon,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
  Camera
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import ImageUploader from '../../components/upload/ImageUploader';
import { eventApi } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function PhotographerUploadPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const eventIdFromUrl = searchParams.get('eventId');
  
  const [selectedEvent, setSelectedEvent] = useState('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const { data: eventsData, isLoading: eventsLoading } = useQuery(
    ['photographer-events'],
    () => eventApi.getAll({ isActive: true, limit: 50 }),
    { enabled: !!user }
  );

  // Pre-select event from URL query parameter
  useEffect(() => {
    if (eventIdFromUrl && !selectedEvent) {
      setSelectedEvent(eventIdFromUrl);
    }
  }, [eventIdFromUrl, selectedEvent]);

  // Handle both array response and paginated response { events: [], ... }
  const rawData = eventsData?.data;
  const allEvents = Array.isArray(rawData)
    ? rawData
    : (Array.isArray(rawData?.events) ? rawData.events : []);

  // Filter events based on user assignment
  const events = allEvents.filter((event: any) => {
    // Admin can see everything
    if (user?.roles?.includes('admin')) return true;

    const isOrganizer = event.organizer === user?.id || event.organizer?._id === user?.id;
    const isPhotographer = event.photographers?.some((p: any) =>
      (typeof p === 'string' ? p === user?.id : p._id === user?.id)
    );

    return isOrganizer || isPhotographer;
  });

  const handleUploadComplete = (photos: any[]) => {
    setUploadedCount(photos.length);
    setUploadComplete(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#111111] rounded-2xl p-8 border border-white/10 text-center shadow-2xl">
          <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-8 w-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Sign in required</h1>
          <p className="text-gray-400 mb-6">
            Photographers need to be authenticated before uploading to the RAW S3 bucket.
          </p>
          <Link href="/login">
            <Button className="w-full btn-gradient">Go to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-violet-400 bg-violet-500/10 px-4 py-1.5 rounded-full w-fit mb-4 border border-violet-500/20">
              <Camera className="h-4 w-4" />
              Photographer RAW Ingest
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Bulk Upload to S3</h1>
            <p className="text-gray-400 mt-3 max-w-2xl leading-relaxed">
              Drop full-size shots, let multer stream them into the RAW bucket, and AWS Lambda +
              Rekognition take over. Perfect for campus/event photographers moving large batches fast.
            </p>
          </div>
          <Link 
            href="/events" 
            className="hidden sm:inline-flex items-center text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to events
          </Link>
        </div>

        {/* Status cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 hover:border-blue-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                <Layers className="h-5 w-5 text-blue-400" />
              </div>
              <p className="font-semibold text-white">Multer → S3 RAW</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              In-memory multer pipeline pushes files straight to the RAW bucket with event + uploader
              metadata.
            </p>
          </div>
          <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 hover:border-violet-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Sparkles className="h-5 w-5 text-violet-400" />
              </div>
              <p className="font-semibold text-white">Lambda + Rekognition</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              S3 event triggers Lambda to run moderation, face detection, and user matching in minutes.
            </p>
          </div>
          <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 hover:border-emerald-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="font-semibold text-white">Database sync</p>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              DynamoDB + Mongo capture image metadata, event linkage, and user visibility once matches land.
            </p>
          </div>
        </div>

        {/* Event selection and upload */}
        <div className="bg-[#111111] rounded-2xl border border-white/5 p-6 md:p-8 space-y-6">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Choose event destination
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 bg-white/5 text-white transition-all outline-none"
                disabled={eventsLoading}
              >
                <option value="" className="bg-[#1a1a1a]">Select an event...</option>
                {events.map((event: any) => (
                  <option key={event._id} value={event._id} className="bg-[#1a1a1a]">
                    {event.name}
                  </option>
                ))}
              </select>
              {eventsLoading && <p className="text-sm text-gray-500 mt-3">Loading events…</p>}
              {!eventsLoading && events.length === 0 && (
                <p className="text-sm text-amber-400 mt-3">
                  No active events found. Create one first from organizer tools.
                </p>
              )}
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
              <p className="text-sm font-semibold text-white mb-3">Pipeline checklist</p>
              <ul className="text-sm text-gray-300 space-y-3">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Multer memory storage enabled (10MB per file, 50 max).</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>RAW bucket S3 notification wired to Lambda processor.</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Rekognition collections warm for face matching.</span>
                </li>
              </ul>
            </div>
          </div>

          {uploadComplete && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-300 text-lg">
                    {uploadedCount} {uploadedCount === 1 ? 'photo' : 'photos'} uploaded to RAW bucket
                  </p>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    Lambda is now processing the batch: moderation → face detection → user matches →
                    DynamoDB write-back. Users see their photos once matching completes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!uploadComplete && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Upload photos</h2>
              </div>
              {selectedEvent ? (
                <ImageUploader
                  eventId={selectedEvent}
                  onUploadComplete={handleUploadComplete}
                  maxFiles={100}
                />
              ) : (
                <div className="rounded-xl border-2 border-dashed border-white/10 p-10 text-center bg-white/5 hover:border-violet-500/30 transition-all">
                  <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CloudUpload className="h-8 w-8 text-violet-400" />
                  </div>
                  <p className="text-white font-medium mb-2">Select an event to start uploading</p>
                  <p className="text-sm text-gray-500 mb-5">
                    Files flow through multer to AWS S3 RAW. Lambda picks them up automatically.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-amber-400 bg-amber-500/10 px-4 py-2 rounded-lg w-fit mx-auto border border-amber-500/20">
                    <Zap className="h-4 w-4" />
                    <span>Tip: group uploads by event for faster reconciliation.</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Flow explainer */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: '1) Upload',
              desc: 'Photographer drops up to 100 images; multer validates type and size before streaming.',
              icon: CloudUpload,
              color: 'blue'
            },
            {
              title: '2) Process',
              desc: 'S3 event triggers Lambda → Rekognition for moderation + face indexing and matching.',
              icon: Sparkles,
              color: 'violet'
            },
            {
              title: '3) Deliver',
              desc: 'Matched users and events are persisted to DynamoDB + Mongo, then surfaced in galleries.',
              icon: CheckCircle2,
              color: 'emerald'
            }
          ].map((item, idx) => {
            const Icon = item.icon;
            const colorClasses = {
              blue: 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20',
              violet: 'bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20',
              emerald: 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'
            };
            return (
              <div key={idx} className="bg-[#111111] rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="font-semibold text-white mb-2">{item.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 rounded-2xl p-8 shadow-2xl shadow-violet-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTZzLTItNC0yLTYgMi00IDItNi0yLTQtMi02bDIgMmMwIDItMiA0LTIgNnMyIDQgMiA2LTIgNC0yIDYgMiA0IDIgNmwtMi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-2xl font-bold text-white mb-2">Ready to push your next batch?</p>
              <p className="text-violet-200">
                Files land in S3 RAW with event + uploader context; Lambda handles the rest.
              </p>
            </div>
            <Button
              onClick={() => {
                const selector = document.querySelector('select');
                selector?.focus();
              }}
              className="bg-white hover:bg-gray-100 text-violet-700 font-semibold px-6 py-3 rounded-xl shadow-lg transition-all shrink-0"
            >
              Pick event & upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
