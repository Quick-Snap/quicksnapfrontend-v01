'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/app/components/ui/UploadZone';
import { photoApi, eventApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import RoleGuard from '@/app/components/RoleGuard';

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

export default function AdminBulkUploadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // Admin sees all events
            const response = await eventApi.getAll({ limit: 100 });
            if (response.success && response.data) {
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Failed to load events');
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
            const result = await photoApi.uploadWithPresignedUrls(
                selectedEvent,
                files,
                (fileIndex, progress) => {
                    setUploadProgress(prev => prev ? {
                        ...prev,
                        currentFile: files[fileIndex].name,
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
                    console.error(`Failed to upload ${files[fileIndex].name}: ${error}`);
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
        <RoleGuard allowedRoles={['admin']}>
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">Admin Bulk Upload (RAW)</h1>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Select Any Event
                        </label>
                        <select
                            value={selectedEvent}
                            onChange={(e) => setSelectedEvent(e.target.value)}
                            className="w-full p-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                            disabled={loadingEvents}
                        >
                            <option value="">Select an event...</option>
                            {events.map(event => (
                                <option key={event._id} value={event._id}>
                                    {event.name}
                                </option>
                            ))}
                        </select>
                        {loadingEvents && <p className="text-sm text-neutral-500 mt-1">Loading events...</p>}
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <h2 className="text-xl font-semibold mb-4">Upload Photos</h2>
                        <UploadZone onFilesSelected={setFiles} maxFiles={100} />

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
