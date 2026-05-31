'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { 
    X, 
    Cloud, 
    ArrowLeft, 
    Sparkles, 
    Folder, 
    ImageIcon, 
    Zap, 
    CheckCircle, 
    AlertCircle, 
    ChevronRight,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/app/api/axios';
import { useAppStore } from '@/stores/appStore';

interface GooglePhotosModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    onSyncComplete?: () => void;
}

/**
 * ProxyImage: Fetches Google Photos Picker images through the backend proxy
 * using proper Authorization headers (not URL query params), converts to blob URLs.
 * Handles HEIC format by requesting JPEG conversion via =w{size}-rj suffix.
 */
function ProxyImage({ baseUrl, googleToken, filename, className }: {
    baseUrl: string;
    googleToken: string | null;
    filename: string;
    className?: string;
}) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!baseUrl) {
            setLoading(false);
            setError(true);
            return;
        }

        // Abort any previous request
        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setError(false);

        const fetchImage = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const jwtToken = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
                // Request JPEG conversion with =w150-rj to handle HEIC and other exotic formats
                const targetUrl = `${baseUrl}=w150-rj`;

                const res = await fetch(
                    `${apiUrl}/photos/google-photos/proxy?url=${encodeURIComponent(targetUrl)}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${jwtToken || ''}`,
                            ...(googleToken ? { 'x-google-access-token': googleToken } : {})
                        },
                        signal: controller.signal
                    }
                );

                if (!res.ok) throw new Error(`Proxy returned ${res.status}`);

                const blob = await res.blob();
                if (controller.signal.aborted) return;

                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error(`Preview failed for ${filename}:`, err.message);
                    setError(true);
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchImage();

        return () => {
            controller.abort();
            // Revoke blob URL on cleanup
            setBlobUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseUrl, googleToken]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-zinc-100 dark:bg-white/5">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            </div>
        );
    }

    if (error || !blobUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-100 dark:bg-white/5 gap-1">
                <ImageIcon className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                <span className="text-[9px] text-zinc-400 dark:text-zinc-600 truncate max-w-full px-1">{filename}</span>
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={blobUrl}
            alt={filename}
            className={className || 'object-cover w-full h-full'}
        />
    );
}

