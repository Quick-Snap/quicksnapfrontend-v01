'use client';

import { useQuery, useMutation, useQueryClient } from 'react-query';
import { photoApi } from '@/lib/api';
import { CheckCircle, XCircle, Eye, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { ImageWithFallback } from '@/app/components/ui/ImageWithFallback';

export default function PhotoModerator() {
  const queryClient = useQueryClient();
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const { data: photosData, isLoading } = useQuery('pendingPhotos', () =>
    photoApi.getMyPhotos({ page: 1, limit: 50 })
  );

  const moderateMutation = useMutation(
    ({ photoId, action, reason }: { photoId: string; action: 'approve' | 'reject'; reason?: string }) =>
      photoApi.moderatePhoto(photoId, action, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pendingPhotos');
        toast.success('Photo moderated successfully');
        setSelectedPhoto(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to moderate photo');
      },
    }
  );

  const pendingPhotos = photosData?.data?.photos?.filter(
    (p: any) => p.moderationStatus === 'pending'
  ) || [];

  const handleModerate = (photoId: string, action: 'approve' | 'reject', reason?: string) => {
    moderateMutation.mutate({ photoId, action, reason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
          Photo Moderation Queue
        </h2>
        <p className="text-gray-600 mb-6">
          {pendingPhotos.length} photo(s) pending moderation
        </p>

        {pendingPhotos.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">No photos pending moderation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPhotos.map((photo: any) => (
              <div
                key={photo._id}
                className="bg-gray-50 rounded-lg p-4 border-2 border-yellow-200"
              >
                <div className="aspect-square bg-gray-200 rounded-lg mb-3 overflow-hidden relative">
                  {photo.url ? (
                    <ImageWithFallback
                      src={photo.url}
                      alt={photo.fileName}
                      fill
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <p className="font-semibold text-sm mb-1">{photo.fileName}</p>
                  <p className="text-xs text-gray-600">
                    Uploaded: {new Date(photo.createdAt).toLocaleDateString()}
                  </p>
                  {photo.moderationLabels && photo.moderationLabels.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {photo.moderationLabels.map((label: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleModerate(photo._id, 'approve')}
                    loading={moderateMutation.isLoading && selectedPhoto === photo._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleModerate(photo._id, 'reject', 'Inappropriate content')}
                    loading={moderateMutation.isLoading && selectedPhoto === photo._id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

