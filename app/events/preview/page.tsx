'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Calendar, 
  MapPin, 
  Lock, 
  Download, 
  Maximize2, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

interface PreviewPhoto {
  imageId: string;
  url: string;
  confidence: number;
  matchedAt: string;
}

interface PreviewData {
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    venue: string;
    coverImage?: string;
  };
  photos: PreviewPhoto[];
  totalCount: number;
  expiresAt: string;
}

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PreviewData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalType, setModalType] = useState<'download' | 'fullscreen'>('download');

  useEffect(() => {
    if (!token) {
      setError('Invalid preview token. Please verify your link.');
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
        const res = await fetch(`${baseUrl}/previews?token=${token}`);
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Failed to load preview gallery.');
        }

        const previewData = await res.json();
        setData(previewData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [token]);

  const handleActionClick = (type: 'download' | 'fullscreen') => {
    setModalType(type);
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-zinc-400 font-medium animate-pulse">Loading your personalized preview...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md text-center py-16 px-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-6">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Preview Link Expired</h2>
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          {error || 'This preview link is invalid or has expired. Guest preview links expire after 7 days.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Sign In to Account
          </button>
          <button 
            onClick={() => router.push('/register')}
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold transition-colors"
          >
            Register Free
          </button>
        </div>
      </div>
    );
  }

  const { event, photos, totalCount } = data;

  return (
    <div className="space-y-10 py-6 max-w-5xl mx-auto px-4">
      {/* Event Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center">
        {event.coverImage ? (
          <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={event.coverImage} 
              alt={event.name} 
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="w-full md:w-48 h-32 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-500 flex-shrink-0">
            No Cover Image
          </div>
        )}
        
        <div className="flex-1 text-center md:text-left space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full">
            Guest Preview Link
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{event.name}</h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Calendar size={16} />
              {new Date(event.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={16} />
              {event.venue}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 bg-white/5 border border-white/5 p-4 rounded-2xl text-center min-w-[120px]">
          <span className="text-3xl font-extrabold text-white">{totalCount}</span>
          <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-1">Matched Photos</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Your Preview Album</h2>
          <p className="text-xs text-zinc-400 mt-1">We found these matching photos of you. Sign in to download or view full-screen.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div 
              key={photo.imageId}
              className="relative group aspect-square rounded-2xl overflow-hidden border border-white/5 bg-zinc-900 shadow-md transition-all duration-300 hover:border-indigo-500/35 hover:-translate-y-1"
            >
              {/* Blur Overlay & Buttons on Hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex flex-col justify-center items-center gap-3 p-4">
                <button 
                  onClick={() => handleActionClick('fullscreen')}
                  className="flex items-center gap-1.5 px-4 py-2 w-full max-w-[140px] justify-center rounded-xl bg-white text-zinc-900 font-bold text-xs shadow hover:bg-zinc-100 transition-all"
                >
                  <Maximize2 size={14} />
                  Full-Screen
                </button>
                <button 
                  onClick={() => handleActionClick('download')}
                  className="flex items-center gap-1.5 px-4 py-2 w-full max-w-[140px] justify-center rounded-xl bg-indigo-600 text-white font-bold text-xs shadow hover:bg-indigo-500 transition-all"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>

              {/* Watermark symbol overlay */}
              <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-md p-1.5 rounded-full border border-white/10 text-white/60 pointer-events-none">
                <Lock size={12} />
              </div>

              {/* Image element */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={photo.url} 
                alt="Matched guest preview" 
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Re-engagement Footer Callout */}
      <div className="rounded-3xl border border-white/5 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 p-8 text-center space-y-6 max-w-xl mx-auto border-dashed border-indigo-500/20">
        <h3 className="text-xl font-bold text-white">Want to unlock your entire album?</h3>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
          We have indexed all photos from this event. Create a free account or sign in now to get high-resolution copies of all your matched photos!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => router.push('/register')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/10"
          >
            Create Free Account
            <ArrowRight size={16} />
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all"
          >
            Log In
          </button>
        </div>
      </div>

      {/* Auth Prompt Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-medium"
            >
              ✕
            </button>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-2">
                <Lock size={20} />
              </div>
              <h4 className="text-lg font-bold text-white tracking-tight">
                {modalType === 'download' ? 'Sign In to Download' : 'Sign In for Full-Screen'}
              </h4>
              <p className="text-sm text-zinc-400 leading-relaxed">
                To protect privacy and access high-resolution images, you need to sign in or create an account.
              </p>
              <div className="pt-4 flex flex-col gap-3">
                <button 
                  onClick={() => router.push(`/register?redirect=/events/preview?token=${token}`)}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all"
                >
                  Register Account
                </button>
                <button 
                  onClick={() => router.push(`/login?redirect=/events/preview?token=${token}`)}
                  className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm transition-all"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-zinc-400 font-medium animate-pulse">Initializing preview page...</p>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
