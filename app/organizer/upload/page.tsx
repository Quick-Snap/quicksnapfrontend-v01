'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/app/components/ui/UploadZone';
import { photoApi, eventApi } from '@/lib/api'; // Use consistent API lib
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Event {
    _id: string;
    name: string;
}

export default function BulkUploadPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            // Updated to use eventApi which handles auth token automatically
            // Assuming eventApi.getAll returns data.data which is array of events
            // Adjust based on api implementation of getAll
            const response = await eventApi.getAll({ limit: 100 });
            if (response.success && response.data) {
                // If the user is an organizer, they should see their events.
                // If the API returns all events, we might need filtering?
                // Usually backend filters by role.
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

        try {
            await photoApi.upload(selectedEvent, files);
            toast.success('Photos uploaded successfully! Processing started.');
            setFiles([]);
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload photos');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Bulk Photo Upload</h1>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200 mb-8">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Select Event
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
    );
}