export default function GooglePhotosModal({ isOpen, onClose, eventId, onSyncComplete }: GooglePhotosModalProps) {
    const theme = useAppStore(state => state.ui.theme);
    const isDarkMode = theme === 'dark';

    const [googleToken, setGoogleToken] = useState<string | null>(null);
    const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Ingestion state
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });

    // Try reading credentials in client window
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        // Load Google Identity Services script immediately on mount to enable synchronous user click popups
        if (typeof window !== 'undefined') {
            const google = (window as any).google;
            if (!google || !google.accounts || !google.accounts.oauth2) {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                document.body.appendChild(script);
            }
        }
    }, []);

    const [pickerSessionId, setPickerSessionId] = useState<string | null>(null);
    const [isWaitingForPicker, setIsWaitingForPicker] = useState(false);
    const [pickerStatus, setPickerStatus] = useState<string>('idle');
    const [albumUrl, setAlbumUrl] = useState('');
    const [isScrapingLink, setIsScrapingLink] = useState(false);
    const [activeTab, setActiveTab] = useState<'picker' | 'link'>('link');

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setSelectedAlbum(null);
            setPhotos([]);
            setSyncing(false);
            setLoading(false);
            setIsWaitingForPicker(false);
            setPickerStatus('idle');
            setPickerSessionId(null);
            setAlbumUrl('');
            setIsScrapingLink(false);
            setActiveTab('link');
            if (typeof window !== 'undefined' && (window as any)._pickerIntervalId) {
                clearInterval((window as any)._pickerIntervalId);
            }
        }
    }, [isOpen]);

    // Handle initial Authentication
    const handleConnectGoogle = () => {
        if (!clientId) {
            toast.error('Google Client ID is not configured in environment variables. Please check your settings.');
            return;
        }

        // Check if GSI is loaded
        const google = (window as any).google;
        if (!google || !google.accounts || !google.accounts.oauth2) {
            toast.error('Google Auth library is still loading. Please try again in a second.');
            return;
        }

        setLoading(true);
        try {
            initTokenClient();
        } catch (err: any) {
            console.error('Google auth error:', err);
            toast.error('Failed to initialize Google Authentication. Please try again.');
            setLoading(false);
        }
    };

    const initTokenClient = () => {
        try {
            const google = (window as any).google;
            const client = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
                prompt: 'consent',
                callback: (tokenResponse: any) => {
                    setLoading(false);
                    if (tokenResponse.access_token) {
                        setGoogleToken(tokenResponse.access_token);
                    } else {
                        toast.error('Google authorization declined.');
                    }
                },
                error_callback: (err: any) => {
                    setLoading(false);
                    console.error('GSI client error:', err);
                    toast.error('Failed to get Google Photos permissions.');
                }
            });
            client.requestAccessToken();
        } catch (err) {
            setLoading(false);
            toast.error('An error occurred while launching Google Sign-in.');
        }
    };

    const handleLaunchPicker = async () => {
        if (!googleToken) {
            toast.error('Please sign in with Google first.');
            return;
        }

        setLoading(true);
        setIsWaitingForPicker(true);
        setPickerStatus('created');
        try {
            const res = await api.post('/photos/google-photos/picker/sessions', {}, {
                headers: { 'x-google-access-token': googleToken }
            });

            if (res.data?.success && res.data?.data?.pickerUri) {
                const session = res.data.data;
                setPickerSessionId(session.id);
                setPickerStatus('polling');
                
                // Open picker window
                const pickerWindow = window.open(session.pickerUri + '/autoclose', '_blank');
                
                // Start polling
                const intervalId = setInterval(async () => {
                    try {
                        const statusRes = await api.get(`/photos/google-photos/picker/sessions/${session.id}`, {
                            headers: { 'x-google-access-token': googleToken }
                        });
                        
                        if (statusRes.data?.success) {
                            const currentSession = statusRes.data.data;
                            if (currentSession.mediaItemsSet) {
                                clearInterval(intervalId);
                                setPickerStatus('completed');
                                if (pickerWindow) pickerWindow.close();
                                
                                // Fetch selected items
                                fetchPickerItems(session.id);
                            }
                        } else {
                            clearInterval(intervalId);
                            setPickerStatus('failed');
                            setIsWaitingForPicker(false);
                            toast.error('Failed to check picker session status.');
                        }
                    } catch (pollErr) {
                        console.error('Error polling picker status:', pollErr);
                    }
                }, 3000);
                
                // Save interval to clear if component unmounts
                (window as any)._pickerIntervalId = intervalId;

            } else {
                toast.error('Failed to create Google Photos picker session.');
                setIsWaitingForPicker(false);
                setPickerStatus('idle');
            }
        } catch (err: any) {
            console.error('Picker error:', err);
            toast.error(err.response?.data?.message || 'Failed to open Google Photos picker.');
            setIsWaitingForPicker(false);
            setPickerStatus('idle');
        } finally {
            setLoading(false);
        }
    };

    const fetchPickerItems = async (sessionId: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/photos/google-photos/picker/sessions/${sessionId}/media-items`, {
                headers: { 'x-google-access-token': googleToken! }
            });

            if (res.data?.success && res.data?.data?.mediaItems) {
                const items = res.data.data.mediaItems;
                if (items.length === 0) {
                    toast.error('No photos were selected.');
                    setIsWaitingForPicker(false);
                    return;
                }
                const mappedPhotos = items.map((item: any) => ({
                    id: item.id,
                    baseUrl: item.mediaFile.baseUrl,
                    filename: item.mediaFile.filename || `photo_${item.id}.jpg`,
                    mimeType: item.mediaFile.mimeType
                }));
                setPhotos(mappedPhotos);
                setSelectedAlbum({ title: 'Selected Photos' }); // Mock active selection for preview view
                toast.success(`Successfully loaded ${mappedPhotos.length} selected photos!`);
            } else {
                toast.error('Failed to retrieve selected photos.');
            }
        } catch (err) {
            console.error('Error fetching picker media items:', err);
            toast.error('Failed to fetch selected photos.');
        } finally {
            setLoading(false);
            setIsWaitingForPicker(false);
        }
    };

    const handleImportAlbumLink = async () => {
        if (!albumUrl) return;
        setIsScrapingLink(true);
        setLoading(true);
        try {
            const res = await api.post('/photos/google-photos/import-album-link', {
                eventId,
                albumUrl
            });
            
            if (res.data?.success && res.data?.data?.photos) {
                const photosList = res.data.data.photos;
                setPhotos(photosList);
                setSelectedAlbum({ title: res.data.data.albumTitle || 'Shared Album Link' });
                toast.success(`Successfully found ${photosList.length} photos in the shared album!`);
            } else {
                toast.error('Could not find any photos in the shared album. Make sure link-sharing is ON.');
            }
        } catch (err: any) {
            console.error('Album link import error:', err);
            toast.error(err.response?.data?.message || 'Failed to load album photos from link.');
        } finally {
            setIsScrapingLink(false);
            setLoading(false);
        }
    };

    // Execute batch photo ingestion concurrently with a limit of 3 workers
    const handleSyncAlbum = async () => {
        if (photos.length === 0) {
            toast.error('No photos to import.');
            return;
        }

        setSyncing(true);
        setSyncProgress({
            total: photos.length,
            current: 0,
            success: 0,
            failed: 0
        });

        // Concurrency settings
        // Future extension: Adjust dynamically (e.g., limit to 1 concurrent request during high-traffic 11 AM - 6 PM,
        // and 3 concurrent requests at night/other times).
        const CONCURRENCY_LIMIT = 3;
        const totalPhotos = photos.length;
        
        let activeIndex = 0;
        let successCount = 0;
        let failedCount = 0;
        let processedCount = 0;

        const runWorker = async () => {
            while (true) {
                // Fetch next photo index atomically (JS event loop execution makes this safe)
                const currentIndex = activeIndex++;
                if (currentIndex >= totalPhotos) {
                    break;
                }

                const photo = photos[currentIndex];

                try {
                    // Ingest Google Photo URL on backend
                    const res = await api.post('/photos/google-photos/import-file', {
                        eventId,
                        baseUrl: photo.baseUrl,
                        filename: photo.filename
                    }, {
                        headers: (activeTab === 'link' || !googleToken) ? {} : { 'x-google-access-token': googleToken }
                    });

                    if (res.data?.success) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                } catch (err) {
                    console.error(`Import failed for ${photo.filename}:`, err);
                    failedCount++;
                } finally {
                    processedCount++;
                    // Functional state update avoids any state merging race conditions
                    setSyncProgress(prev => ({
                        ...prev,
                        current: processedCount,
                        success: successCount,
                        failed: failedCount
                    }));
                }
            }
        };

        // Spawn concurrent workers
        const workers = [];
        const actualWorkersCount = Math.min(CONCURRENCY_LIMIT, totalPhotos);
        for (let w = 0; w < actualWorkersCount; w++) {
            workers.push(runWorker());
        }

        // Await completion of all workers
        await Promise.all(workers);

        // Notify parent context to refresh matches index
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(`qs_event_photos_dirty_${eventId}`, '1');
        }

        toast.success(`Google Photos Sync completed!`);
        setSyncing(false);
        if (onSyncComplete) {
            onSyncComplete();
        }
        
        // Wait and close
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    const getProxyPreviewUrl = (baseUrl: string) => {
        if (!baseUrl) return '';
        
        // Public Unsplash URLs never need proxying
        if (baseUrl.includes('unsplash.com')) {
            return `${baseUrl}=w150`;
        }
        
        // Public shared album URLs (from link scraping) are on googleusercontent.com
        // and are publicly accessible — load them directly without proxying.
        if (activeTab === 'link' && baseUrl.includes('googleusercontent.com')) {
            // Use -rj to force JPEG conversion (handles HEIC, WebP, etc.)
            return `${baseUrl}=w150-rj`;
        }
        
        // For Picker API images, ProxyImage component handles fetching directly.
        // This fallback is only used if somehow called for non-picker, non-link URLs.
        return `${baseUrl}=w150-rj`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={() => !syncing && onClose()}
            />

            {/* Modal Body */}
            <div className={`
                relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 animate-scale-in
                ${isDarkMode 
                    ? 'bg-[#0f0c18] border-white/5 text-white shadow-black/80' 
                    : 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-900/10'
                }
            `}>
                {/* Header */}
                <div className={`
                    flex items-center justify-between p-6 border-b
                    ${isDarkMode ? 'border-white/5 bg-white/[0.01]' : 'border-zinc-100 bg-zinc-50/50'}
                `}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Cloud className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Google Photos Sync
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-gray-400">Import event photos seamlessly from your albums</p>
                        </div>
                    </div>

                    {!syncing && (
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <X size={20} className="text-zinc-500" />
                        </button>
                    )}
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[40vh] max-h-[55vh]">
                    {syncing ? (
                        /* Processing / Sync Progress Ring dashboard */
                        <div className="py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-36 h-36 mb-8 relative flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-zinc-100 dark:text-white/5"
                                    />
                                    <circle
                                        cx="72"
                                        cy="72"
                                        r="60"
                                        stroke="url(#modalProgressGrad)"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeLinecap="round"
                                        strokeDasharray={377}
                                        strokeDashoffset={377 - (377 * (syncProgress.current / syncProgress.total))}
                                        className="transition-all duration-300"
                                    />
                                    <defs>
                                        <linearGradient id="modalProgressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#8b5cf6" />
                                            <stop offset="100%" stopColor="#4f46e5" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute flex flex-col items-center">
                                    <span className="text-3xl font-extrabold">{syncProgress.current}</span>
                                    <span className="text-xs text-zinc-500 dark:text-gray-400">of {syncProgress.total}</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-2">Syncing Album Photos...</h3>
                            <p className="text-sm text-zinc-500 dark:text-gray-400 mb-6 max-w-sm">
                                Fetching full-res images, running face-detection, and matching attendee indexes.
                            </p>

                            <div className="flex items-center gap-6 justify-center bg-zinc-50 dark:bg-white/[0.02] p-4 rounded-xl border border-zinc-100 dark:border-white/5">
                                <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                                    <CheckCircle size={16} />
                                    {syncProgress.success} Success
                                </span>
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-white/10" />
                                <span className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-semibold">
                                    <AlertCircle size={16} />
                                    {syncProgress.failed} Failed
                                </span>
                            </div>
                        </div>
                    ) : isWaitingForPicker ? (
                        /* Waiting for Picker selection state */
                        <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                            <div className="relative flex items-center justify-center mb-8">
                                <div className="absolute w-24 h-24 rounded-full bg-violet-500/10 animate-ping" />
                                <div className="relative w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-pulse" />
                                </div>
                            </div>

                            <h3 className="text-xl font-bold mb-2">Google Photos Picker Active</h3>
                            <p className="text-sm text-zinc-500 dark:text-gray-400 mb-6">
                                We opened the Google Photos Picker in a new window/tab. Please select the photos you want to import and click **"Done"**.
                            </p>

                            <div className="w-full p-4 rounded-xl border bg-zinc-50 dark:bg-white/[0.02] border-zinc-100 dark:border-white/5 space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-xs text-left text-zinc-500 dark:text-gray-400">
                                    <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center font-bold text-violet-600 dark:text-violet-400">1</div>
                                    <span>Select files in the Google Photos tab</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-left text-zinc-500 dark:text-gray-400">
                                    <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center font-bold text-violet-600 dark:text-violet-400">2</div>
                                    <span>Click the blue **"Done"** or **"Select"** button</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-left text-zinc-500 dark:text-gray-400">
                                    <div className="w-5 h-5 rounded-full bg-violet-500/10 flex items-center justify-center font-bold text-violet-600 dark:text-violet-400">3</div>
                                    <span>Quick Snap will automatically sync and show previews!</span>
                                </div>
                            </div>

                            <button
                                onClick={handleLaunchPicker}
                                className="text-xs px-4 py-2 rounded-lg font-semibold border border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/5 hover:bg-violet-500/10 transition-colors"
                            >
                                Did popup get blocked? Relaunch Picker
                            </button>
                        </div>
                    ) : loading ? (
                        /* Loading state */
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                            <p className="text-sm text-zinc-500 dark:text-gray-400">Loading albums & photos...</p>
                        </div>
                    ) : !selectedAlbum ? (
                        /* Choice Dashboard */
                        <div className="space-y-6">
                            {/* Premium Tab Selector */}
                            <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-white/5 max-w-md mx-auto">
                                <button
                                    onClick={() => {
                                        setActiveTab('link');
                                    }}
                                    className={`
                                        flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2
                                        ${activeTab === 'link'
                                            ? (isDarkMode ? 'bg-[#18132d] text-white shadow-lg shadow-black/40' : 'bg-white text-zinc-900 shadow-sm')
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                        }
                                    `}
                                >
                                    <Zap className="w-3.5 h-3.5 text-violet-500 fill-current" />
                                    Import via Album Link
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('picker');
                                    }}
                                    className={`
                                        flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2
                                        ${activeTab === 'picker'
                                            ? (isDarkMode ? 'bg-[#18132d] text-white shadow-lg shadow-black/40' : 'bg-white text-zinc-900 shadow-sm')
                                            : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                        }
                                    `}
                                >
                                    <Cloud className="w-3.5 h-3.5" />
                                    Live Photos Picker
                                </button>
                            </div>

                            {activeTab === 'link' ? (
                                /* Option B: Paste Public Shared Album Link Card */
                                <div className={`
                                    p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group max-w-xl mx-auto
                                    ${isDarkMode 
                                        ? 'bg-gradient-to-br from-violet-950/10 via-zinc-950/10 to-transparent border-violet-500/20' 
                                        : 'bg-gradient-to-br from-violet-50/50 via-zinc-50/20 to-transparent border-violet-200'
                                    }
                                `}>
                                    <div className="max-w-md space-y-4">
                                        <div>
                                            <h3 className="text-md font-bold mb-1 flex items-center gap-2 text-violet-600 dark:text-violet-400">
                                                <Zap className="w-4 h-4 fill-current animate-pulse text-violet-500" />
                                                Import via Public Shared Album Link
                                            </h3>
                                            <p className="text-xs text-zinc-500 dark:text-gray-400 leading-relaxed">
                                                Paste a public Google Photos shared link to import **every single photo** from the album in a single click, regardless of who owns it!
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={albumUrl}
                                                onChange={(e) => setAlbumUrl(e.target.value)}
                                                placeholder="e.g. https://photos.app.goo.gl/... or https://photos.google.com/share/..."
                                                className="w-full px-4 py-3 rounded-xl border bg-transparent font-medium text-xs focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all border-zinc-200 dark:border-white/10 dark:text-white"
                                            />
                                            <p className="text-[10px] text-zinc-400 dark:text-gray-500">
                                                💡 **Make sure link-sharing is turned ON** in your Google Photos album options before copying the link.
                                            </p>
                                        </div>

                                        <button
                                            onClick={handleImportAlbumLink}
                                            disabled={!albumUrl || isScrapingLink}
                                            className="w-full py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 text-xs shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35"
                                        >
                                            {isScrapingLink ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Parsing Album...
                                                </>
                                            ) : (
                                                <>
                                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                                    Load and Sync All Photos
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Option A: Live Google Photos Picker Card */
                                <>
                                    {googleToken ? (
                                        <div className={`
                                            p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group max-w-xl mx-auto
                                            ${isDarkMode 
                                                ? 'bg-gradient-to-br from-violet-950/20 via-indigo-950/10 to-transparent border-violet-500/20 animate-pulse-subtle' 
                                                : 'bg-gradient-to-br from-violet-50 via-indigo-50/30 to-transparent border-violet-200'
                                            }
                                        `}>
                                            <div className="absolute top-4 right-4">
                                                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-violet-500 text-white tracking-wide">
                                                    Recommended & Secure
                                                </span>
                                            </div>
                                            <div className="max-w-md">
                                                <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-violet-700 dark:text-violet-300">
                                                    <Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
                                                    Google Photos Secure Picker
                                                </h3>
                                                <p className="text-xs text-zinc-500 dark:text-gray-400 mb-5 leading-relaxed">
                                                    Google requires this secure picker for privacy. Select any photos or videos from your library, and Quick Snap will automatically download, face-match, and index them.
                                                </p>
                                                <button
                                                    onClick={handleLaunchPicker}
                                                    className="py-3 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 hover:shadow-violet-500/35 transition-all flex items-center gap-2 text-sm"
                                                >
                                                    <Cloud className="w-4 h-4" />
                                                    Launch Live Photos Picker
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Connect Google Photos Login UI inside Picker Tab */
                                        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto space-y-6">
                                            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                                                <Cloud className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold mb-1">Connect Google Photos</h3>
                                                <p className="text-sm text-zinc-500 dark:text-gray-400">
                                                    Link your Google account to select individual photos securely using the native picker.
                                                </p>
                                            </div>

                                            <div className="w-full flex flex-col gap-3">
                                                <button
                                                    onClick={handleConnectGoogle}
                                                    className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all flex items-center justify-center gap-2.5 animate-scale-in"
                                                >
                                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                                    </svg>
                                                    Sign in with Google
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        /* Photos Preview view */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-4">
                                <button
                                    onClick={() => setSelectedAlbum(null)}
                                    className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    Back to Albums
                                </button>
                                <span className="text-sm font-medium text-zinc-600 dark:text-gray-300">
                                    Selected: <span className="font-bold">{selectedAlbum.title}</span>
                                </span>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {photos.map((photo) => (
                                    <div 
                                        key={photo.id}
                                        className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5"
                                    >
                                        {activeTab === 'picker' ? (
                                            <ProxyImage
                                                baseUrl={photo.baseUrl}
                                                googleToken={googleToken}
                                                filename={photo.filename}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <Image
                                                src={getProxyPreviewUrl(photo.baseUrl)}
                                                alt={photo.filename}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`
                    flex justify-between items-center p-6 border-t
                    ${isDarkMode ? 'border-white/5 bg-white/[0.01]' : 'border-zinc-100 bg-zinc-50/50'}
                `}>
                    {!syncing && googleToken && (
                        <button
                            onClick={() => {
                                setGoogleToken(null);
                                setSelectedAlbum(null);
                            }}
                            className="text-xs text-zinc-500 hover:text-red-500 font-semibold transition-colors"
                        >
                            Disconnect Google Account
                        </button>
                    )}
                    <div />

                    {!syncing && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => !syncing && onClose()}
                                className="py-2.5 px-5 rounded-xl font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 transition-all dark:text-gray-300 dark:bg-white/5 dark:hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            
                            {selectedAlbum && (
                                <button
                                    onClick={handleSyncAlbum}
                                    className="py-2.5 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all flex items-center gap-2"
                                >
                                    <Cloud className="w-4 h-4" />
                                    Sync {photos.length} Photos
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
