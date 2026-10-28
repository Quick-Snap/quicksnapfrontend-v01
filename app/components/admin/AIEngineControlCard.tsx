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
  ArrowRightLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAIApi, AdminAISettings } from '@/lib/api';
import { Button } from '@/app/components/ui/Button';
import { softSurface } from '@/lib/dashboardUi';

export default function AIEngineControlCard() {
  const queryClient = useQueryClient();
  const [testingConnection, setTestingConnection] = useState(false);

  const {
    data: settingsData,
    isLoading,
    isRefetching,
    refetch
  } = useQuery<AdminAISettings | undefined>(
    'adminAISettings',
    async () => {
      const res = await adminAIApi.getSettings();
      return res.data;
    },
    {
      refetchInterval: 15000, // Periodic live stats refresh
      staleTime: 5000
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

  return (
    <div className={`overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl dark:border-white/10 dark:bg-[#121214] sm:rounded-3xl`}>
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

        {/* Live System Statistics */}
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            System & Photo Indexing Stats
          </h3>
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
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Indexed by AI</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats?.totalIndexedPhotos ?? 0}
              </p>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">InsightFace Indexed</p>
              <p className="mt-1 text-2xl font-bold text-violet-600 dark:text-violet-400">
                {stats?.insightFaceIndexedPhotos ?? 0}
              </p>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Rekognition Indexed</p>
              <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.rekognitionIndexedPhotos ?? 0}
              </p>
            </div>

            <div className={`p-4 ${softSurface}`}>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Index Jobs</p>
              <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats?.activeIndexingJobs ?? 0}
              </p>
            </div>
          </div>
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
