'use client';

import { useState } from 'react';
import { useQuery } from 'react-query';
import { photoApi } from '../../../lib/api';
import { Download, Eye, Calendar, Users, Image as ImageIcon, Grid, List } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PhotoGalleryProps {
  eventId?: string;
}

export default function PhotoGallery({ eventId }: PhotoGalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const { data, isLoading } = useQuery(
    ['myPhotos', eventId],
    () => photoApi.getMyPhotos({ eventId, page: 1, limit: 100 }),
    { enabled: true }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Handle both flat array and grouped by event formats
  let photos: any[] = [];
  if (data?.data?.photos) {
    // Check if photos are grouped by event
    if (Array.isArray(data.data.photos) && data.data.photos.length > 0) {
      const firstItem = data.data.photos[0];
      // If first item has 'photos' property, it's grouped by event
      if (firstItem.photos && Array.isArray(firstItem.photos)) {
        // Flatten grouped photos
        photos = data.data.photos.flatMap((group: any) => group.photos || []);
      } else {
        // It's a flat array
        photos = data.data.photos;
      }
    }
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
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{selectedPhoto.fileName}</h3>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {selectedPhoto.url && (
                <div className="mb-4">
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.fileName}
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Event</p>
                  <p className="font-semibold">{selectedPhoto.eventId?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Uploaded</p>
                  <p className="font-semibold">
                    {selectedPhoto.createdAt
                      ? format(new Date(selectedPhoto.createdAt), 'MMM dd, yyyy')
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="font-semibold">{selectedPhoto.viewCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Downloads</p>
                  <p className="font-semibold">{selectedPhoto.downloadCount || 0}</p>
                </div>
              </div>

              {/* People in photo */}
              {selectedPhoto.faceMatches && selectedPhoto.faceMatches.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">People in this photo:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.faceMatches.map((match: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"
                      >
                        {match.userId?.avatar ? (
                          <img
                            src={match.userId.avatar}
                            alt={match.userId.name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                            {match.userId?.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="text-sm font-medium">
                          {match.userId?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(match.confidence)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedPhoto)}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
                >
                  <Download className="h-5 w-5" />
                  Download Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

