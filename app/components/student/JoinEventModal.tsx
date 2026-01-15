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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">Join Event</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Successfully Joined!</h3>
                            <p className="text-gray-600">You are now enrolled in the event.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-gray-600 text-sm">
                                Enter the 6-character access code provided by the event organizer.
                            </p>

                            <div>
                                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-1">
                                    Access Code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="accessCode"
                                        type="text"
                                        maxLength={6}
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                        placeholder="E.G. A1B2C3"
                                        className="block w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:ring-green-500 focus:border-green-500 transition-all font-mono text-lg tracking-widest uppercase text-gray-900 bg-white placeholder-gray-400"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 text-sm">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || accessCode.length < 6}
                                className={`w-full py-3 px-4 rounded-xl font-bold text-white transition-all shadow-lg ${loading || accessCode.length < 6
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 active:scale-95 shadow-green-200'
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
