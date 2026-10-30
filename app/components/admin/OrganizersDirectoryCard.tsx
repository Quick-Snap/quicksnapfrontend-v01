'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Camera,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Shield,
  Layers,
  Image as ImageIcon,
  Zap,
  Phone,
  Mail,
  User,
  Tv,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  organizerDirectoryApi,
  OrganizerDirectoryItem,
  OrganizerDirectorySummary,
  OrganizerDirectoryEvent
} from '@/lib/api';

interface OrganizersDirectoryCardProps {
  onSelectOrganizerForCustomPlan?: (email: string) => void;
}

export default function OrganizersDirectoryCard({ onSelectOrganizerForCustomPlan }: OrganizersDirectoryCardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    summary: OrganizerDirectorySummary;
    organizers: OrganizerDirectoryItem[];
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [expandedOrganizerIds, setExpandedOrganizerIds] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const res = await organizerDirectoryApi.getDirectory();
      if (res.success && res.data) {
        setData(res.data);
        // By default expand the first 2 organizers if they have events
        const initialExpanded = new Set<string>();
        res.data.organizers.slice(0, 2).forEach(org => {
          if (org.events.length > 0) initialExpanded.add(org._id);
        });
        setExpandedOrganizerIds(initialExpanded);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch organizers directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedOrganizerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!data) return;
    setExpandedOrganizerIds(new Set(data.organizers.map(o => o._id)));
  };

  const collapseAll = () => {
    setExpandedOrganizerIds(new Set());
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Event code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered organizers
  const filteredOrganizers = useMemo(() => {
    if (!data?.organizers) return [];
    return data.organizers.filter(org => {
      // Tier filter
      if (tierFilter !== 'all' && org.subscription.tier !== tierFilter) {
        return false;
      }
      // Search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchOrg = (
        org.name?.toLowerCase().includes(q) ||
        org.email?.toLowerCase().includes(q) ||
        org.businessName?.toLowerCase().includes(q) ||
        org.phone?.toLowerCase().includes(q)
      );
      if (matchOrg) return true;

      // Match any of their events
      const matchEvent = org.events.some(ev =>
        ev.name.toLowerCase().includes(q) ||
        ev.accessCode.toLowerCase().includes(q) ||
        ev.venue?.toLowerCase().includes(q)
      );
      return matchEvent;
    });
  }, [data?.organizers, tierFilter, searchQuery]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return { label: 'Enterprise', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'studio_pro':
        return { label: 'Studio Pro', bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
      case 'starter_pro':
        return { label: 'Starter Pro', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      default:
        return { label: 'Free Trial', bg: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Studios / Organizers</span>
            <Building2 className="h-4 w-4 text-violet-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {data?.summary.totalOrganizers ?? '—'}
          </p>
          <span className="text-[11px] text-emerald-500 font-medium">
            {data?.summary.payingStudiosCount ?? 0} Paying Subscribers
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Shoots / Events</span>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {data?.summary.totalEvents ?? '—'}
          </p>
          <span className="text-[11px] text-zinc-400 font-medium">
            Across all studio partners
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Photos Uploaded</span>
            <ImageIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {data?.summary.totalPhotos ? data.summary.totalPhotos.toLocaleString() : '—'}
          </p>
          <span className="text-[11px] text-zinc-400 font-medium">
            Stored & indexed on S3
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900/60 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Paying Studio Ratio</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-zinc-900 dark:text-white">
            {data?.summary.totalOrganizers
              ? Math.round(((data.summary.payingStudiosCount || 0) / data.summary.totalOrganizers) * 100)
              : 0}%
          </p>
          <span className="text-[11px] text-amber-400 font-medium">
            Conversion rate
          </span>
        </div>
      </div>

      {/* Directory Main Card */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 backdrop-blur-xl space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-white/10">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-violet-500" />
              Studios &amp; Events Directory
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Browse every organizer studio on Roopixo, inspect their quotas, and click into their individual shoot galleries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              Collapse All
            </button>
            <button
              onClick={fetchDirectory}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by studio name, organizer email, event name, or event code (e.g. DELHI2026)…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium dark:border-white/10 dark:bg-white/5 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-xs font-semibold dark:border-white/10 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-violet-500"
            >
              <option value="all">All Tiers ({data?.organizers.length || 0})</option>
              <option value="enterprise">Enterprise Tier</option>
              <option value="studio_pro">Studio Pro</option>
              <option value="starter_pro">Starter Pro</option>
              <option value="free_trial">Free Trial</option>
            </select>
          </div>
        </div>

        {/* Organizers List */}
        {loading ? (
          <div className="py-16 text-center">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-violet-500" />
            <p className="mt-3 text-xs text-zinc-400">Loading studios &amp; events directory…</p>
          </div>
        ) : filteredOrganizers.length > 0 ? (
          <div className="space-y-4">
            {filteredOrganizers.map((org) => {
              const isExpanded = expandedOrganizerIds.has(org._id);
              const badge = getTierBadge(org.subscription.tier);
              const maxQuota = org.subscription.customPhotoQuota || (org.subscription.tier === 'enterprise' ? 350000 : org.subscription.tier === 'studio_pro' ? 150000 : 30000);
              const usagePercent = Math.min(100, Math.round(((org.subscription.photosUsedInPeriod || org.totalPhotosCount) / maxQuota) * 100));

              return (
                <div
                  key={org._id}
                  className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.02] overflow-hidden transition"
                >
                  {/* Organizer Header Accordion Bar */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-black text-base shadow-md shadow-violet-500/20">
                        {org.businessName ? org.businessName.charAt(0).toUpperCase() : org.name ? org.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                            {org.businessName || org.name || 'Unnamed Studio'}
                          </h3>
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.bg}`}>
                            {badge.label}
                          </span>
                          {org.subscription.status === 'active' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-zinc-400" /> {org.email}
                          </span>
                          {org.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-zinc-400" /> {org.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-200/50 dark:border-white/5">
                      {/* Quota Progress */}
                      <div className="min-w-[120px]">
                        <div className="flex justify-between text-[11px] font-semibold mb-1">
                          <span className="text-zinc-400">Quota</span>
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {((org.subscription.photosUsedInPeriod || org.totalPhotosCount) / 1000).toFixed(0)}k / {(maxQuota / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${usagePercent > 90 ? 'bg-rose-500' : 'bg-violet-500'}`}
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Events Count Pill */}
                      <button
                        onClick={() => toggleExpand(org._id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-400 hover:bg-violet-500/20 transition"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>{org.totalEventsCount} Shoots ({org.totalPhotosCount.toLocaleString()} pics)</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                      </button>

                      {/* Custom Plan Builder Shortcut */}
                      {onSelectOrganizerForCustomPlan && (
                        <button
                          type="button"
                          onClick={() => onSelectOrganizerForCustomPlan(org.email)}
                          className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-white/5 transition"
                          title="Open Custom Plan Builder prefilled with this organizer"
                        >
                          <Zap className="h-3 w-3 inline mr-1 text-amber-500" />
                          Custom Plan
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Shoots List */}
                  {isExpanded && (
                    <div className="border-t border-zinc-200 dark:border-white/10 bg-white dark:bg-black/20 p-4 sm:p-5 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400">
                        <span>Shoots &amp; Events Created by {org.businessName || org.name}</span>
                        <span>{org.events.length} Total</span>
                      </div>

                      {org.events.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-100 dark:border-white/5 text-[11px] uppercase font-bold text-zinc-400">
                              <tr>
                                <th className="py-2.5 px-3">Shoot Name &amp; Code</th>
                                <th className="py-2.5 px-3">Date &amp; Venue</th>
                                <th className="py-2.5 px-3">Photos</th>
                                <th className="py-2.5 px-3">Perks &amp; Status</th>
                                <th className="py-2.5 px-3 text-right">Quick Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                              {org.events.map((ev) => (
                                <tr key={ev._id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                                  <td className="py-3 px-3">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-zinc-900 dark:text-white">{ev.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="font-mono text-[11px] font-semibold text-violet-500 bg-violet-500/10 px-2 py-0.5 rounded">
                                        {ev.accessCode}
                                      </span>
                                      <button
                                        onClick={() => handleCopyCode(ev.accessCode)}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                        title="Copy Event Code"
                                      >
                                        {copiedCode === ev.accessCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                                      </button>
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-300">
                                    <p>{ev.startDate ? new Date(ev.startDate).toLocaleDateString() : 'No date'}</p>
                                    <p className="text-[11px] text-zinc-400">{ev.venue || 'No venue specified'}</p>
                                  </td>

                                  <td className="py-3 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                                    {ev.photosCount.toLocaleString()} photos
                                  </td>

                                  <td className="py-3 px-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {ev.isActive ? (
                                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                                          Live
                                        </span>
                                      ) : (
                                        <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                                          Draft
                                        </span>
                                      )}
                                      {ev.googleDriveSyncEnabled && (
                                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 inline-flex items-center gap-1">
                                          <Cloud className="h-2.5 w-2.5" /> GDrive
                                        </span>
                                      )}
                                      {ev.hasLiveWall && (
                                        <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-400 inline-flex items-center gap-1">
                                          <Tv className="h-2.5 w-2.5" /> Live Wall
                                        </span>
                                      )}
                                      {ev.adminBypass?.enabled && (
                                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                                          Exempt
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 text-right space-x-2">
                                    {/* Open in Studio Proofing */}
                                    <Link
                                      href={`/studio/shoots/${ev._id}`}
                                      className="inline-flex items-center gap-1 rounded-lg bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 px-2.5 py-1 text-[11px] font-bold transition"
                                      title="Open in Studio Workspace (Proofing & Selections)"
                                    >
                                      <Camera className="h-3 w-3" />
                                      Studio
                                    </Link>

                                    {/* Public Gallery Link */}
                                    <Link
                                      href={`/events/${ev.accessCode}`}
                                      target="_blank"
                                      className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-white/10 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/5 transition"
                                      title="Open Guest Public Gallery"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      Gallery
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 py-3 italic">
                          This organizer has not created any shoots or events yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-zinc-400 text-xs">
            No organizers found matching &ldquo;{searchQuery}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}
