'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Mail, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import RoleGuard from '@/app/components/RoleGuard';
import api from '@/app/api/axios';

export default function AssignPhotographerPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [eventData, setEventData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
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

        if (eventId) {
            fetchEvent();
        }
    }, [eventId]);

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        setAssigning(true);

        try {
            const response = await api.post(`/events/${eventId}/photographers`, {
                email: email.trim()
            });

            if (response.data.success) {
                toast.success('Photographer assigned successfully!');
                setEmail('');
                // Refresh event data to show updated photographers list
                const res = await api.get(`/events/${eventId}`);
                setEventData(res.data.data);
            }
        } catch (error: any) {
            console.error('Assign photographer error:', error);
            toast.error(error.response?.data?.message || 'Failed to assign photographer');
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="spinner w-8 h-8 border-4 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    if (!eventData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <AlertCircle size={48} className="text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold">Event Not Found</h2>
                <Link href="/organizer/events" className="mt-4 btn btn-primary">
                    Back to Events
                </Link>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/organizer/events" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Assign Photographers</h1>
                        <p className="text-gray-500">
                            Managing photographers for <span className="font-semibold text-gray-900">{eventData.name}</span>
                        </p>
                    </div>
                </div>

                {/* Assign Form */}
                <div className="card">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                        <h3 className="flex items-center gap-2 font-medium text-blue-900 mb-2">
                            <UserPlus size={18} />
                            How It Works
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>Enter the email address of the user you want to assign as photographer</li>
                            <li>The user's role will be automatically upgraded to "photographer"</li>
                            <li>Photographers can upload photos to this event</li>
                        </ul>
                    </div>

                    <form onSubmit={handleAssign} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                User Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    placeholder="photographer@example.com"
                                    className="input pl-10"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                The user must already be registered in the system
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={assigning || !email.trim()}
                            className={`
                btn w-full flex items-center justify-center gap-2
                ${!assigning && email.trim() ? 'btn-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
                        >
                            {assigning ? (
                                <>
                                    <span className="spinner w-4 h-4 border-2 border-white border-t-transparent" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Assign as Photographer
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Current Photographers List */}
                <div className="card">
                    <h3 className="font-bold text-lg mb-4">Current Photographers</h3>
                    {eventData.photographers && eventData.photographers.length > 0 ? (
                        <div className="space-y-3">
                            {eventData.photographers.map((photographer: any) => (
                                <div
                                    key={photographer._id || photographer.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                                            {photographer.name?.charAt(0).toUpperCase() || 'P'}
                                        </div>
                                        <div>
                                            <p className="font-medium">{photographer.name || 'Photographer'}</p>
                                            <p className="text-sm text-gray-500">{photographer.email || 'No email'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                            Photographer
                                        </span>
                                        <button
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to remove this photographer?')) {
                                                    try {
                                                        await api.delete(`/events/${eventId}/photographers/${photographer._id || photographer.id}`);
                                                        toast.success('Photographer removed');
                                                        // Refresh list
                                                        const res = await api.get(`/events/${eventId}`);
                                                        setEventData(res.data.data);
                                                    } catch (error) {
                                                        toast.error('Failed to remove photographer');
                                                    }
                                                }
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                            title="Remove Photographer"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <UserPlus size={48} className="mx-auto mb-3 text-gray-300" />
                            <p>No photographers assigned yet</p>
                            <p className="text-sm mt-1">Use the form above to assign photographers to this event</p>
                        </div>
                    )}
                </div>
            </div>
        </RoleGuard>
    );
}
