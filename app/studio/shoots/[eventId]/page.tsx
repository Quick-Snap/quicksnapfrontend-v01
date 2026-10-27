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
  FolderDown,
  Share2,
  RotateCcw,
  Lock,
  Unlock,
  Users
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import toast from 'react-hot-toast';

export default function ShootProofingPage() {
  const params = useParams();
  const eventId = params?.eventId as string;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'album' | 'bookmark' | 'combined'>('combined');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [togglingProofing, setTogglingProofing] = useState(false);
  const [regeneratingToken, setRegeneratingToken] = useState(false);

  // Fetch Event Details
  const { data: eventData, isLoading: eventLoading, refetch: refetchShoot } = useQuery(['eventDetails', eventId], () =>
    eventApi.getById(eventId)
  );
  const shoot = eventData?.data;

  // Fetch Event Selections (❤️ Album and 🔖 Keepers)
  const { data: selectionsData, isLoading: selLoading, refetch: refetchSelections } = useQuery(
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
  const byUser = useMemo(() => selections?.byUser || [], [selections?.byUser]);

  const albumCount = selections?.counts?.albumCount || albumFavorites.length;
  const originalCount = selections?.counts?.originalCount || originalRequests.length;
  const combinedCount = selections?.counts?.combinedCount || combinedPhotos.length;

  const currentDisplayPhotos = useMemo(() => {
    let list: any[] = [];
    if (activeTab === 'album') list = albumFavorites;
    else if (activeTab === 'bookmark') list = originalRequests;
    else list = combinedPhotos;

    if (selectedUserFilter !== 'all') {
      list = list.filter((p) => {
        const inAlbum = (p.albumFavoritedBy || []).some((u: any) => (u._id || u).toString() === selectedUserFilter);
        const inOriginal = (p.originalRequestedBy || []).some((u: any) => (u._id || u).toString() === selectedUserFilter);
        if (activeTab === 'album') return inAlbum;
        if (activeTab === 'bookmark') return inOriginal;
        return inAlbum || inOriginal;
      });
    }

    return list;
  }, [activeTab, albumFavorites, originalRequests, combinedPhotos, selectedUserFilter]);

  const proofingToken = shoot?.proofingSettings?.token;
  const isProofingEnabled = shoot?.proofingSettings?.enabled !== false;

  const handleCopyProofingLink = () => {
    if (!proofingToken) {
      toast.error('Proofing token is not available yet.');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.roopixo.com';
    const url = `${origin}/events/${eventId}?proofToken=${proofingToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Secure Client Proofing Link copied! 📋', { duration: 3000 });
  };

  const handleToggleProofing = async () => {
    setTogglingProofing(true);
    try {
      const res = await eventApi.toggleProofing(eventId, !isProofingEnabled);
      toast.success(res.message || 'Updated proofing status');
      refetchShoot();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update proofing status');
    } finally {
      setTogglingProofing(false);
    }
  };

  const handleRegenerateToken = async () => {
    if (!confirm('Regenerate proofing link?\n\nThis will immediately invalidate any previously shared link and generate a new secure token. Anyone with the old link will lose proofing access.')) {
      return;
    }
    setRegeneratingToken(true);
    try {
      const res = await eventApi.regenerateProofingToken(eventId);
      toast.success('New proofing token generated! Old links are now invalid.');
      refetchShoot();
      if (res.data?.token) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.roopixo.com';
        const url = `${origin}/events/${eventId}?proofToken=${res.data.token}`;
        navigator.clipboard.writeText(url);
        toast.success('New link copied to clipboard! 📋', { duration: 3500 });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to regenerate proofing token');
    } finally {
      setRegeneratingToken(false);
    }
  };

  /** Copy filenames formatted as comma-separated or newline string */
  const handleCopyFilenames = (photos: any[], label: string) => {
    if (!photos || photos.length === 0) {
      toast.error(`No photos in ${label} to copy`);
      return;
    }
    // Clean base filenames
    const list = photos
      .map((p) => {
        const name = p.fileName || p.imageId || '';
        if (label === 'Lightroom') {
          // Strip extension so Lightroom "Filename Contains" matches RAW (.CR3, .ARW, .NEF) and JPEG alike
          return name.replace(/\.[^/.]+$/, '');
        }
        return name;
      })
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
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition"
        >
          <ArrowLeft size={16} />
          <span>Back to All Shoots</span>
        </Link>

        {shoot && (
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Proofing Status Toggle */}
            <button
              type="button"
              onClick={handleToggleProofing}
              disabled={togglingProofing}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                isProofingEnabled
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400'
              }`}
              title={isProofingEnabled ? "Click to Pause Client Proofing" : "Click to Enable Client Proofing"}
            >
              {isProofingEnabled ? <Unlock size={13} className="text-emerald-600 dark:text-emerald-400" /> : <Lock size={13} />}
              <span>Proofing: {isProofingEnabled ? 'Active' : 'Paused'}</span>
            </button>

            {/* Copy Secure Proofing Link */}
            <button
              type="button"
              onClick={handleCopyProofingLink}
              disabled={!isProofingEnabled}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 shadow-sm dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20 px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-50"
            >
              <Share2 size={14} />
              <span>Copy Secure Proofing Link</span>
            </button>

            {/* Regenerate Token Button */}
            <button
              type="button"
              onClick={handleRegenerateToken}
              disabled={regeneratingToken}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400 dark:hover:text-white px-2.5 py-1.5 text-xs font-medium transition"
              title="Regenerate token (invalidates previously shared link)"
              aria-label="Regenerate link"
            >
              <RotateCcw size={13} className={regeneratingToken ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Regenerate Link</span>
            </button>

            <Link
              href={`/organizer/events/${eventId}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 shadow-sm dark:shadow-none dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold transition"
              title="Manage ceremonies and event details"
            >
              <Layers size={14} className="text-violet-500" />
              <span>Ceremonies</span>
            </Link>

            <Link
              href={proofingToken ? `/events/${eventId}?proofToken=${proofingToken}` : `/events/${eventId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 shadow-sm dark:shadow-none dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:text-white dark:hover:bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold transition"
            >
              <ExternalLink size={14} />
              <span>Preview Gallery</span>
            </Link>

            <Link href={`/studio/shoots/${eventId}/upload`}>
              <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-3.5 py-1.5">
                <Upload size={14} className="mr-1.5" />
                Upload More
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Shoot Header Summary */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 backdrop-blur-md shadow-sm dark:border-white/[0.08] dark:bg-[#10131d]/90 dark:shadow-none transition-colors duration-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 dark:text-violet-300">
                Shoot Management
              </span>
              {shoot?.accessCode && (
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  Access Code: <strong className="text-zinc-800 dark:text-zinc-200">{shoot.accessCode}</strong>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              {shoot?.name || 'Loading Shoot...'}
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {shoot?.description || 'Track your client’s live album shortlists and export them for Lightroom in 1 click.'}
            </p>
          </div>

          <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-white/10 w-full sm:w-auto sm:flex sm:items-center sm:gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-3 sm:p-4 dark:bg-black/40 dark:border-white/10 text-center sm:text-left">
            <div className="px-2 sm:px-3">
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">❤️ Album</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">{albumCount}</p>
            </div>
            <div className="px-2 sm:px-3">
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">🔖 Keepers</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{originalCount}</p>
            </div>
            <div className="px-2 sm:px-3">
              <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-wider">📦 Total</p>
              <p className="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400">{combinedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Dedicated Export Tools */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <span>Export Filenames &amp; Selections</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* 1. Album Selection (❤️) */}
          <div className="flex flex-col justify-between rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50/70 via-white to-rose-50/30 p-5 shadow-sm dark:border-rose-500/20 dark:bg-gradient-to-b dark:from-rose-950/20 dark:via-[#13111f] dark:to-[#0f111a] dark:shadow-lg transition-colors duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/60 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <Heart size={13} className="fill-current text-rose-500 dark:text-rose-400" />
                  <span>Album Print List</span>
                </span>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">{albumCount}</span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Physical Album Design</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Client’s chosen photos for their leather-bound album. Use this list for SmartAlbums, Fundy Designer, or print labs. Zero bookmarks mixed in.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-rose-200/60 dark:border-rose-500/15">
              <Button
                onClick={() => handleCopyFilenames(albumFavorites, 'Album')}
                disabled={albumCount === 0}
                className="w-full rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold py-2 shadow-sm"
              >
                {copiedType === 'Album' ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copiedType === 'Album' ? 'Copied to Clipboard!' : 'Copy Album Filenames'}
              </Button>
              <button
                type="button"
                onClick={() => handleDownloadTxt(albumFavorites, `Album_Selection_${shoot?.name || 'Shoot'}.txt`)}
                disabled={albumCount === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white py-1.5 rounded-lg hover:bg-rose-500/5 transition disabled:opacity-40"
              >
                <Download size={13} />
                <span>Download .txt file</span>
              </button>
            </div>
          </div>

          {/* 2. Bookmarked Keepers (🔖) */}
          <div className="flex flex-col justify-between rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 p-5 shadow-sm dark:border-amber-500/20 dark:bg-gradient-to-b dark:from-amber-950/20 dark:via-[#14121b] dark:to-[#0f111a] dark:shadow-lg transition-colors duration-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/60 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <Bookmark size={13} className="fill-current text-amber-500 dark:text-amber-400" />
                  <span>Digital Keepers</span>
                </span>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">{originalCount}</span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Client High-Res Requests</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Extra personal favorites the client bookmarked for social media sharing, prints, or digital archiving.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-amber-200/60 dark:border-amber-500/15">
              <Button
                onClick={() => handleCopyFilenames(originalRequests, 'Keepers')}
                disabled={originalCount === 0}
                className="w-full rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold py-2 shadow-sm"
              >
                {copiedType === 'Keepers' ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copiedType === 'Keepers' ? 'Copied to Clipboard!' : 'Copy Keepers Filenames'}
              </Button>
              <button
                type="button"
                onClick={() => handleDownloadTxt(originalRequests, `Keepers_Selection_${shoot?.name || 'Shoot'}.txt`)}
                disabled={originalCount === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white py-1.5 rounded-lg hover:bg-amber-500/5 transition disabled:opacity-40"
              >
                <Download size={13} />
                <span>Download .txt file</span>
              </button>
            </div>
          </div>

          {/* 3. Combined Lightroom Master Batch (Unique ❤️ + 🔖) */}
          <div className="flex flex-col justify-between rounded-2xl border border-violet-200 bg-gradient-to-b from-violet-50/70 via-white to-violet-50/30 p-5 shadow-sm dark:border-violet-500/30 dark:bg-gradient-to-b dark:from-violet-950/30 dark:via-[#151227] dark:to-[#0f111a] dark:shadow-lg relative overflow-hidden transition-colors duration-200">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-2xl" />

            <div className="space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/60 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
                  <Sparkles size={13} className="text-violet-600 dark:text-violet-400" />
                  <span>Adobe Lightroom Classic</span>
                </span>
                <span className="text-xl font-bold text-violet-700 dark:text-violet-300">{combinedCount}</span>
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Combined Master Batch</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Union of both lists. Paste directly into Lightroom (Ctrl+F → Filename Contains) to filter all {combinedCount} edited RAW files in 2 seconds.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-violet-200/60 dark:border-violet-500/20 relative">
              <Button
                onClick={() => handleCopyFilenames(combinedPhotos, 'Lightroom')}
                disabled={combinedCount === 0}
                className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold py-2 shadow-md shadow-violet-600/25"
              >
                {copiedType === 'Lightroom' ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                {copiedType === 'Lightroom' ? 'Copied Lightroom String!' : 'Copy Lightroom Search String'}
              </Button>
              <button
                type="button"
                onClick={() => handleDownloadTxt(combinedPhotos, `Combined_Master_List_${shoot?.name || 'Shoot'}.txt`)}
                disabled={combinedCount === 0}
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white py-1.5 rounded-lg hover:bg-violet-500/5 transition disabled:opacity-40"
              >
                <Download size={13} />
                <span>Download Combined .txt</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightroom Quick Instruction Banner */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-xs text-zinc-600 dark:border-white/[0.08] dark:bg-[#0c0e17] dark:text-zinc-400 transition-colors duration-200">
        <div className="flex items-start gap-3">
          <HelpCircle size={18} className="text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-zinc-900 dark:text-white">How to use with Adobe Lightroom Classic:</p>
            <p className="leading-relaxed">
              1. Click <strong className="text-violet-700 dark:text-violet-300">&quot;Copy Lightroom Search String&quot;</strong> above.
              <br />
              2. Open <strong>Lightroom Classic</strong> → Library Module (press <code className="bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white px-1 py-0.5 rounded">G</code>).
              <br />
              3. Press <code className="bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white px-1 py-0.5 rounded">Ctrl + F</code> (or <code className="bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white px-1 py-0.5 rounded">Cmd + F</code>), select <strong>Filename → Contains</strong>, and paste.
              All matching photos will instantly appear on your screen!
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Visual Gallery */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('combined')}
              className={`shrink-0 rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold transition ${
                activeTab === 'combined'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              All Selections ({combinedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('album')}
              className={`shrink-0 rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'album'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <Heart size={13} className="fill-current" />
              <span>Album Only ({albumCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bookmark')}
              className={`shrink-0 rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
                activeTab === 'bookmark'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
              }`}
            >
              <Bookmark size={13} className="fill-current" />
              <span>Keepers Only ({originalCount})</span>
            </button>
          </div>

          <span className="text-xs text-zinc-500 shrink-0">
            Showing {currentDisplayPhotos.length} selected photos
          </span>
        </div>

        {/* Client & Loved Ones Filter Pills */}
        {byUser.length > 0 && (
          <div className="flex items-center gap-2 pt-1 pb-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mr-1 flex items-center gap-1 shrink-0">
              <Users size={13} />
              <span>Filter:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedUserFilter('all')}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedUserFilter === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'
              }`}
            >
              <span>All Loved Ones</span>
              <span className="rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.5 text-[10px]">
                {combinedCount}
              </span>
            </button>
            {byUser.map((item: any) => {
              const isSelected = selectedUserFilter === item.user._id;
              return (
                <button
                  key={item.user._id}
                  type="button"
                  onClick={() => setSelectedUserFilter(item.user._id)}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10'
                  }`}
                >
                  {item.user.avatar ? (
                    <img src={item.user.avatar} alt={item.user.name} className="h-4 w-4 rounded-full object-cover" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-300 flex items-center justify-center text-[9px] font-bold">
                      {item.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span>{item.user.name}</span>
                  <span className="rounded-full bg-black/10 dark:bg-white/20 px-1.5 py-0.5 text-[10px]">
                    {item.combinedCount}
                  </span>
                </button>
              );
            })}
          </div>
        )}

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
                      src={photo.thumbnailUrl || src}
                      alt={photo.fileName || 'Selected photo'}
                      loading="lazy"
                      decoding="async"
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

                  {/* Filename & Loved Ones Badges */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 space-y-1">
                    <p className="text-[10px] font-mono text-zinc-200 truncate" title={photo.fileName}>
                      {photo.fileName}
                    </p>
                    {((photo.albumFavoritedBy && photo.albumFavoritedBy.length > 0) || (photo.originalRequestedBy && photo.originalRequestedBy.length > 0)) && (
                      <div className="flex flex-wrap gap-1 pointer-events-none">
                        {(photo.albumFavoritedBy || []).map((u: any) => (
                          <span key={u._id} className="rounded bg-rose-500/80 px-1 py-0.5 text-[9px] text-white font-medium truncate max-w-[90px]" title={`In Album by ${u.name}`}>
                            ❤️ {u.name}
                          </span>
                        ))}
                        {(photo.originalRequestedBy || []).map((u: any) => (
                          <span key={u._id} className="rounded bg-amber-500/80 px-1 py-0.5 text-[9px] text-white font-medium truncate max-w-[90px]" title={`Keeper by ${u.name}`}>
                            🔖 {u.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.08] dark:bg-[#0c0e17]/80 py-16 text-center shadow-sm dark:shadow-none transition-colors duration-200">
            <Heart size={36} className="mx-auto mb-3 text-zinc-400 dark:text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">No photos in this category yet</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mt-1">
              When your client hearts photos in the gallery, they will show up here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
