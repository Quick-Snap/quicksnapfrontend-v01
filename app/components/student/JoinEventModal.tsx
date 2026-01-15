'use client';

import { useState } from 'react';
import { eventApi } from '@/lib/api';
import { X, Hash, AlertCircle, CheckCircle2 } from 'lucide-react';
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
    const queryClient = useQueryClient();
    const loadUser = useAuthStore((state) => state.loadUser);

    if (!isOpen) return null;

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
                await loadUser();
                
                // Refresh all relevant queries
                queryClient.invalidateQueries('userStats');
                queryClient.invalidateQueries('upcomingEvents');
                queryClient.invalidateQueries('myPhotos');

                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setAccessCode('');
                }, 2000);
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
                    <h2 className="text-xl font-semibold text-white">Join Event</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-emerald-500/15 border border-emerald-400/30 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">Successfully Joined!</h3>
                            <p className="text-gray-400">You are now enrolled in the event.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-gray-400 text-sm">
                                Enter the 6-character access code provided by the event organizer.
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
                                        maxLength={6}
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                        placeholder="E.G. A1B2C3"
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
                                disabled={loading || accessCode.length < 6}
                                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all shadow-lg ${
                                    loading || accessCode.length < 6
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
