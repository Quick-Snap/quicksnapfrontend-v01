'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, Unlink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface GoogleDriveSyncCardProps {
    eventId: string;
    onPhotosUpdated?: () => void;
}

export default function GoogleDriveSyncCard({ eventId, onPhotosUpdated }: GoogleDriveSyncCardProps) {
    const [syncData, setSyncData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isTriggeringSync, setIsTriggeringSync] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [showFailedDrawer, setShowFailedDrawer] = useState(false);

    const fetchSyncStatus = useCallback(async () => {
        if (!eventId) return;
        try {
            const res = await api.get(`/photos/google-drive/sync-status/${eventId}`);
            if (res.data?.success && res.data?.data) {
                setSyncData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch Google Drive sync status:', err);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    // Initial load
    useEffect(() => {
        fetchSyncStatus();
    }, [fetchSyncStatus]);

    // Poll every 4 seconds if syncing is active
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (syncData?.syncStatus === 'syncing') {
            interval = setInterval(() => {
                fetchSyncStatus();
            }, 4000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [syncData?.syncStatus, fetchSyncStatus]);

    // Manual Re-sync trigger
    const handleTriggerSyncNow = async () => {
        if (!syncData?.folderId) return;
        setIsTriggeringSync(true);
        try {
            const res = await api.post('/photos/google-drive/start-sync', {
                eventId,
                folderUrl: syncData.folderId,
                autoSyncEnabled: syncData.autoSyncEnabled,
                syncDurationDays: syncData.syncDurationDays || 5
            });
            if (res.data?.success) {
                toast.success('Sync started in background!');
                fetchSyncStatus();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to start sync');
        } finally {
            setIsTriggeringSync(false);
        }
    };

    // Disconnect folder
    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect this Google Drive folder? Automatic syncing will stop.')) {
            return;
        }
        setIsDisconnecting(true);
        try {
            const res = await api.post(`/photos/google-drive/disconnect-sync/${eventId}`);
            if (res.data?.success) {
                toast.success('Google Drive folder disconnected.');
                setSyncData(null);
                if (onPhotosUpdated) onPhotosUpdated();
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to disconnect');
        } finally {
            setIsDisconnecting(false);
        }
    };

    if (loading || !syncData?.folderId) {
        return null;
    }

    const progress = syncData.progress || { total: 0, current: 0, success: 0, failed: 0, failedFiles: [] };
    const isSyncing = syncData.syncStatus === 'syncing';
    const percent = progress.total > 0 ? Math.min(100, Math.round((progress.current / progress.total) * 100)) : 0;
    const expiresAt = syncData.syncExpiresAt ? new Date(syncData.syncExpiresAt) : null;
    const lastSynced = syncData.lastSyncedAt ? new Date(syncData.lastSyncedAt) : null;

    return (
        <div className="mb-6 rounded-2xl border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent p-5 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Header Info */}
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSyncing ? 'bg-blue-600 text-white animate-pulse' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                        {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Cloud className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                                {isSyncing ? 'Google Drive Sync in progress...' : 'Google Drive Folder Linked'}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isSyncing 
                                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' 
                                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            }`}>
                                {isSyncing ? 'Syncing' : 'Connected'}
                            </span>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-gray-400 mt-0.5">
                            {syncData.autoSyncEnabled && expiresAt ? (
                                <>Auto-sync active until <span className="font-medium text-zinc-700 dark:text-zinc-200">{expiresAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></>
                            ) : (
                                <>Manual sync only • Folder: <span className="font-mono text-[11px]">{syncData.folderId.slice(0, 12)}...</span></>
                            )}
                            {lastSynced && ` • Last synced ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                        type="button"
                        onClick={handleTriggerSyncNow}
                        disabled={isSyncing || isTriggeringSync}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-white/10 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-white/15 disabled:opacity-50 transition-all shadow-sm"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isTriggeringSync ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                        type="button"
                        onClick={handleDisconnect}
                        disabled={isSyncing || isDisconnecting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        title="Disconnect Folder"
                    >
                        <Unlink className="w-3.5 h-3.5" />
                        Disconnect
                    </button>
                </div>
            </div>

            {/* Sync Progress Bar */}
            {isSyncing && (
                <div className="mt-4 pt-4 border-t border-blue-500/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            Processing {progress.current} of {progress.total} photos ({percent}%)
                        </span>
                        <span className="text-[11px] text-zinc-500 dark:text-gray-400">
                            ⚡ Cloud-managed • Safe to close window
                        </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-gray-500">
                        <span>{progress.success} imported successfully</span>
                        {progress.failed > 0 && <span className="text-red-500 font-medium">{progress.failed} failed</span>}
                    </div>
                </div>
            )}

            {/* Failed Files Notification Drawer */}
            {!isSyncing && progress.failed > 0 && progress.failedFiles?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => setShowFailedDrawer(!showFailedDrawer)}
                        className="w-full flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-medium hover:underline"
                    >
                        <span className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            {progress.failed} photo(s) had download issues during last sync
                        </span>
                        {showFailedDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showFailedDrawer && (
                        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1 max-h-40 overflow-y-auto">
                            {progress.failedFiles.map((file: any, i: number) => (
                                <div key={i} className="text-[11px] flex justify-between items-center text-zinc-600 dark:text-zinc-300">
                                    <span className="font-mono truncate max-w-[60%]">{file.fileName}</span>
                                    <span className="text-zinc-400 dark:text-zinc-500">{file.reason}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
