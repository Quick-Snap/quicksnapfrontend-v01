'use client';

import { useState } from 'react';
import Link from 'next/link';
import { eventApi } from '@/lib/api';
import { X, Hash, AlertCircle, CheckCircle2, Camera, Sparkles, ArrowRight } from 'lucide-react';
import { useQueryClient } from 'react-query';
import { useAuthStore } from '@/stores/authStore';

interface JoinEventModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function JoinEventModal({ isOpen, onClose }: JoinEventModalProps) {
    const [accessCode, setAccessCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [joinedEvent, setJoinedEvent] = useState<{ eventId: string; name: string } | null>(null);
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);
    const loadUser = useAuthStore((state) => state.loadUser);

    if (!isOpen) return null;

    const handleClose = () => {
        onClose();
        setSuccess(false);
        setJoinedEvent(null);
        setAccessCode('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessCode.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await eventApi.joinByCode(accessCode.trim().toUpperCase());
            if (response.success) {
                setSuccess(true);
                
                // Reload user data to get updated events list
                await loadUser({ force: true });
                
                // Refresh all relevant queries
                queryClient.invalidateQueries('userStats');
                queryClient.invalidateQueries('upcomingEvents');
                queryClient.invalidateQueries('myPhotos');

                if (user?.faceRegistered) {
                    setTimeout(() => {
                        handleClose();
                    }, 2000);
                } else {
                    setJoinedEvent(response.data || null);
                }
            } else {
                setError(response.message || 'Failed to join event');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error joining event. Please check the code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f0c18] shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white">
                        {success && !user?.faceRegistered ? 'AI Photo Delivery' : 'Join Event'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        !user?.faceRegistered ? (
                            <div className="text-center py-2 space-y-4">
                                <div className="mx-auto relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-500/30">
                                    <Camera className="h-8 w-8" />
                                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-black shadow-sm ring-2 ring-[#0f0c18]">
                                        <Sparkles className="h-3.5 w-3.5 fill-current" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                                        <span>🎉</span>
                                        <span>Joined {joinedEvent?.name ? `"${joinedEvent.name}"` : 'Event'}!</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white pt-1">Find your photos automatically?</h3>
                                    <p className="text-gray-300 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                                        Take a quick 30-second selfie once. Our smart AI will scan the album and automatically gather all photos of you into your &ldquo;My photos&rdquo; tab!
                                    </p>
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Link
                                        href={`/register-face?redirect=${encodeURIComponent(joinedEvent?.eventId ? `/events/${joinedEvent.eventId}` : '/dashboard')}`}
                                        onClick={handleClose}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 px-4 font-semibold text-sm text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-500 hover:to-indigo-500 active:scale-95"
                                    >
                                        <Camera className="h-4 w-4" />
                                        Take Quick Selfie (~30s)
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    {joinedEvent?.eventId ? (
                                        <Link
                                            href={`/events/${joinedEvent.eventId}`}
                                            onClick={handleClose}
                                            className="block w-full py-2 text-center text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                            View Event Album Instead →
                                        </Link>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="w-full py-2 text-center text-xs text-gray-400 hover:text-white transition-colors"
                                        >
                                            I&apos;ll browse manually for now
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="mx-auto w-16 h-16 bg-emerald-500/15 border border-emerald-400/30 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Successfully Joined!</h3>
                                <p className="text-gray-400">You are now enrolled in the event.</p>
                            </div>
                        )
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-gray-400 text-sm">
                                Enter the event access code provided by the organizer.
                            </p>

                            <div>
                                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-200 mb-1">
                                    Access Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="accessCode"
                                        type="text"
                                        maxLength={16}
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                                        placeholder="e.g. BWAI-26 or TANVI-WEDDING"
                                        className="block w-full pl-10 pr-3 py-3 rounded-xl border border-white/10 bg-white/5 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/25 transition-all font-mono text-lg tracking-widest uppercase text-white placeholder-gray-500"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 text-red-100 text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || accessCode.trim().length < 3}
                                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                                    loading || accessCode.trim().length < 3
                                        ? 'bg-white/10 cursor-not-allowed text-gray-400'
                                        : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 shadow-violet-500/25'
                                }`}
                            >
                                {loading ? 'Joining...' : 'Join Event'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
