'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import RoleGuard from '@/app/components/RoleGuard';
import UploadZone from '@/app/components/ui/UploadZone';
import api from '@/app/api/axios';

import { useAuth } from '@/contexts/AuthContext';

export default function EventUploadPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const eventId = params?.id as string;

    const [eventData, setEventData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

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
        setProgress(0);
        const formData = new FormData();
        formData.append('eventId', eventId);
        files.forEach(file => {
            formData.append('photos', file);
        });

        try {
            await api.post('/photos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                    }
                },
            });

            toast.success('Photos uploaded successfully!');
            // Redirect to event details or organizer dashboard
            setTimeout(() => {
                router.push('/organizer/events');
            }, 1500);

        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload photos');
            setUploading(false);
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
                <AlertTriangle size={48} className="text-yellow-500 mb-4" />
                <h2 className="text-2xl font-bold">Event Not Found</h2>
                <Link href="/organizer" className="mt-4 btn btn-primary">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={['organizer', 'admin']}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/organizer/events" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Upload Photos</h1>
                        <p className="text-gray-500">
                            Adding photos to <span className="font-semibold text-gray-900">{eventData.name}</span>
                        </p>
                    </div>
                </div>

                <div className="card space-y-8">
                    {!uploading ? (
                        <>
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <h3 className="flex items-center gap-2 font-medium text-blue-900 mb-2">
                                    <Upload size={18} />
                                    Upload Guidelines
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                    <li>Supported formats: JPG, PNG, WEBP</li>
                                    <li>Max file size: 10MB per photo</li>
                                    <li>Faces will be automatically indexed and matched to students</li>
                                </ul>
                            </div>

                            <UploadZone
                                onFilesSelected={setFiles}
                                maxFiles={50}
                            />

                            <div className="flex justify-end pt-4 border-t">
                                <button
                                    onClick={handleUpload}
                                    disabled={files.length === 0}
                                    className={`
                    btn flex items-center gap-2 px-8
                    ${files.length > 0 ? 'btn-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                  `}
                                >
                                    <Upload size={18} />
                                    Upload {files.length > 0 ? `${files.length} Photos` : ''}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="py-16 flex flex-col items-center justify-center text-center">
                            {progress < 100 ? (
                                <>
                                    <div className="w-24 h-24 mb-6 relative">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="40"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                className="text-gray-200"
                                            />
                                            <circle
                                                cx="48"
                                                cy="48"
                                                r="40"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                fill="transparent"
                                                strokeDasharray={251.2}
                                                strokeDashoffset={251.2 - (251.2 * progress) / 100}
                                                className="text-primary-600 transition-all duration-300"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-primary-600">
                                            {progress}%
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Uploading Photos...</h3>
                                    <p className="text-gray-500">Please do not close this window</p>
                                </>
                            ) : (
                                <div className="animate-scale-in">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                        <CheckCircle size={40} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Complete!</h3>
                                    <p className="text-gray-500">Redirecting to dashboard...</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </RoleGuard>
    );
}
