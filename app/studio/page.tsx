'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from 'react-query';
import { eventApi } from '@/lib/api';
import {
  Camera,
  FolderOpen,
  Upload,
  Eye,
  Plus,
  Sparkles,
  Calendar,
  Image as ImageIcon,
  Heart,
  Bookmark,
  Search,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/app/components/ui/Button';
import { format } from 'date-fns';

export default function StudioDashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch both organized events and assigned events
  const { data: organizedData, isLoading: orgLoading } = useQuery('studioOrganizedEvents', () =>
    eventApi.getMyOrganizedEvents()
  );
  const { data: assignedData, isLoading: assLoading } = useQuery('studioAssignedEvents', () =>
    eventApi.getMyAssignedEvents()
  );

  const allShoots = useMemo(() => {
    const org = organizedData?.data || [];
    const ass = assignedData?.data || [];
    const map = new Map<string, any>();
    [...org, ...ass].forEach((e) => {
      if (e && e._id) map.set(e._id, e);
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
    );
  }, [organizedData?.data, assignedData?.data]);

  const filteredShoots = useMemo(() => {
    if (!searchQuery.trim()) return allShoots;
    const q = searchQuery.toLowerCase();
    return allShoots.filter(
      (s) => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
  }, [allShoots, searchQuery]);

  const isLoading = orgLoading || assLoading;

  return (
    <div className="space-y-8">
      {/* Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-violet-950/40 via-[#131126] to-[#0c0e17] p-6 sm:p-8 shadow-2xl">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
              <Camera size={14} />
              <span>Studio Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Shoots &amp; Client Proofing
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-zinc-400 leading-relaxed">
              Manage wedding and event shoots, track client selections (❤️ Album &amp; 🔖 Keepers), and export 1-click filename lists directly into Adobe Lightroom Classic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/organizer/events/create">
              <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/25">
                <Plus size={16} className="mr-1.5" />
                New Shoot
              </Button>
            </Link>
            <Link href="/photographer/upload">
              <Button variant="outline" className="rounded-xl border-white/15 text-white hover:bg-white/5">
                <Upload size={16} className="mr-1.5" />
                Bulk Upload
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Shoots Header & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Your Shoots</span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
              {filteredShoots.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400">Click any shoot to view client proofing, album selections, and Lightroom tools.</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search shoots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Shoots Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/20 border-t-violet-500 mr-3" />
          Loading shoots...
        </div>
      ) : filteredShoots.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredShoots.map((shoot: any) => {
            const photoCount = shoot.photos?.length || shoot.photoCount || 0;
            const shootDate = shoot.startDate ? format(new Date(shoot.startDate), 'MMM dd, yyyy') : 'No date';

            return (
              <div
                key={shoot._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#10131d]/90 p-5 transition-all duration-300 hover:border-violet-500/40 hover:bg-[#131724] hover:shadow-xl hover:shadow-black/40"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-300">
                      Active Shoot
                    </span>
                    {shoot.accessCode && (
                      <span className="font-mono text-xs text-zinc-400">
                        Code: <strong className="text-zinc-200">{shoot.accessCode}</strong>
                      </span>
                    )}
                  </div>

                  <Link href={`/studio/shoots/${shoot._id}`} className="block">
                    <h3 className="text-lg font-bold text-white transition-colors group-hover:text-violet-300 line-clamp-1">
                      {shoot.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400 leading-relaxed">
                      {shoot.description || 'No description provided.'}
                    </p>
                  </Link>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-violet-400" />
                      <strong className="text-zinc-200">{photoCount}</strong> photos
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-400" />
                      {shootDate}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <Link
                    href={`/studio/shoots/${shoot._id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-600 hover:text-white transition"
                  >
                    <Heart size={13} className="text-rose-400" />
                    <span>Proofing &amp; Selections</span>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/photographer/upload?eventId=${shoot._id}`}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
                      title="Upload Photos"
                    >
                      <Upload size={15} />
                    </Link>
                    <Link
                      href={`/events/${shoot._id}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
                      title="View Client Gallery"
                    >
                      <ExternalLink size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/[0.08] bg-[#10131d]/60 py-16 text-center">
          <FolderOpen size={48} className="mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-bold text-white mb-1">No shoots found</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-6">
            Create your first shoot or wedding event to start delivering photos and collecting client album selections.
          </p>
          <Link href="/organizer/events/create">
            <Button className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold">
              <Plus size={16} className="mr-1.5" />
              Create Shoot
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
