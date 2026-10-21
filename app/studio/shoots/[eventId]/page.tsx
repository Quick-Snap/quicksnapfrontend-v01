'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { eventApi } from '@/lib/api';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Layers,
  Copy,
  Download,
  Check,
  Upload,
  ExternalLink,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  FolderDown
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import toast from 'react-hot-toast';

export default function ShootProofingPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'album' | 'bookmark' | 'combined'>('combined');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Fetch Event Details
  const { data: eventData, isLoading: eventLoading } = useQuery(['eventDetails', eventId], () =>
    eventApi.getById(eventId)
  );
  const shoot = eventData?.data;

  // Fetch Event Selections (❤️ Album and 🔖 Keepers)
  const { data: selectionsData, isLoading: selLoading, refetch } = useQuery(
    ['eventSelections', eventId],
    () => eventApi.getSelections(eventId),
    {
      enabled: !!eventId,
      refetchInterval: 15000, // Auto-refresh every 15s to catch live client updates
    }
  );

  const selections = selectionsData?.data;
  const albumFavorites = useMemo(() => selections?.albumFavorites || [], [selections?.albumFavorites]);
  const originalRequests = useMemo(() => selections?.originalRequests || [], [selections?.originalRequests]);
  const combinedPhotos = useMemo(() => selections?.combined || [], [selections?.combined]);

  const albumCount = selections?.counts?.albumCount || albumFavorites.length;
  const originalCount = selections?.counts?.originalCount || originalRequests.length;
  const combinedCount = selections?.counts?.combinedCount || combinedPhotos.length;

  const currentDisplayPhotos = useMemo(() => {
    if (activeTab === 'album') return albumFavorites;
    if (activeTab === 'bookmark') return originalRequests;
    return combinedPhotos;
  }, [activeTab, albumFavorites, originalRequests, combinedPhotos]);

  /** Copy filenames formatted as comma-separated or newline string */
  const handleCopyFilenames = (photos: any[], label: string) => {
    if (!photos || photos.length === 0) {
      toast.error(`No photos in ${label} to copy`);
      return;
    }
    // Clean base filenames (e.g. without path)
    const list = photos
      .map((p) => p.fileName || p.imageId || '')
      .filter(Boolean)
      .join(', ');

    navigator.clipboard.writeText(list);
    setCopiedType(label);
    toast.success(`Copied ${photos.length} filenames to clipboard!`, { duration: 3000 });
    setTimeout(() => setCopiedType(null), 2500);
  };

  /** Download filenames as a .txt file */
  const handleDownloadTxt = (photos: any[], filename: string) => {
    if (!photos || photos.length === 0) {
      toast.error('No photos to export');
      return;
    }
    const content = photos
      .map((p) => p.fileName || p.imageId || '')
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}!`);
  };

  const isLoading = eventLoading || selLoading;

  return (
    <div className="space-y-8">
      {/* Top Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/studio"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back to All Shoots</span>
        </Link>

        {shoot && (
          <div className="flex items-center gap-3">
            <Link
              href={`/events/${eventId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.08] transition"
            >
              <ExternalLink size={14} />
              <span>Open Client Gallery</span>
            </Link>
            <Link href={`/photographer/upload?eventId=${eventId}`}>
              <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3.5 py-1.5">
                <Upload size={14} className="mr-1.5" />
                Upload More
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Shoot Header Summary */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#10131d]/90 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                Shoot Management
              </span>
              {shoot?.accessCode && (
                <span className="font-mono text-xs text-zinc-400">
                  Access Code: <strong className="text-zinc-200">{shoot.accessCode}</strong>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {shoot?.name || 'Loading Shoot...'}
            </h1>
            <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
              {shoot?.description || 'Track your client’s live album shortlists and export them for Lightroom in 1 click.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-black/40 border border-white/10 rounded-2xl p-4">
            <div className="px-3 border-r border-white/10">
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">❤️ Album</p>
              <p className="text-2xl font-bold text-rose-400">{albumCount}</p>
            </div>
            <div className="px-3 border-r border-white/10">
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">🔖 Keepers</p>
              <p className="text-2xl font-bold text-amber-400">{originalCount}</p>
            </div>
            <div className="px-3">
              <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">📦 Unique Total</p>
              <p className="text-2xl font-bold text-violet-400">{combinedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Dedicated Export Tools */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-400" />
          <span>Export Filenames &amp; Selections</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 1. Album Selection (❤️) */}
          <div className="flex flex-col justify-between rounded-2xl border border-rose-500/20 bg-gradient-to-b from-rose-950/20 via-[#13111f] to-[#0f111a] p-5 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300">
                  <Heart size={13} className="fill-current text-rose-400" />
                  <span>Album Print List</span>
                </span>
                <span className="text-xl font-bold text-white">{albumCount}</span>
              </div>
              <h3 className="font-bold text-white text-base">Physical Album Design</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Client’s chosen photos for their leather-bound album. Use this list for SmartAlbums, Fundy Designer, or print labs. Zero bookmarks mixed in.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-rose-500/15">
              <Button
                onClick={() => handleCopyFilenames(albumFavorites, 'Album')}
                disabled={albumCount === 0}
                className="w-full rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-200 hover:bg-rose-600 hover:text-white text-xs font-semibold py-2"
              >
                {copiedType === 'Album' ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copiedType === 'Album' ? 'Copied to Clipboard!' : 'Copy Album Filenames'}
              </Button>
              <button
                type="button"
                onClick={() => handleDownloadTxt(albumFavorites, `Album_Selection_${shoot?.name || 'Shoot'}.txt`)}
                disabled={albumCount === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition disabled:opacity-40"
              >
                <Download size={13} />
                <span>Download .txt file</span>
              </button>
            </div>
          </div>

          {/* 2. Bookmarked Keepers (🔖) */}
          <div className="flex flex-col justify-between rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/20 via-[#14121b] to-[#0f111a] p-5 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                  <Bookmark size={13} className="fill-current text-amber-400" />
                  <span>Digital Keepers</span>
                </span>
                <span className="text-xl font-bold text-white">{originalCount}</span>
              </div>
              <h3 className="font-bold text-white text-base">Client High-Res Requests</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Extra personal favorites the client bookmarked for social media sharing, prints, or digital archiving.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-amber-500/15">
              <Button
                onClick={() => handleCopyFilenames(originalRequests, 'Keepers')}
                disabled={originalCount === 0}
                className="w-full rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-200 hover:bg-amber-600 hover:text-white text-xs font-semibold py-2"
              >
                {copiedType === 'Keepers' ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copiedType === 'Keepers' ? 'Copied to Clipboard!' : 'Copy Keepers Filenames'}
              </Button>
              <button
                type="button"
                onClick={() => handleDownloadTxt(originalRequests, `Keepers_Selection_${shoot?.name || 'Shoot'}.txt`)}
                disabled={originalCount === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition disabled:opacity-40"
              >
                <Download size={13} />
                <span>Download .txt file</span>
              </button>
            </div>
          </div>

          {/* 3. Combined Lightroom Master Batch (Unique ❤️ + 🔖) */}
          <div className="flex flex-col justify-between rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-950/30 via-[#151227] to-[#0f111a] p-5 shadow-lg relative overflow-hidden">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-600/20 blur-2xl" />

            <div className="space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300">
                  <Sparkles size={13} className="text-violet-400" />
                  <span>Adobe Lightroom Classic</span>
                </span>
                <span className="text-xl font-bold text-violet-300">{combinedCount}</span>
              </div>
              <h3 className="font-bold text-white text-base">Combined Master Batch</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Union of both lists. Paste directly into Lightroom (Ctrl+F → Filename Contains) to filter all {combinedCount} edited RAW files in 2 seconds.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-violet-500/20 relative">
              <Button
                onClick={() => handleCopyFilenames(combinedPhotos, 'Lightroom')}
                disabled={combinedCount === 0}
                className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 shadow-md shadow-violet-600/30"
              >
                {copiedType === 'Lightroom' ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copiedType === 'Lightroom' ? 'Copied Lightroom String!' : 'Copy Lightroom Search String'}
              </Button>
              <button
                type="button"
                onClick={() => handleDownloadTxt(combinedPhotos, `Combined_Master_List_${shoot?.name || 'Shoot'}.txt`)}
                disabled={combinedCount === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition disabled:opacity-40"
              >
                <Download size={13} />
                <span>Download Combined .txt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightroom Quick Instruction Banner */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e17] p-5 text-xs text-zinc-400">
        <div className="flex items-start gap-3">
          <HelpCircle size={18} className="text-violet-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-white">How to use with Adobe Lightroom Classic:</p>
            <p className="leading-relaxed">
              1. Click <strong className="text-violet-300">&quot;Copy Lightroom Search String&quot;</strong> above.
              <br />
              2. Open <strong>Lightroom Classic</strong> → Library Module (press <code className="bg-white/10 px-1 py-0.5 rounded text-white">G</code>).
              <br />
              3. Press <code className="bg-white/10 px-1 py-0.5 rounded text-white">Ctrl + F</code> (or <code className="bg-white/10 px-1 py-0.5 rounded text-white">Cmd + F</code>), select <strong>Filename → Contains</strong>, and paste.
              All matching photos will instantly appear on your screen!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Visual Gallery */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('combined')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === 'combined'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              All Selections ({combinedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('album')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'album'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Heart size={13} className="fill-current" />
              <span>Album Only ({albumCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bookmark')}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'bookmark'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bookmark size={13} className="fill-current" />
              <span>Keepers Only ({originalCount})</span>
            </button>
          </div>

          <span className="text-xs text-zinc-500">
            Showing {currentDisplayPhotos.length} selected photos
          </span>
        </div>

        {/* Selected Photos Grid */}
        {currentDisplayPhotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {currentDisplayPhotos.map((photo: any, index: number) => {
              const src = photo.thumbnailUrl || photo.url;
              return (
                <div
                  key={photo._id || photo.imageId || index}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-black/40"
                >
                  {src ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={src}
                      alt={photo.fileName || 'Selected photo'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-600">
                      <ImageIcon size={24} />
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    {photo.isAlbumFavorite && (
                      <span className="p-1 rounded-full bg-rose-500/90 text-white shadow-md" title="In Album">
                        <Heart size={10} className="fill-current" />
                      </span>
                    )}
                    {photo.isOriginalRequested && (
                      <span className="p-1 rounded-full bg-amber-500/90 text-white shadow-md" title="In Keepers">
                        <Bookmark size={10} className="fill-current" />
                      </span>
                    )}
                  </div>

                  {/* Filename Bar */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                    <p className="text-[10px] font-mono text-zinc-200 truncate" title={photo.fileName}>
                      {photo.fileName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e17]/80 py-16 text-center">
            <Heart size={36} className="mx-auto mb-3 text-zinc-600" />
            <p className="text-sm font-semibold text-white">No photos in this category yet</p>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1">
              When your client hearts photos in the gallery, they will show up here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
