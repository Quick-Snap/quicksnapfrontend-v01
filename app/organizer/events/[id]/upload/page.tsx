'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
    ArrowLeft, 
    Upload, 
    CheckCircle, 
    AlertTriangle, 
    AlertCircle,
    Sparkles,
    ImageIcon,
    Camera,
    Info,
    X,
    Cloud,
    Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import RoleGuard from '@/app/components/RoleGuard';
import UploadZone from '@/app/components/ui/UploadZone';
import api from '@/app/api/axios';
import { photoApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import RefreshAttendeeMatchesCard from '@/app/components/events/RefreshAttendeeMatchesCard';
import { useAppStore } from '@/stores/appStore';

interface UploadProgress {
    total: number;
    uploaded: number;
    failed: number;
    currentFile: string;
    percent: number;
}

export default function EventUploadPage() {
    const { user } = useAuth();
    const theme = useAppStore(state => state.ui.theme);
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [eventData, setEventData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);

    const fetchEvent = async () => {
        try {
            const res = await api.get(`/events/${eventId}`);
            setEventData(res.data.data);
        } catch (error) {
            console.error('Error fetching event:', error);
            toast.error('Failed to load event details');
        } finally {
            setLoading(false);
        }
    };

    // Prevent accidental browser exit/refresh during active device uploads
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (uploading) {
                e.preventDefault();
                e.returnValue = ''; // Standard browser exit popup
                return '';
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', handleBeforeUnload);
        }
        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }
        };
    }, [uploading]);

    useEffect(() => {
        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    // Check permissions when event data and user are loaded
    useEffect(() => {
        if (!loading && eventData && user) {
            const isOrganizer = eventData.organizer?._id === user.id || eventData.organizer === user.id;
            const isPhotographer = eventData.photographers?.some((p: any) => (p._id === user.id || p === user.id));
            const isAdmin = user.role === 'admin';

            if (!isOrganizer && !isPhotographer && !isAdmin) {
                toast.error('You are not authorized to upload to this event');
                router.push('/organizer/events');
            }
        }
    }, [loading, eventData, user, router]);

    const handleUpload = async () => {
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
                eventId,
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
                toast.success(`${result.successCount} photos uploaded successfully!`);
            }
            if (result.errorCount > 0) {
                toast.error(`${result.errorCount} photos failed to upload`);
            }

            if (typeof window !== 'undefined' && result.successCount > 0) {
                sessionStorage.setItem(`qs_event_photos_dirty_${eventId}`, '1');
            }

            // Redirect to event details or organizer dashboard
            setTimeout(() => {
                router.push('/organizer/events');
            }, 2000);

        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload photos');
            setUploading(false);
            setUploadProgress(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const totalFileSize = files.reduce((acc, file) => acc + file.size, 0);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-gray-400">Loading event details...</p>
            </div>
        );
    }

    if (!eventData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                    <AlertTriangle size={40} className="text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Event Not Found</h2>
                <p className="text-gray-400 mb-6">The event you're looking for doesn't exist or has been removed.</p>
                <Link 
                    href="/organizer/events" 
                    className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 transition-all"
                >
                    Back to Events
                </Link>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['organizer', 'admin', 'photographer']}>
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link 
                        href={`/organizer/events/${eventId}`}
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Event</span>
                    </Link>
                </div>

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl p-8 border border-zinc-200/90 bg-gradient-to-br from-violet-50/95 via-white to-zinc-50 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08)] dark:border-white/5 dark:bg-gradient-to-br dark:from-[#1c1430] dark:via-[#0f0b1d] dark:to-[#0b1224] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
                    <div className="absolute inset-0 bg-gradient-mesh opacity-25 dark:opacity-70" />
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-violet-400/25 blur-3xl dark:bg-violet-500/20" />
                    <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
                    
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50/90 px-4 py-1.5 border border-violet-200/80 mb-4 dark:bg-white/5 dark:border-white/10">
                                <Camera className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                                <span className="text-sm font-medium text-violet-800 dark:text-gray-200">Photo Upload</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">
                                Upload Photos
                            </h1>
                            <p className="text-zinc-600 dark:text-gray-300 max-w-xl">
                                Adding photos to <span className="text-violet-600 dark:text-violet-300 font-semibold">{eventData.name}</span>
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-zinc-200 dark:bg-white/5 dark:border-white/10">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm text-zinc-500 dark:text-gray-400">Event Photos</p>
                                <p className="text-xl font-bold text-zinc-900 dark:text-white">{eventData.photoCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {!uploading ? (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Main Upload Area */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Upload Zone Card */}
                            <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                                        <Cloud className="h-5 w-5 text-violet-500 dark:text-violet-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Upload Your Photos</h2>
                                        <p className="text-sm text-zinc-500 dark:text-gray-500">Drag and drop or click to select</p>
                                    </div>
                                </div>

                                <UploadZone
                                    onFilesSelected={setFiles}
                                    maxFiles={50}
                                    eventId={eventId}
                                    onSyncComplete={fetchEvent}
                                />

                                {/* File Summary */}
                                {files.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/10">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <ImageIcon size={18} className="text-violet-500 dark:text-violet-400" />
                                                    <span className="text-zinc-600 dark:text-gray-300">
                                                        <span className="text-zinc-900 dark:text-white font-semibold">{files.length}</span> photos selected
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Cloud size={18} className="text-indigo-500 dark:text-indigo-400" />
                                                    <span className="text-zinc-600 dark:text-gray-300">
                                                        <span className="text-zinc-900 dark:text-white font-semibold">{formatFileSize(totalFileSize)}</span> total
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setFiles([])}
                                                className="text-sm text-zinc-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                                            >
                                                <X size={16} />
                                                Clear all
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Upload Button */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href={`/organizer/events/${eventId}`} className="flex-1 sm:flex-none">
                                    <button 
                                        type="button" 
                                        className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-semibold text-zinc-700 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200/80 transition-all dark:text-gray-300 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
                                    >
                                        Cancel
                                    </button>
                                </Link>
                                <button
                                    onClick={handleUpload}
                                    disabled={files.length === 0}
                                    className="flex-1 py-3.5 px-8 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-violet-500/25 flex items-center justify-center gap-2"
                                >
                                    <Upload className="h-5 w-5" />
                                    Upload {files.length > 0 ? `${files.length} Photos` : 'Photos'}
                                </button>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Guidelines Card */}
                            <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <Info className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Upload Guidelines</h3>
                                </div>
                                
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <span className="text-zinc-600 dark:text-gray-400">Supported formats: <span className="text-zinc-800 dark:text-gray-300 font-medium">JPG, PNG, WEBP, HEIC</span></span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <span className="text-zinc-600 dark:text-gray-400">Max file size: <span className="text-zinc-800 dark:text-gray-300 font-medium">10MB per photo</span></span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <CheckCircle className="h-3 w-3 text-violet-600 dark:text-violet-400" />
                                        </div>
                                        <span className="text-zinc-600 dark:text-gray-400">Max files: <span className="text-zinc-800 dark:text-gray-300 font-medium">50 at a time</span></span>
                                    </li>
                                </ul>
                            </div>

                            {/* AI Feature Card */}
                            <div className="card bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/20 shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">AI-Powered</h3>
                                </div>
                                
                                <p className="text-sm text-zinc-600 dark:text-gray-400 mb-4">
                                    Our AI automatically detects faces in your photos and matches them to registered attendees.
                                </p>
                                
                                <div className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-300">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Face recognition enabled</span>
                                </div>
                            </div>

                            <RefreshAttendeeMatchesCard eventId={eventId} event={eventData} variant={theme === 'dark' ? 'dark' : 'light'} />

                            {/* Tips Card */}
                            <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">Pro Tips</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-zinc-600 dark:text-gray-400">Upload high-quality images for better face detection</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-zinc-600 dark:text-gray-400">Group photos work great for tagging multiple people</span>
                                    </li>
                                    <li className="flex items-start gap-3 text-sm">
                                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-zinc-600 dark:text-gray-400">You can upload in batches if you have many photos</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Upload Progress State */
                    <div className="card border-zinc-200/90 shadow-lg shadow-zinc-900/5 dark:bg-[#0d0b14] dark:border-white/5 dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]">
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            {uploadProgress && uploadProgress.uploaded + uploadProgress.failed < uploadProgress.total ? (
                                <>
                                    {/* Progress Ring */}
                                    <div className="w-32 h-32 mb-8 relative">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                className="text-zinc-200 dark:text-white/10"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="url(#progressGradient)"
                                                strokeWidth="8"
                                                fill="transparent"
                                                strokeLinecap="round"
                                                strokeDasharray={351.86}
                                                strokeDashoffset={351.86 - (351.86 * ((uploadProgress.uploaded + uploadProgress.failed) / uploadProgress.total))}
                                                className="transition-all duration-500 ease-out"
                                            />
                                            <defs>
                                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#8b5cf6" />
                                                    <stop offset="100%" stopColor="#6366f1" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-zinc-900 dark:text-white">{uploadProgress.uploaded}</span>
                                            <span className="text-sm text-zinc-500 dark:text-gray-400">of {uploadProgress.total}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Uploading Photos...</h3>
                                    <p className="text-zinc-500 dark:text-gray-400 mb-4">Please keep this window open</p>
                                    
                                    {uploadProgress.currentFile && (
                                        <div className="px-4 py-2 rounded-lg bg-zinc-100 border border-zinc-200 dark:bg-white/5 dark:border-white/10 mb-6">
                                            <p className="text-sm text-zinc-800 dark:text-gray-300 truncate max-w-xs">
                                                {uploadProgress.currentFile}
                                            </p>
                                            <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-1.5 mt-2">
                                                <div 
                                                    className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress.percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-6">
                                        {uploadProgress.uploaded > 0 && (
                                            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle size={18} />
                                                <span className="font-medium">{uploadProgress.uploaded} uploaded</span>
                                            </span>
                                        )}
                                        {uploadProgress.failed > 0 && (
                                            <span className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                                <AlertCircle size={18} />
                                                <span className="font-medium">{uploadProgress.failed} failed</span>
                                            </span>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Upload Complete State */
                                <div className="animate-scale-in">
                                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                                        <CheckCircle size={48} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">Upload Complete!</h3>
                                    {uploadProgress && (
                                        <div className="space-y-2 mb-6">
                                            <p className="text-zinc-800 dark:text-gray-300 text-lg">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{uploadProgress.uploaded}</span> photos uploaded successfully
                                            </p>
                                            {uploadProgress.failed > 0 && (
                                                <p className="text-red-600 dark:text-red-400">
                                                    {uploadProgress.failed} photos failed to upload
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-center gap-2 text-zinc-500 dark:text-gray-400">
                                        <div className="w-4 h-4 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin" />
                                        <span>Redirecting to dashboard...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </RoleGuard>
    );
}
