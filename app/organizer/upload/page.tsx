'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleGuard from '@/app/components/RoleGuard';
import UploadZone from '@/app/components/ui/UploadZone';
import { photoApi, eventApi } from '@/lib/api';
import api from '@/app/api/axios';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, AlertCircle, Sliders, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { batchCompressImages, formatBytes } from '@/lib/clientImageCompress';

interface Event {
    _id: string;
    name: string;
}

interface UploadProgress {
    total: number;
    uploaded: number;
    failed: number;
    currentFile: string;
    percent: number;
}

export default function BulkUploadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [uploadQuality, setUploadQuality] = useState<'preview' | 'original'>('preview');
    const [compressing, setCompressing] = useState(false);
    const [compressionStatus, setCompressionStatus] = useState('');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await api.get('/events/managed/all');
            const list = Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.events || []);
            setEvents(list);
        } catch (error) {
            console.error('Error fetching events:', error);
            try {
                const response = await eventApi.getAll({ limit: 100 });
                const fallbackList = Array.isArray(response.data) ? response.data : ((response.data as any)?.events || []);
                setEvents(fallbackList);
            } catch (fallbackError) {
                toast.error('Failed to load events');
            }
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleUpload = async () => {
        if (!selectedEvent) {
            toast.error('Please select an event');
            return;
        }
        if (files.length === 0) {
            toast.error('Please select files to upload');
            return;
        }

        setUploading(true);
        setUploadProgress({
            total: files.length,
            uploaded: 0,
            failed: 0,
            currentFile: '',
            percent: 0,
        });

        try {
            let filesToUpload = files;
            if (uploadQuality === 'preview') {
                setCompressing(true);
                setCompressionStatus(`Optimizing ${files.length} photo(s) for fast web proofing...`);
                try {
                    const compressRes = await batchCompressImages(files, (p) => {
                        setCompressionStatus(`Optimizing ${p.current} of ${p.total} (${p.percent}%)...`);
                    });
                    filesToUpload = compressRes.files;
                    if (compressRes.savedBytes > 0) {
                        toast.success(
                            `Saved ${formatBytes(compressRes.savedBytes)} (${compressRes.percentSaved}% upload bandwidth)!`,
                            { duration: 4000 }
                        );
                    }
                } catch (err) {
                    console.warn('Compression error, falling back to original files:', err);
                    filesToUpload = files;
                } finally {
                    setCompressing(false);
                }
            }

            const result = await photoApi.uploadWithPresignedUrls(
                selectedEvent,
                filesToUpload,
                (fileIndex, progress) => {
                    setUploadProgress(prev => prev ? {
                        ...prev,
                        currentFile: filesToUpload[fileIndex]?.name || files[fileIndex]?.name,
                        percent: progress.percent,
                    } : null);
                },
                (fileIndex) => {
                    setUploadProgress(prev => prev ? {
                        ...prev,
                        uploaded: prev.uploaded + 1,
                    } : null);
                },
                (fileIndex, error) => {
                    setUploadProgress(prev => prev ? {
                        ...prev,
                        failed: prev.failed + 1,
                    } : null);
                    console.error(`Failed to upload ${filesToUpload[fileIndex]?.name || files[fileIndex]?.name}: ${error}`);
                }
            );

            if (result.successCount > 0) {
                toast.success(`${result.successCount} photos uploaded successfully! Processing started.`);
            }
            if (result.errorCount > 0) {
                toast.error(`${result.errorCount} photos failed to upload`);
            }
            
            setFiles([]);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload photos');
        } finally {
            setUploading(false);
            setUploadProgress(null);
        }
    };

    return (
        <RoleGuard allowedRoles={['organizer']}>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Bulk Photo Upload</h1>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Select Event
                        </label>
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                            disabled={loadingEvents}
                        >
                            <option value="">Select an event...</option>
                            {(Array.isArray(events) ? events : []).map(event => (
                                <option key={event._id} value={event._id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                        {loadingEvents && <p className="text-sm text-neutral-500 mt-1">Loading events...</p>}
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>

                        {/* Upload Quality Mode Selector */}
                        <div className="mb-6 rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sliders size={16} className="text-violet-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                                        Upload Quality Mode
                                    </span>
                                </div>
                                <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/40 px-2.5 py-0.5 rounded-full">
                                    {uploadQuality === 'preview' ? '⚡ 10x Faster Uploads (Recommended)' : '💎 Untouched RAW Quality'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Mode 1: Fast Web Proofing */}
                                <button
                                    type="button"
                                    onClick={() => setUploadQuality('preview')}
                                    className={`p-3.5 rounded-xl text-left border transition-all ${
                                        uploadQuality === 'preview'
                                            ? 'border-violet-500 bg-white dark:bg-violet-950/30 ring-2 ring-violet-500/30 shadow-sm'
                                            : 'border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                            <span>⚡ Fast Web Proofing</span>
                                            <span className="text-[10px] uppercase font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                                                Recommended
                                            </span>
                                        </span>
                                        {uploadQuality === 'preview' && <Check size={16} className="text-violet-600 dark:text-violet-400" />}
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Resizes in browser to 2048px retina quality (~500 KB). 10x faster upload from venue or mobile hotspots. Perfect for guest face matching & album selection.
                                    </p>
                                </button>

                                {/* Mode 2: Full Master Original */}
                                <button
                                    type="button"
                                    onClick={() => setUploadQuality('original')}
                                    className={`p-3.5 rounded-xl text-left border transition-all ${
                                        uploadQuality === 'original'
                                            ? 'border-violet-500 bg-white dark:bg-violet-950/30 ring-2 ring-violet-500/30 shadow-sm'
                                            : 'border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] hover:border-zinc-300 dark:hover:border-white/20'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                                            <span>💎 Full Master RAWs</span>
                                        </span>
                                        {uploadQuality === 'original' && <Check size={16} className="text-violet-600 dark:text-violet-400" />}
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                        Uploads untouched original files (10MB–30MB+). Preserves maximum print DPI for clients requesting full original RAW downloads.
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Compressing Banner */}
                        {compressing && (
                            <div className="mb-4 p-4 rounded-xl border border-violet-200 bg-violet-50 text-violet-900 dark:bg-violet-950/30 dark:border-violet-500/30 dark:text-violet-200 flex items-center gap-3 animate-pulse">
                                <Loader2 className="animate-spin h-5 w-5 text-violet-600" />
                                <div className="text-sm">
                                    <span className="font-semibold">{compressionStatus || 'Optimizing photos for fast proofing...'}</span>
                                    <p className="text-xs text-violet-700/80 dark:text-violet-300/80">Scaling in browser to save bandwidth and speed up upload.</p>
                                </div>
                            </div>
                        )}

                        <UploadZone 
                            onFilesSelected={setFiles} 
                            maxFiles={100} 
                            eventId={selectedEvent} 
                            uploadQuality={uploadQuality}
                        />

                        {/* Upload Progress */}
                        {uploadProgress && (
                            <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-neutral-700">
                                        Uploading: {uploadProgress.uploaded + uploadProgress.failed} / {uploadProgress.total}
                                    </span>
                                    <div className="flex items-center gap-3 text-sm">
                                        {uploadProgress.uploaded > 0 && (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle size={16} />
                                                {uploadProgress.uploaded}
                                            </span>
                                        )}
                                        {uploadProgress.failed > 0 && (
                                            <span className="flex items-center gap-1 text-red-600">
                                                <AlertCircle size={16} />
                                                {uploadProgress.failed}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((uploadProgress.uploaded + uploadProgress.failed) / uploadProgress.total) * 100}%` }}
                                    />
                                </div>
                                {uploadProgress.currentFile && (
                                    <p className="text-xs text-neutral-500 truncate">
                                        Current: {uploadProgress.currentFile} ({uploadProgress.percent}%)
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={handleUpload}
                                disabled={uploading || files.length === 0 || !selectedEvent}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {uploading && <Loader2 className="animate-spin" size={20} />}
                                {uploading ? 'Uploading...' : `Upload ${files.length > 0 ? files.length : ''} Photos`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}
