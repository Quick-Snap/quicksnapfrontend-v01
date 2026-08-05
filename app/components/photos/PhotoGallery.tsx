'use client';

import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { photoApi } from '../../../lib/api';
import { fetchAllMyPhotos } from '@/lib/photoFetch';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Eye, Calendar, Users, Image as ImageIcon, Grid, List } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PhotoLightbox } from '@/app/components/photos/PhotoLightbox';

interface PhotoGalleryProps {
  eventId?: string;
}

export default function PhotoGallery({ eventId }: PhotoGalleryProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const { data, isLoading } = useQuery(
    ['myPhotos', eventId],
    () => fetchAllMyPhotos(eventId ? { eventId } : undefined),
    { enabled: !!user }
  );

  const handleDownload = async (photo: any) => {
    try {
      const response = await photoApi.downloadPhoto(photo._id);
      if (response.success && response.data?.url) {
        // Fetch the image as a blob to trigger a direct download
        const imageResponse = await fetch(response.data.url);
        const blob = await imageResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.data.fileName || 'photo.jpg');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Download started!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to download photo');
    }
  };

  // Handle both flat array and grouped by event formats
  const rawPhotos = useMemo(() => {
    let list: any[] = [];
    if (data?.data?.photos) {
      if (Array.isArray(data.data.photos) && data.data.photos.length > 0) {
        const firstItem = data.data.photos[0];
        if (firstItem.photos && Array.isArray(firstItem.photos)) {
          list = data.data.photos.flatMap((group: any) => group.photos || []);
        } else {
          list = data.data.photos;
        }
      }
    }
    return list;
  }, [data]);

  const photos = useMemo(() => {
    const userJoinedEvents = user?.events || [];
    return rawPhotos.filter((photo: any) => {
      const photoEventId = photo.eventId?._id || photo.eventId;
      return photoEventId && userJoinedEvents.includes(photoEventId);
    });
  }, [rawPhotos, user?.events]);

  const currentIndex = useMemo(() => {
    if (!selectedPhoto) return -1;
    return photos.findIndex((p: any) => p._id === selectedPhoto._id);
  }, [selectedPhoto, photos]);

  const lightboxItems = useMemo(
    () =>
      photos.map((p: any) => ({
        image: p.url || '',
        caption: p.fileName || 'Photo',
      })),
    [photos]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">No photos found</p>
        <p className="text-sm text-gray-500">
          Photos you appear in will automatically appear here
        </p>
      </div>
    );
  }

  // Group photos by event
  const photosByEvent: { [key: string]: any } = {};
  photos.forEach((photo: any) => {
    const eventId = photo.eventId?._id || photo.eventId || 'unknown';
    const eventName = photo.eventId?.name || 'Unknown Event';
    if (!photosByEvent[eventId]) {
      photosByEvent[eventId] = {
        event: photo.eventId,
        eventName,
        photos: []
      };
    }
    photosByEvent[eventId].photos.push(photo);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Photos</h2>
          <p className="text-gray-600">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Photos grouped by event */}
      <div className="space-y-8">
        {Object.values(photosByEvent).map((group: any) => (
          <div key={group.event?._id || 'unknown'} className="space-y-4">
            {/* Event Header */}
            <div className="flex items-center gap-3 pb-2 border-b">
              <Calendar className="h-5 w-5 text-primary-600" />
              <div>
                <h3 className="text-lg font-semibold">{group.eventName}</h3>
                {group.event?.startDate && (
                  <p className="text-sm text-gray-600">
                    {format(new Date(group.event.startDate), 'MMMM dd, yyyy')}
                  </p>
                )}
              </div>
              <span className="ml-auto text-sm text-gray-600">
                {group.photos.length} photo{group.photos.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Photos Grid */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {group.photos.map((photo: any) => (
                  <div
                    key={photo._id}
                    className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPhoto(photo);
                          }}
                          className="bg-white rounded-full p-2 hover:bg-gray-100"
                        >
                          <Eye className="h-5 w-5 text-gray-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(photo);
                          }}
                          className="bg-white rounded-full p-2 hover:bg-gray-100"
                        >
                          <Download className="h-5 w-5 text-gray-700" />
                        </button>
                      </div>
                    </div>

                    {/* Confidence badge */}
                    {photo.userConfidence && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {Math.round(photo.userConfidence)}% match
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {group.photos.map((photo: any) => (
                  <div
                    key={photo._id}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex items-center gap-4"
                  >
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={photo.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{photo.fileName}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {photo.viewCount || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="h-4 w-4" />
                          {photo.downloadCount || 0} downloads
                        </span>
                        {photo.userConfidence && (
                          <span className="text-green-600">
                            {Math.round(photo.userConfidence)}% match
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPhoto(photo)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(photo)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && currentIndex >= 0 && (
        <PhotoLightbox
          items={lightboxItems}
          startIndex={currentIndex}
          onIndexChange={(i) => setSelectedPhoto(photos[i])}
          onClose={() => setSelectedPhoto(null)}
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <h3 className="truncate text-base font-semibold text-white sm:text-lg">
                  {selectedPhoto.fileName}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                  <span>{selectedPhoto.eventId?.name || 'Unknown event'}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                    {selectedPhoto.createdAt
                      ? format(new Date(selectedPhoto.createdAt), 'MMM dd, yyyy')
                      : 'Unknown'}
                  </span>
                  <span>{selectedPhoto.viewCount || 0} views</span>
                  <span>{selectedPhoto.downloadCount || 0} downloads</span>
                </div>
                {selectedPhoto.faceMatches && selectedPhoto.faceMatches.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedPhoto.faceMatches.map((match: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs text-white"
                      >
                        {match.userId?.name || 'Unknown'}
                        <span className="text-gray-400">{Math.round(match.confidence)}%</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDownload(selectedPhoto)}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-indigo-500 sm:h-10 sm:w-auto"
              >
                <Download size={18} className="shrink-0" />
                Download Photo
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}

