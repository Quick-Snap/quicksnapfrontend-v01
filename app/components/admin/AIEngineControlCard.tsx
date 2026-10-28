'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Cpu,
  Cloud,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Database,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Filter,
  DollarSign,
  TrendingUp,
  Search,
  X,
  ExternalLink,
  ChevronRight,
  Trash2,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAIApi, AdminAISettings, EventAIBreakdown } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';
import { softSurface } from '@/lib/dashboardUi';

type TimelineOption = 'all' | '1h' | '24h' | '7d' | '30d';

const TIMELINE_OPTIONS: { value: TimelineOption; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '1h', label: 'Last 1 Hour' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' }
];

export default function AIEngineControlCard() {
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState(false);
  const [timeline, setTimeline] = useState<TimelineOption>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [tableSearch, setTableSearch] = useState<string>('');

  const {
    data: settingsData,
    isLoading,
    isRefetching,
    refetch
  } = useQuery<AdminAISettings | undefined>(
    ['adminAISettings', timeline, selectedEventId],
    async () => {
      const res = await adminAIApi.getSettings({
        timeline,
        eventId: selectedEventId || undefined
      });
      return res.data;
    },
    {
      refetchInterval: 15000, // Periodic live stats refresh
      staleTime: 5000,
      keepPreviousData: true
    }
  );

  const updateMutation = useMutation(
    async (provider: 'insightface' | 'rekognition') => {
      const res = await adminAIApi.updateProvider(provider);
      return res;
    },
    {
      onSuccess: (_, provider) => {
        queryClient.invalidateQueries('adminAISettings');
        toast.success(
          provider === 'insightface'
            ? 'Switched to InsightFace self-hosted microservice engine.'
            : 'Switched to AWS Rekognition cloud engine.'
        );
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to update AI face engine.');
      }
    }
  );

  const purgeOrphanMutation = useMutation(
    async () => {
      const res = await adminAIApi.purgeOrphanPhotos();
      return res;
    },
    {
      onSuccess: (res: any) => {
        queryClient.invalidateQueries('adminAISettings');
        toast.success(res?.message || 'Orphan photos purged from S3 & database successfully!');
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to purge orphan photos.');
      }
    }
  );

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const res: any = await adminAIApi.testConnection();
      const health = res?.data?.health || res?.health || res?.data;
      if (health?.online) {
        toast.success(`Microservice Online! Ping latency: ${health.insightFaceLatencyMs ?? 2}ms`);
      } else {
        toast.error(`Microservice unreachable: ${health?.error || 'Connection failed'}`);
      }
      refetch();
    } catch (err: any) {
      toast.error('Connection test failed.');
    } finally {
      setTestingConnection(false);
    }
  };

  const currentProvider = settingsData?.provider || 'insightface';
  const microservice = settingsData?.microservice;
  const stats = settingsData?.stats;
  const isOnline = Boolean(microservice?.online);
  const eventsList = settingsData?.eventsList || [];
  const eventBreakdown = settingsData?.eventBreakdown || [];

  // Filter breakdown table by search term
  const filteredBreakdown = eventBreakdown.filter((item) => {
    if (!tableSearch.trim()) return true;
    const query = tableSearch.toLowerCase();
    return (
      item.eventName?.toLowerCase().includes(query) ||
      item.eventCode?.toLowerCase().includes(query) ||
      item.eventId?.toLowerCase().includes(query)
    );
  });

  const selectedEventName = eventsList.find((e) => e._id === selectedEventId)?.name;
  const totalCalls = stats?.totalAiCalls ?? ((stats?.insightFaceIndexedPhotos ?? 0) + (stats?.rekognitionIndexedPhotos ?? 0));
  const auraCalls = stats?.totalAuraFaceCalls ?? (stats?.insightFaceIndexedPhotos ?? 0);
  const rekCalls = stats?.totalRekognitionCalls ?? (stats?.rekognitionIndexedPhotos ?? 0);

  const auraFacePercent = totalCalls > 0
    ? Math.round((auraCalls / totalCalls) * 100)
    : (currentProvider === 'insightface' ? 100 : 0);
  const rekognitionPercent = 100 - auraFacePercent;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl dark:border-white/10 dark:bg-[#121214] sm:rounded-3xl">
      {/* Top Header */}
      <div className="relative overflow-hidden border-b border-zinc-200/80 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 p-6 text-white dark:border-white/10 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5" />
                Dual-Engine AI Intelligence
              </span>
              <span className="text-xs text-violet-200">Admin Permission Only</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Face Recognition Engine</h2>
            <p className="max-w-2xl text-sm text-violet-100/90 sm:text-base">
              Manage self-hosted InsightFace microservice alongside AWS Rekognition with automatic zero-downtime fallback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleTestConnection}
              loading={testingConnection}
              className="bg-white text-violet-700 shadow-md hover:bg-violet-50"
            >
              <Activity className="mr-1.5 h-3.5 w-3.5 text-violet-600" />
              Test Ping
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Orphan Photos Storage Waste Alert */}
        {(stats?.orphanPhotosCount ?? 0) > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Storage Cleanup Needed: {stats?.orphanPhotosCount} Orphan Photos Detected
                </h4>
                <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-300/80">
                  Leftover test photos from previously deleted events are still consuming AWS S3 RAW & PROCESSED storage space.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm(`Permanently purge ${stats?.orphanPhotosCount} orphan photo files from AWS S3 and database?`)) {
                  purgeOrphanMutation.mutate();
                }
              }}
              loading={purgeOrphanMutation.isLoading}
              className="shrink-0 border-amber-400 bg-white text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Purge S3 & Free Space
            </Button>
          </div>
        )}

        {/* Active Engine Cards / Toggle */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Active Engine Selection
            </h3>
            <span className="text-xs text-zinc-400">
              Active: <strong className="text-violet-600 dark:text-violet-400 capitalize">{currentProvider}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* InsightFace Option */}
            <div
              onClick={() => {
                if (currentProvider !== 'insightface' && !updateMutation.isLoading) {
                  updateMutation.mutate('insightface');
                }
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                currentProvider === 'insightface'
                  ? 'border-violet-600 bg-violet-50/60 shadow-lg shadow-violet-500/10 dark:border-violet-500 dark:bg-violet-950/20'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20'
              }`}
            >
              {currentProvider === 'insightface' && (
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active Engine
                </div>
              )}

              <div className="flex items-start gap-3.5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  currentProvider === 'insightface'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
                }`}>
                  <Cpu className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white">AuraFace Microservice</h4>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                      Apache 2.0 Commercial
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Self-hosted AuraFace-v1 model (100% commercially permissive under Apache 2.0) running on ONNX Runtime CPU. 512-dim face embeddings with &lt;5ms vectorized cosine matching.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                      isOnline
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      {isOnline ? `Online (${microservice?.latencyMs ?? 15}ms)` : 'Offline (Rekognition Fallback)'}
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-500 dark:text-zinc-400">Local port 5055 / Docker</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AWS Rekognition Option */}
            <div
              onClick={() => {
                if (currentProvider !== 'rekognition' && !updateMutation.isLoading) {
                  updateMutation.mutate('rekognition');
                }
              }}
              className={`relative cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                currentProvider === 'rekognition'
                  ? 'border-violet-600 bg-violet-50/60 shadow-lg shadow-violet-500/10 dark:border-violet-500 dark:bg-violet-950/20'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20'
              }`}
            >
              {currentProvider === 'rekognition' && (
                <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-violet-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active Engine
                </div>
              )}

              <div className="flex items-start gap-3.5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  currentProvider === 'rekognition'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300'
                }`}>
                  <Cloud className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-zinc-900 dark:text-white">AWS Rekognition</h4>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-white/10 dark:text-zinc-400">
                      Cloud Fallback
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Managed cloud face indexing and reverse SearchFacesByImage in AWS Rekognition collection.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
                      <ShieldCheck className="h-3 w-3" />
                      AWS Cloud Ready
                    </span>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-500 dark:text-zinc-400">Default fallback</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline & Event Filtering Control Bar */}
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Timeline selector pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                Timeline:
              </span>
              {TIMELINE_OPTIONS.map((opt) => {
                const isActive = timeline === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setTimeline(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/20'
                        : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200/80 dark:bg-white/5 dark:text-zinc-300 dark:border-white/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Event Filter dropdown */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <Filter className="h-3.5 w-3.5" />
                Event Filter:
              </span>
              <div className="relative min-w-[220px]">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-zinc-200/80 bg-white px-3 py-1.5 pr-8 text-xs font-medium text-zinc-800 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/10 dark:bg-[#1a1a1e] dark:text-zinc-200"
                >
                  <option value="">All Events (Global Platform)</option>
                  {eventsList.map((evt) => (
                    <option key={evt._id} value={evt._id}>
                      {evt.name} {evt.eventCode ? `(${evt.eventCode})` : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </div>
              </div>

              {selectedEventId && (
                <button
                  onClick={() => setSelectedEventId('')}
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/80 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                  title="Clear event filter"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Active filter badge notice */}
          {(timeline !== 'all' || selectedEventId) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-200/60 dark:border-white/5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Active View:</span>
              <span className="inline-flex items-center rounded-md bg-violet-100 px-2 py-0.5 font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
                {TIMELINE_OPTIONS.find((t) => t.value === timeline)?.label}
              </span>
              {selectedEventName && (
                <span className="inline-flex items-center rounded-md bg-indigo-100 px-2 py-0.5 font-medium text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                  Event: {selectedEventName}
                </span>
              )}
              <span className="text-zinc-400">— All stats below reflect these filters in real time.</span>
            </div>
          )}
        </div>

        {/* Workload Distribution & Cloud Savings Banner */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Workload Share Progress */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-gradient-to-br from-zinc-50 to-white p-5 dark:border-white/10 dark:from-white/[0.03] dark:to-white/[0.01]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Engine Workload Distribution (Indexing + Guest Matches)
                </h4>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {totalCalls.toLocaleString()} total AI API calls
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10 flex">
              <div
                style={{ width: `${auraFacePercent}%` }}
                className="bg-violet-600 transition-all duration-500"
                title={`AuraFace: ${auraFacePercent}%`}
              />
              <div
                style={{ width: `${rekognitionPercent}%` }}
                className="bg-blue-500 transition-all duration-500"
                title={`AWS Rekognition: ${rekognitionPercent}%`}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-600" />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  AuraFace Microservice: <strong>{auraCalls}</strong> ({auraFacePercent}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  AWS Rekognition: <strong>{rekCalls}</strong> ({rekognitionPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Cloud Cost Savings Badge */}
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                  <DollarSign className="h-3 w-3" />
                  Total Self-Hosted ROI
                </span>
                <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  $0.001 / call saved
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
                ${(stats?.savingsEstimateUsd ?? 0).toFixed(3)} <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-500">USD</span>
              </p>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Estimated AWS charges avoided across both Photo Indexing and Guest Matching searches.
              </p>
            </div>
            <div className="pt-2 text-[10px] text-emerald-600/80 dark:text-emerald-400/60">
              Zero per-photo and zero per-guest search charges with local Apache 2.0 ONNX model.
            </div>
          </div>
        </div>

        {/* Live System Statistics: Segregated Breakdown */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              AI Activity Metrics ({TIMELINE_OPTIONS.find((t) => t.value === timeline)?.label})
            </h3>
            {isRefetching && (
              <span className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Updating...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Events</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {stats?.totalEvents ?? 0}
              </p>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total Photos</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
                {stats?.totalPhotos ?? 0}
              </p>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Photos Indexed</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.totalIndexedPhotos ?? 0}
              </p>
              <div className="mt-1 text-[10px] text-zinc-400">
                Aura: {stats?.photoIndexing?.insightFace ?? stats?.insightFaceIndexedPhotos ?? 0} • Rek: {stats?.photoIndexing?.rekognition ?? stats?.rekognitionIndexedPhotos ?? 0}
              </div>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Guest Searches</p>
              <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats?.guestMatching?.total ?? 0}
              </p>
              <div className="mt-1 text-[10px] text-zinc-400">
                Aura: {stats?.guestMatching?.insightFace ?? 0} • Rek: {stats?.guestMatching?.rekognition ?? 0}
              </div>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Total AI Calls</p>
              <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">
                {stats?.totalAiCalls ?? ((stats?.insightFaceIndexedPhotos ?? 0) + (stats?.rekognitionIndexedPhotos ?? 0))}
              </p>
              <div className="mt-1 text-[10px] text-violet-600 dark:text-violet-400">
                Indexing + Matches
              </div>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Index Jobs</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats?.activeIndexingJobs ?? 0}
              </p>
              <div className="mt-1 text-[10px] text-zinc-400">
                Live queue
              </div>
            </div>
          </div>
        </div>

        {/* Recognition Calls by Event Audit Table */}
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Database className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Recognition Calls by Event
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Audit of AI photo indexing and guest face matching for active events in {TIMELINE_OPTIONS.find((t) => t.value === timeline)?.label.toLowerCase()}.
              </p>
            </div>

            {/* Table Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search event name or code..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-200/80 bg-zinc-50/70 py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
              {tableSearch && (
                <button
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {filteredBreakdown.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-white/10">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                No event photo activity recorded in this timeframe.
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Upload photos or join an event to inspect real-time AI recognition routing here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200/80 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                    <th className="pb-3 font-semibold">Event Name</th>
                    <th className="pb-3 font-semibold text-center">Total Photos</th>
                    <th className="pb-3 font-semibold text-center">Indexed</th>
                    <th className="pb-3 font-semibold text-center">Guest Matches</th>
                    <th className="pb-3 font-semibold text-center">AuraFace Calls</th>
                    <th className="pb-3 font-semibold text-center">AWS Rekognition</th>
                    <th className="pb-3 font-semibold text-center">AuraFace %</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {filteredBreakdown.map((item) => {
                    const isSelected = selectedEventId === item.eventId;
                    const auraPercent = item.insightFacePercentage ?? 0;

                    return (
                      <tr
                        key={item.eventId}
                        className={`transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.02] ${
                          isSelected ? 'bg-violet-50/50 dark:bg-violet-950/20' : ''
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <div className="font-semibold text-zinc-900 dark:text-white">
                            {item.eventName}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {item.eventCode ? `Code: ${item.eventCode}` : `ID: ${item.eventId.slice(-6)}`}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-medium text-zinc-700 dark:text-zinc-300">
                          {item.totalPhotos}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {item.indexedPhotos}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 font-semibold text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                            <Users className="h-3 w-3" />
                            {item.guestMatchCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                            <Cpu className="h-3 w-3" />
                            {item.insightFaceCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                            <Cloud className="h-3 w-3" />
                            {item.rekognitionCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">
                              {auraPercent}%
                            </span>
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
                              <div
                                style={{ width: `${auraPercent}%` }}
                                className="h-full bg-violet-600"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pl-2 text-right">
                          {isSelected ? (
                            <button
                              onClick={() => setSelectedEventId('')}
                              className="rounded-md border border-violet-300 bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-800 hover:bg-violet-200 dark:border-violet-700 dark:bg-violet-900/50 dark:text-violet-200"
                            >
                              Reset
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedEventId(item.eventId)}
                              className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 hover:border-violet-400 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
                            >
                              Filter
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Microservice Details & Fallback Banner */}
        <div className="flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200/70 dark:bg-white/10">
              <Server className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                Microservice: {microservice?.serviceUrl || 'http://127.0.0.1:5055'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Model: <strong>{microservice?.model || 'AuraFace-v1 (Apache 2.0)'}</strong> • Device: <strong>{microservice?.device || 'cpu'}</strong> • Failover: <strong>Automatic AWS Rekognition fallback enabled</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isOnline ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Zero-Downtime Pipeline Ready
              </span>
            ) : (
              <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Rekognition Fallback Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
