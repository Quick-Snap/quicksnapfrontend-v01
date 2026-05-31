'use client';

import React, { useState, useEffect } from 'react';
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

// Curated high-resolution Unsplash event photos with clear, detectable faces for Demo Mode
const DEMO_ALBUMS = [
    {
        id: 'demo-wedding',
        title: '🎉 Wedding Ceremony (High-Res)',
        mediaItemsCount: 3,
        coverPhotoBaseUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        photos: [
            { id: 'w1', filename: 'wedding_couple.jpg', baseUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552' },
            { id: 'w2', filename: 'wedding_bride.jpg', baseUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc' },
            { id: 'w3', filename: 'wedding_guest.jpg', baseUrl: 'https://images.unsplash.com/photo-1505232458627-539c1a281a14' }
        ]
    },
    {
        id: 'demo-birthday',
        title: '🎂 Golden Birthday Bash',
        mediaItemsCount: 3,
        coverPhotoBaseUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d',
        photos: [
            { id: 'b1', filename: 'birthday_group.jpg', baseUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176' },
            { id: 'b2', filename: 'birthday_celebration.jpg', baseUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d' },
            { id: 'b3', filename: 'birthday_dance.jpg', baseUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7' }
        ]
    },
    {
        id: 'demo-corporate',
        title: '🏢 Corporate Gala Night',
        mediaItemsCount: 2,
        coverPhotoBaseUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865',
        photos: [
            { id: 'c1', filename: 'corporate_networking.jpg', baseUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865' },
            { id: 'c2', filename: 'corporate_presentation.jpg', baseUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87' }
        ]
    }
];

interface GooglePhotosModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
}

export default function GooglePhotosModal({ isOpen, onClose, eventId }: GooglePhotosModalProps) {
    const theme = useAppStore(state => state.ui.theme);
    const isDarkMode = theme === 'dark';

    const [isDemoMode, setIsDemoMode] = useState(false);
    const [googleToken, setGoogleToken] = useState<string | null>(null);
    const [albums, setAlbums] = useState<any[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<any | null>(null);
    const [photos, setPhotos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Ingestion state
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });

    // Try reading credentials in client window
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setSelectedAlbum(null);
            setPhotos([]);
            setSyncing(false);
            setLoading(false);
        }
    }, [isOpen]);

    // Handle initial Authentication or fallback to Demo Mode
    const handleConnectGoogle = async () => {
        if (!clientId) {
            toast.success('No Google Client ID set — enabling full-featured Demo Mode!');
            startDemoMode();
            return;
        }

        setLoading(true);
        try {
            // Dynamically check and initialize Google Token Client
            const google = (window as any).google;
            if (!google || !google.accounts || !google.accounts.oauth2) {
                // Try dynamically injecting script if missing
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.onload = () => initTokenClient();
                document.body.appendChild(script);
            } else {
                initTokenClient();
            }
        } catch (err: any) {
            console.error('Google auth error:', err);
            toast.error('Failed to initialize Google Authentication. Entering Demo Mode.');
            startDemoMode();
        }
    };

    const initTokenClient = () => {
        try {
            const google = (window as any).google;
            const client = google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
                callback: (tokenResponse: any) => {
                    setLoading(false);
                    if (tokenResponse.access_token) {
                        setGoogleToken(tokenResponse.access_token);
                        setIsDemoMode(false);
                        fetchAlbums(tokenResponse.access_token);
                    } else {
                        toast.error('Google authorization declined.');
                    }
                },
                error_callback: (err: any) => {
                    setLoading(false);
                    console.error('GSI client error:', err);
                    toast.error('Failed to get permissions. Entering Demo Mode.');
                    startDemoMode();
                }
            });
            client.requestAccessToken();
        } catch (err) {
            setLoading(false);
            startDemoMode();
        }
    };

    const startDemoMode = () => {
        setIsDemoMode(true);
        setGoogleToken(null);
        setAlbums(DEMO_ALBUMS);
        setLoading(false);
    };

    const fetchAlbums = async (token: string) => {
        setLoading(true);
        try {
            const res = await api.get('/photos/google-photos/albums', {
                headers: { 'x-google-access-token': token }
            });
            if (res.data?.success) {
                setAlbums(res.data.data || []);
            } else {
                toast.error('Failed to load Google Albums. Reverting to Demo Mode.');
                startDemoMode();
            }
        } catch (err: any) {
            // Safe error handling (Axios translations handled in Phase 2 backend)
            console.error('Error fetching albums:', err);
            if (err.response?.data?.code === 'GOOGLE_AUTH_EXPIRED') {
                toast.error('Google login expired. Please sign in again.');
                setGoogleToken(null);
            } else {
                toast.error('Failed to load live Google albums. Reverting to Demo Mode.');
                startDemoMode();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAlbum = async (album: any) => {
        setSelectedAlbum(album);
        setLoading(true);

        if (isDemoMode) {
            // Pre-seed demo photos immediately
            setPhotos(album.photos || []);
            setLoading(false);
            return;
        }

        try {
            const res = await api.get(`/photos/google-photos/albums/${album.id}/photos`, {
                headers: { 'x-google-access-token': googleToken! }
            });
            if (res.data?.success) {
                setPhotos(res.data.data.photos || []);
            } else {
                toast.error('Failed to fetch album photos.');
            }
        } catch (err: any) {
            console.error('Error fetching album photos:', err);
            toast.error('Failed to fetch photos from Google. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Execute batch photo ingestion sequentially or with small parallel chunks
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

        // Loop through all photos in the album to trigger ingestion
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            
            // Set current photo name in state
            setSyncProgress(prev => ({ ...prev, current: i + 1 }));

            try {
                // Ingest Google Photo URL on backend
                const res = await api.post('/photos/google-photos/import-file', {
                    eventId,
                    baseUrl: photo.baseUrl,
                    filename: photo.filename
                });

                if (res.data?.success) {
                    setSyncProgress(prev => ({ ...prev, success: prev.success + 1 }));
                } else {
                    setSyncProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
                }
            } catch (err) {
                console.error(`Import failed for ${photo.filename}:`, err);
                setSyncProgress(prev => ({ ...prev, failed: prev.failed + 1 }));
            }
        }

        // Notify parent context to refresh matches index
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(`qs_event_photos_dirty_${eventId}`, '1');
        }

        toast.success(`Google Photos Sync completed!`);
        setSyncing(false);
        
        // Wait and close
        setTimeout(() => {
            onClose();
        }, 1500);
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
                                {isDemoMode && (
                                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                        Demo Mode
                                    </span>
                                )}
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
                    ) : loading ? (
                        /* Loading state */
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                            <p className="text-sm text-zinc-500 dark:text-gray-400">Loading albums & photos...</p>
                        </div>
                    ) : !googleToken && albums.length === 0 ? (
                        /* Initial Connect state */
                        <div className="flex flex-col items-center justify-center py-12 text-center max-w-md mx-auto space-y-6">
                            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center">
                                <Cloud className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-1">Connect Google Photos</h3>
                                <p className="text-sm text-zinc-500 dark:text-gray-400">
                                    Link your Google account to fetch owned and shared event albums directly.
                                </p>
                            </div>

                            <div className="w-full flex flex-col gap-3">
                                <button
                                    onClick={handleConnectGoogle}
                                    className="w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 transition-all flex items-center justify-center gap-2.5"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    Sign in with Google
                                </button>

                                <button
                                    onClick={startDemoMode}
                                    className="w-full py-3 px-6 rounded-xl font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 transition-all dark:text-gray-300 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center gap-2 border border-zinc-200 dark:border-white/5"
                                >
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    Try Local Test Album (Demo Mode)
                                </button>
                            </div>
                        </div>
                    ) : !selectedAlbum ? (
                        /* Albums List view */
                        <div className="space-y-6">
                            <h3 className="text-md font-semibold px-1">Select Google Photos Album</h3>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {albums.map((album) => (
                                    <div
                                        key={album.id}
                                        onClick={() => handleSelectAlbum(album)}
                                        className={`
                                            group flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:-translate-y-0.5 transition-all duration-300
                                            ${isDarkMode 
                                                ? 'bg-white/[0.02] border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04]' 
                                                : 'bg-zinc-50/50 border-zinc-200 hover:border-violet-500/30 hover:bg-white'
                                            }
                                        `}
                                    >
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-white/5">
                                            {album.coverPhotoBaseUrl ? (
                                                <Image
                                                    src={`${album.coverPhotoBaseUrl}=w150`}
                                                    alt={album.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Folder className="text-zinc-400" size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-semibold text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                {album.title}
                                            </h4>
                                            <p className="text-xs text-zinc-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                                                <ImageIcon size={12} />
                                                {album.mediaItemsCount} Photos
                                            </p>
                                        </div>
                                        <ChevronRight size={16} className="text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                ))}
                            </div>
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
                                        <Image
                                            src={`${photo.baseUrl}=w150`}
                                            alt={photo.filename}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
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
                                setAlbums([]);
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
