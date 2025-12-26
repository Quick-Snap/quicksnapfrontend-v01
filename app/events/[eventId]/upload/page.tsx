'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'react-query';
import { eventApi } from '@/lib/api';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import ImageUploader from '@/app/components/upload/ImageUploader';
import { useAuth } from '@/contexts/AuthContext';

export default function EventUploadPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const eventId = params.eventId as string;
    const [uploadComplete, setUploadComplete] = useState(false);
    const [uploadedCount, setUploadedCount] = useState(0);

    const { data: eventData, isLoading } = useQuery(
        ['event', eventId],
        () => eventApi.getById(eventId),
        {
            enabled: !!eventId
        }
    );

    const event = eventData?.data;

    const handleUploadComplete = (photos: any[]) => {
        setUploadedCount(photos.length);
        setUploadComplete(true);

        // Auto-redirect after 3 seconds
        setTimeout(() => {
            router.push(`/events/${eventId}/manage`);
        }, 3000);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
                <p className="text-gray-600 mb-6">The event you're looking for doesn't exist.</p>
                <Link href="/events">
                    <Button>Back to Events</Button>
                </Link>
            </div>
        );
    }

    // Check if user is the organizer
    const isOrganizer = event.organizer?._id === user?.id || event.organizer === user?.id;

    if (!isOrganizer && user?.role !== 'admin') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-6">Only the event organizer can upload photos.</p>
                <Link href={`/events/${eventId}`}>
                    <Button>Back to Event</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/events/${eventId}/manage`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Event Management
                    </Link>

                    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Upload Event Photos
                                </h1>
                                <p className="text-lg text-gray-600 mb-1">{event.name}</p>
                                <p className="text-sm text-gray-500">
                                    {new Date(event.startDate).toLocaleDateString()} • {event.venue}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
                                <Upload className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-900">Organizer Upload</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {uploadComplete && (
                    <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-green-900 mb-2">
                                    Upload Successful!
                                </h3>
                                <p className="text-green-800 mb-3">
                                    {uploadedCount} {uploadedCount === 1 ? 'photo' : 'photos'} uploaded successfully to AWS S3.
                                </p>
                                <div className="bg-white rounded-lg p-4 border border-green-200">
                                    <p className="text-sm text-gray-700 mb-2 font-medium">
                                        🚀 Automatic Processing Started
                                    </p>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>✓ Photos uploaded to AWS S3</li>
                                        <li>⏳ Lambda function processing images...</li>
                                        <li>⏳ AWS Rekognition detecting faces...</li>
                                        <li>⏳ Matching faces with registered users...</li>
                                        <li>⏳ Creating user photo collections...</li>
                                    </ul>
                                    <p className="text-sm text-gray-700 mt-3">
                                        <strong>Processing time:</strong> 1-5 minutes depending on photo count
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Users will automatically see photos they appear in once processing completes.
                                    </p>
                                </div>
                                <p className="text-sm text-green-700 mt-3">
                                    Redirecting to event management...
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Upload Instructions */}
                {!uploadComplete && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-3">
                            📸 How Photo Upload Works
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6 text-sm text-blue-800">
                            <div>
                                <h4 className="font-semibold mb-2">1. Upload Photos</h4>
                                <p>Drag and drop or select event photos. All formats supported (JPG, PNG, WEBP).</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">2. Automatic Processing</h4>
                                <p>Photos are sent to AWS S3 and processed by Lambda functions automatically.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">3. Face Recognition</h4>
                                <p>AWS Rekognition detects faces and matches them with registered users.</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">4. User Delivery</h4>
                                <p>Each user automatically receives photos they appear in within minutes.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Uploader Component */}
                {!uploadComplete && (
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <ImageUploader
                            eventId={eventId}
                            onUploadComplete={handleUploadComplete}
                            maxFiles={100}
                        />
                    </div>
                )}

                {/* Info Cards */}
                <div className="mt-8 grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Upload className="h-5 w-5 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Bulk Upload</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            Upload up to 100 photos at once. Perfect for large events with hundreds of attendees.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Auto Moderation</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            AI automatically checks content safety. Inappropriate images are flagged for review.
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900">Privacy First</h4>
                        </div>
                        <p className="text-sm text-gray-600">
                            Only users who appear in photos can see them. Face data is encrypted and secure.
                        </p>
                    </div>
                </div>

                {/* Technical Details */}
                <div className="mt-8 bg-gray-100 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        🔧 Technical Details
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                        <div>
                            <strong>Storage:</strong> AWS S3 (3 buckets: RAW, PROCESSED, PUBLIC)
                        </div>
                        <div>
                            <strong>Processing:</strong> AWS Lambda (serverless, auto-scaling)
                        </div>
                        <div>
                            <strong>Face Recognition:</strong> AWS Rekognition (99.9% accuracy)
                        </div>
                        <div>
                            <strong>Database:</strong> MongoDB (photo metadata & user mapping)
                        </div>
                        <div>
                            <strong>Content Moderation:</strong> AWS Rekognition DetectModerationLabels
                        </div>
                        <div>
                            <strong>Processing Time:</strong> 1-5 minutes per batch
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
