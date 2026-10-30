import { AxiosError } from 'axios';
import { ApiResponse, OrganizerRequest, OrganizerRequestStats, SubmitOrganizerRequestDto } from '@/types';
import api from '@/app/api/axios';

export interface DownloadJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'cancelled';
  phase: string;
  totalPhotos: number;
  processedPhotos: number;
  failedPhotos: number;
  progressPercent: number;
  zipFileName?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  elapsedMs: number;
  estimatedMsRemaining: number | null;
}

// Re-export the api instance
export { api };

// Auth API

// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
  }) => {
    const response = await api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<any>>('/auth/me');
    return response.data;
  },

  registerFace: async (image: string, s3Key?: string) => {
    const response = await api.post<ApiResponse<{ faceId: string }>>('/auth/face', {
      image,
      s3Key
    });
    return response.data;
  },

  updateProfile: async (data: FormData) => {
    const response = await api.put<ApiResponse<any>>('/auth/profile', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse<any>>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post<ApiResponse<any>>(`/auth/reset-password/${token}`, { password });
    return response.data;
  },
};

// Types for presigned URL upload
interface UploadUrlRequest {
  fileName: string;
  fileType: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  key: string;
  fileName: string;
  imageId?: string;
}

interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
}

// Photo API
export const photoApi = {
  // Get presigned URLs for direct S3 upload
  getUploadUrls: async (eventId: string, files: UploadUrlRequest[], subEventId?: string) => {
    const response = await api.post<ApiResponse<{ urls: UploadUrlResponse[] }>>(
      '/photos/get-upload-urls',
      {
        eventId,
        subEventId,
        files,
      }
    );
    return response.data;
  },

  // Upload a single file directly to S3 using presigned URL
  uploadToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void,
    imageId?: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            fileName: file.name,
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded * 100) / event.total),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during S3 upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', uploadUrl);
      const mimeType = file.type || 'application/octet-stream';
      xhr.setRequestHeader('Content-Type', mimeType);
      xhr.send(file);
    });
  },

  // Upload multiple files using presigned URLs with parallel processing
  uploadWithPresignedUrls: async (
    eventId: string,
    files: File[],
    onFileProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onFileComplete?: (fileIndex: number, key: string) => void,
    onFileError?: (fileIndex: number, error: string) => void,
    concurrency: number = 5,
    subEventId?: string
  ) => {
    // Step 1: Get presigned URLs for all files
    const fileRequests: UploadUrlRequest[] = files.map((file) => ({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
    }));

    const urlResponse = await photoApi.getUploadUrls(eventId, fileRequests, subEventId);
    if (!urlResponse.data?.urls) {
      throw new Error('Failed to get upload URLs from server');
    }
    const urls = urlResponse.data.urls;

    // Step 2: Upload files in parallel with concurrency limit
    const results: { success: boolean; key?: string; error?: string }[] = [];
    let currentIndex = 0;

    const uploadFile = async (index: number): Promise<void> => {
      const file = files[index];
      const urlData = urls[index];

      try {
        await photoApi.uploadToS3(urlData.uploadUrl, file, (progress) => {
          onFileProgress?.(index, progress);
        }, urlData.imageId);

        results[index] = { success: true, key: urlData.key };
        onFileComplete?.(index, urlData.key);
      } catch (error: any) {
        const errorMessage = error.message || 'Upload failed';
        results[index] = { success: false, error: errorMessage };
        onFileError?.(index, errorMessage);
      }
    };

    // Worker pool for concurrent uploads
    const workers = Array(Math.min(concurrency, files.length))
      .fill(null)
      .map(async () => {
        while (currentIndex < files.length) {
          const index = currentIndex++;
          await uploadFile(index);
        }
      });

    await Promise.all(workers);

    return {
      results,
      successCount: results.filter((r) => r.success).length,
      errorCount: results.filter((r) => !r.success).length,
      uploadedKeys: results.filter((r) => r.success).map((r) => r.key!),
    };
  },

  // Legacy upload function (fallback for single small files)
  upload: async (eventId: string, files: File[]) => {
    const formData = new FormData();
    formData.append('eventId', eventId);
    files.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await api.post<ApiResponse<{ photos: any[]; count: number }>>(
      '/photos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  getMyPhotos: async (params?: {
    page?: number;
    limit?: number;
    eventId?: string;
    all?: boolean;
    lastKey?: string;
  }) => {
    const data: Record<string, any> = {};
    if (params?.page != null) data.page = params.page;
    if (params?.limit != null) data.limit = params.limit;
    if (params?.eventId) data.eventId = params.eventId;
    if (params?.all === true) data.all = true;
    if (params?.lastKey != null) {
      try {
        data.lastKey = typeof params.lastKey === 'string' ? JSON.parse(params.lastKey) : params.lastKey;
      } catch {
        data.lastKey = params.lastKey;
      }
    }
    const response = await api.post<ApiResponse<any>>('/photos/my-photos', data);
    return response.data;
  },

  getPublicPhotos: async (eventId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<any>>(`/photos/event/${eventId}/public`, { params });
    return response.data;
  },

  getPhotoDetails: async (photoId: string) => {
    const response = await api.get<ApiResponse<any>>(`/photos/${photoId}`);
    return response.data;
  },

  downloadPhoto: async (photoId: string) => {
    const response = await api.get<ApiResponse<{ url: string; fileName: string }>>(
      `/photos/${photoId}/download`
    );
    return response.data;
  },

  untag: async (photoId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/photos/${photoId}/untag`);
    return response.data;
  },

  createDownloadJob: async () => {
    const response = await api.post<ApiResponse<DownloadJobStatus>>(
      '/photos/my-photos/download/jobs'
    );
    return response.data;
  },

  getDownloadJob: async (jobId: string) => {
    const response = await api.get<ApiResponse<DownloadJobStatus>>(
      `/photos/my-photos/download/jobs/${jobId}`
    );
    return response.data;
  },

  cancelDownloadJob: async (jobId: string) => {
    const response = await api.delete<ApiResponse<DownloadJobStatus>>(
      `/photos/my-photos/download/jobs/${jobId}`
    );
    return response.data;
  },

  /** Stream ZIP from API when job status is ready (no S3 presigned URL). */
  downloadJobFile: async (jobId: string) => {
    try {
      const response = await api.get(`/photos/my-photos/download/jobs/${jobId}/download`, {
        responseType: 'blob',
      });
      const blob = response.data as Blob;
      if (blob.type?.includes('application/json')) {
        const text = await blob.text();
        let message = 'Failed to download ZIP';
        try {
          const err = JSON.parse(text) as { message?: string };
          message = err.message || message;
        } catch {
          if (text) message = text.slice(0, 300);
        }
        throw new Error(message);
      }
      return blob;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data instanceof Blob) {
        try {
          const text = await (error.response.data as Blob).text();
          const err = JSON.parse(text) as { message?: string };
          throw new Error(err.message || 'Failed to download ZIP');
        } catch {
          throw new Error('Failed to download ZIP');
        }
      }
      throw error;
    }
  },

  deletePhoto: async (photoId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/photos/${photoId}`);
    return response.data;
  },

  uploadEventPhoto: async (formData: FormData, onUploadProgress?: (progressEvent: any) => void) => {
    const response = await api.post<ApiResponse<{ photo: any }>>(
      '/photos/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      }
    );
    return response.data;
  },

  moderatePhoto: async (photoId: string, action: 'approve' | 'reject', reason?: string) => {
    const response = await api.patch<ApiResponse<any>>(`/photos/${photoId}/moderate`, {
      action,
      reason,
    });
    return response.data;
  },

  getCoOccurring: async () => {
    const response = await api.get<ApiResponse<any>>('/photos/co-occurring');
    return response.data;
  },

  reportPhoto: async (photoId: string) => {
    const response = await api.post<ApiResponse<{ reportCount: number; flagged: boolean }>>(
      `/photos/${photoId}/report`
    );
    return response.data;
  },

  toggleSelection: async (photoId: string, data: { type: 'album' | 'original'; status: boolean }) => {
    const response = await api.post<ApiResponse<{ imageId: string; type: string; status: boolean; isAlbumFavorite?: boolean; isOriginalRequested?: boolean }>>(
      `/photos/${photoId}/selection`,
      data
    );
    return response.data;
  },
};

// Event API
export const eventApi = {
  create: async (data: Partial<any>) => {
    const response = await api.post<ApiResponse<any>>('/events', data);
    return response.data;
  },

  getAll: async (params?: { isActive?: boolean; page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<any>>('/events', { params });
    return response.data;
  },

  getById: async (eventId: string, options?: { lite?: boolean; proofToken?: string }) => {
    const params: Record<string, string> = {};
    if (options?.lite) params.lite = 'true';
    if (options?.proofToken) params.proofToken = options.proofToken;
    const response = await api.get<ApiResponse<any>>(`/events/${eventId}`, {
      params: Object.keys(params).length ? params : undefined,
    });
    return response.data;
  },

  update: async (eventId: string, data: Partial<any>) => {
    const response = await api.put<ApiResponse<any>>(`/events/${eventId}`, data);
    return response.data;
  },

  delete: async (eventId: string, options?: { hard?: boolean }) => {
    const response = await api.delete<ApiResponse<any>>(`/events/${eventId}`, {
      params: options?.hard ? { hard: 'true' } : undefined,
    });
    return response.data;
  },

  restore: async (eventId: string) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/restore`);
    return response.data;
  },

  register: async (eventId: string) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/register`);
    return response.data;
  },

  unregister: async (eventId: string) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/unregister`);
    return response.data;
  },

  assignPhotographer: async (eventId: string, email: string, isTrustedUploader?: boolean) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/photographers`, {
      email,
      ...(typeof isTrustedUploader === 'boolean' ? { isTrustedUploader } : {}),
    });
    return response.data;
  },

  removePhotographer: async (eventId: string, userId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/events/${eventId}/photographers/${userId}`);
    return response.data;
  },

  getPhotos: async (
    eventId: string,
    params?: { page?: number; limit?: number; lastKey?: string; all?: boolean; isLiveWall?: boolean; proof?: boolean; proofToken?: string; code?: string }
  ) => {
    const query: Record<string, string | number | undefined> = {};
    if (params?.limit != null) query.limit = params.limit;
    if (params?.page != null) query.page = params.page;
    if (params?.lastKey != null) query.lastKey = params.lastKey;
    if (params?.all === true) query.all = 'true';
    if (params?.isLiveWall === true) query.isLiveWall = 'true';
    if (params?.proof === true) query.proof = 'true';
    if (params?.proofToken) query.proofToken = params.proofToken;
    if (params?.code) query.code = params.code;
    const response = await api.get<ApiResponse<any>>(`/events/${eventId}/photos`, {
      params: query,
    });
    return response.data;
  },

  toggleProofing: async (eventId: string, enabled?: boolean) => {
    const response = await api.patch<ApiResponse<any>>(`/events/${eventId}/proofing`, { enabled });
    return response.data;
  },

  regenerateProofingToken: async (eventId: string) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/proofing/regenerate`);
    return response.data;
  },

  setPhotosOfficial: async (
    eventId: string,
    body: { imageIds: string[]; isOfficial: boolean }
  ) => {
    const response = await api.patch<ApiResponse<{ count?: number; message?: string }>>(
      `/events/${eventId}/photos/official`,
      body
    );
    return response.data;
  },

  getMyOrganizedEvents: async () => {
    const response = await api.get<ApiResponse<any>>('/events/managed/all');
    return response.data;
  },

  getMyAssignedEvents: async () => {
    const response = await api.get<ApiResponse<any>>('/events/assigned/all');
    return response.data;
  },

  joinByCode: async (accessCode: string) => {
    const response = await api.post<ApiResponse<{ eventId: string; name: string }>>('/events/join', { accessCode });
    return response.data;
  },

  checkAccessCode: async (code: string, eventId?: string) => {
    const response = await api.get<ApiResponse<{ available: boolean; message?: string }>>(
      '/events/check-access-code',
      {
        params: {
          code,
          eventId
        }
      }
    );
    return response.data;
  },

  refreshAttendeePhotoMatches: async (eventId: string) => {
    const response = await api.post<
      ApiResponse<{
        status: string;
        progress: number;
        total: number;
        processedWithFace: number;
        skippedNoFace: number;
        skippedDownloadFailed: number;
        errors: { userId: string; message: string }[];
        totalMappingsWritten: number;
        startedAt?: string;
        completedAt?: string;
      }>
    >(`/events/${eventId}/refresh-attendee-photo-matches`, undefined);
    return response.data;
  },

  getAttendeePhotoMatchesRefreshStatus: async (eventId: string) => {
    const response = await api.get<
      ApiResponse<{
        status: 'idle' | 'processing' | 'completed' | 'failed';
        progress: number;
        total: number;
        processedWithFace: number;
        skippedNoFace: number;
        skippedDownloadFailed: number;
        errors: { userId: string; message: string }[];
        totalMappingsWritten: number;
        startedAt?: string;
        completedAt?: string;
        error?: string;
      }>
    >(`/events/${eventId}/refresh-status`);
    return response.data;
  },

  resetAttendeePhotoMatchesRefreshStatus: async (eventId: string) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/reset-refresh-status`);
    return response.data;
  },

  getAIStatus: async (eventId: string) => {
    const response = await api.get<
      ApiResponse<{
        status: 'idle' | 'indexing' | 'ready';
        totalPhotos: number;
        indexedPhotos: number;
        unindexedPhotos: number;
        progress: {
          total: number;
          current: number;
          percentage: number;
          estimatedSecondsRemaining: number;
        };
        aiIndexedAt: string | null;
        hasRegisteredAttendeesWithFaces: boolean;
      }>
    >(`/events/${eventId}/ai-status`);
    return response.data;
  },

  warmUpAI: async (eventId: string) => {
    const response = await api.post<ApiResponse<{ status: 'indexing' }>>(`/events/${eventId}/warm-up-ai`);
    return response.data;
  },

  getSelections: async (eventId: string) => {
    const response = await api.get<
      ApiResponse<{
        counts: {
          albumCount: number;
          originalCount: number;
          combinedCount: number;
        };
        albumFavorites: any[];
        originalRequests: any[];
        combined: any[];
        byUser?: {
          user: {
            _id: string;
            name: string;
            email?: string;
            avatar?: string;
          };
          albumCount: number;
          originalCount: number;
          combinedCount: number;
          albumPhotoIds: string[];
          originalPhotoIds: string[];
        }[];
      }>
    >(`/events/${eventId}/selections`);
    return response.data;
  },

  notifySelectionReady: async (eventId: string, data?: { clientName?: string; clientContact?: string }) => {
    const response = await api.post<
      ApiResponse<{
        albumCount: number;
        originalCount: number;
        combinedCount: number;
      }>
    >(`/events/${eventId}/selections/notify`, data);
    return response.data;
  },

  downloadFavoritesZip: async (eventId: string, photoIds?: string[]) => {
    const response = await api.post(`/events/${eventId}/download-favorites-zip`, { photoIds }, {
      responseType: 'blob',
    });
    return response.data;
  },

  addSubEvent: async (eventId: string, data: { name: string; date?: string; coverPhotoUrl?: string; order?: number }) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/sub-events`, data);
    return response.data;
  },

  updateSubEvent: async (eventId: string, subEventId: string, data: { name?: string; date?: string; coverPhotoUrl?: string; order?: number }) => {
    const response = await api.put<ApiResponse<any>>(`/events/${eventId}/sub-events/${subEventId}`, data);
    return response.data;
  },

  deleteSubEvent: async (eventId: string, subEventId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/events/${eventId}/sub-events/${subEventId}`);
    return response.data;
  },

  batchAssignPhotosSubEvent: async (eventId: string, data: { photoIds: string[]; subEventId: string | null }) => {
    const response = await api.patch<ApiResponse<any>>(`/events/${eventId}/photos/batch-sub-event`, data);
    return response.data;
  },
};

// User API
export const userApi = {
  getProfile: async (userId: string) => {
    const response = await api.get<ApiResponse<any>>(`/users/${userId}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<ApiResponse<any>>('/users/stats');
    return response.data;
  },

  search: async (query: string) => {
    const response = await api.get<ApiResponse<any[]>>('/users/search', {
      params: { query },
    });
    return response.data;
  },

  getEvents: async (userId: string) => {
    const response = await api.get<ApiResponse<any[]>>(`/users/${userId}/events`);
    return response.data;
  },

  updateSettings: async (settings: any) => {
    const response = await api.put<ApiResponse<any>>('/users/settings', { settings });
    return response.data;
  },

  updateStudioSettings: async (settings: {
    businessName?: string;
    phone?: string;
    watermarkType?: 'text' | 'logo';
    watermarkText?: string;
    watermarkSize?: 'small' | 'medium' | 'large';
    logoUrl?: string;
    logoKey?: string;
    watermarkPosition?: 'bottom-right' | 'bottom-left' | 'center';
    watermarkOpacity?: number;
    brandColor?: string;
    defaultProofingDays?: number;
  }) => {
    const response = await api.put<ApiResponse<any>>('/users/studio-settings', settings);
    return response.data;
  },

  uploadStudioLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<ApiResponse<{ logoUrl: string; logoKey: string; user: any }>>(
      '/users/studio-logo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteStudioLogo: async () => {
    const response = await api.delete<ApiResponse<{ user: any }>>('/users/studio-logo');
    return response.data;
  },

  updateName: async (name: string) => {
    const response = await api.patch<ApiResponse<any>>('/users/name', { name });
    return response.data;
  },

  becomeOrganizer: async (body?: SubmitOrganizerRequestDto) => {
    const response = await api.patch<ApiResponse<OrganizerRequest>>('/users/become-organizer', body);
    return response.data;
  },

  checkOrLinkPhone: async (data: {
    phone: string;
    action: 'check' | 'link';
    transferConfirmed?: boolean;
  }) => {
    const response = await api.post<
      ApiResponse<{
        alreadyLinked?: boolean;
        maskedEmail?: string;
        phone?: string;
        isPhoneVerified?: boolean;
      }>
    >('/users/phone', data);
    return response.data;
  },
};

export const organizerRequestApi = {
  submit: async (body: SubmitOrganizerRequestDto) => {
    const response = await api.post<ApiResponse<OrganizerRequest>>('/organizer-requests', body);
    return response.data;
  },

  getMine: async () => {
    const response = await api.get<ApiResponse<OrganizerRequest | null>>('/organizer-requests/me');
    return response.data;
  },

  cancel: async () => {
    const response = await api.delete<ApiResponse<OrganizerRequest>>('/organizer-requests/me');
    return response.data;
  },
};

export const adminOrganizerRequestApi = {
  list: async (params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await api.get<
      ApiResponse<{
        requests: OrganizerRequest[];
        pagination: { total: number; page: number; pages: number; limit?: number };
      }>
    >('/organizer-requests/admin/all', { params });
    return response.data;
  },

  stats: async () => {
    const response = await api.get<ApiResponse<OrganizerRequestStats>>(
      '/organizer-requests/admin/stats'
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<OrganizerRequest>>(
      `/organizer-requests/admin/${id}`
    );
    return response.data;
  },

  approve: async (
    id: string,
    body?: { reviewNote?: string; createOrganization?: boolean; isTrustedUploader?: boolean }
  ) => {
    const response = await api.patch<ApiResponse<OrganizerRequest>>(
      `/organizer-requests/admin/${id}/approve`,
      body
    );
    return response.data;
  },

  reject: async (id: string, body?: { reviewNote?: string }) => {
    const response = await api.patch<ApiResponse<OrganizerRequest>>(
      `/organizer-requests/admin/${id}/reject`,
      body
    );
    return response.data;
  },
};

export const guestSubmissionsApi = {
  getUploadUrls: async (
    eventId: string,
    data: { phone: string; guestName?: string; files: Array<{ fileName: string; fileType: string }> }
  ) => {
    const response = await api.post<ApiResponse<{ uploadTargets: any[]; maxAllowed: number }>>(
      `/events/${eventId}/guest-submissions/presign`,
      data
    );
    return response.data;
  },

  createSubmission: async (
    eventId: string,
    data: {
      guestName: string;
      phone: string;
      avatar?: string;
      photos: Array<{
        s3Key: string;
        originalName: string;
        fileSize: number;
        mimeType: string;
        width?: number;
        height?: number;
      }>;
    }
  ) => {
    const response = await api.post<ApiResponse<{ submissionId: string; totalPhotos: number; status: string }>>(
      `/events/${eventId}/guest-submissions`,
      data
    );
    return response.data;
  },

  getEventSubmissions: async (eventId: string) => {
    const response = await api.get<ApiResponse<{ submissions: any[]; summary: any }>>(
      `/events/${eventId}/guest-submissions`
    );
    return response.data;
  },

  reviewPhotos: async (
    eventId: string,
    submissionId: string,
    data: {
      photoDecisions: Array<{
        photoId: string;
        action: 'approve' | 'reject';
        featureOnLiveWall?: boolean;
        rejectionReason?: string;
      }>;
    }
  ) => {
    const response = await api.patch<ApiResponse<any>>(
      `/events/${eventId}/guest-submissions/${submissionId}/review`,
      data
    );
    return response.data;
  },

  getMySubmissions: async (eventId: string, phone?: string) => {
    const response = await api.get<ApiResponse<any[]>>(
      `/events/${eventId}/guest-submissions/my`,
      { params: phone ? { phone } : undefined }
    );
    return response.data;
  },
};

export interface EventAIBreakdown {
  eventId: string;
  eventName: string;
  eventCode?: string;
  status?: 'active' | 'trash' | 'orphan';
  totalPhotos: number;
  indexedPhotos: number;
  guestMatchCount?: number;
  insightFaceCount: number;
  rekognitionCount: number;
  totalAiCalls?: number;
  insightFacePercentage?: number;
}

export interface AdminAISettings {
  provider: 'insightface' | 'rekognition';
  microservice: {
    online: boolean;
    latencyMs?: number;
    model: string;
    device: string;
    error: string | null;
    serviceUrl: string;
  };
  timeline?: 'all' | '1h' | '24h' | '7d' | '30d';
  selectedEventId?: string | null;
  stats: {
    totalEvents: number;
    totalPhotos: number;
    totalIndexedPhotos: number;
    unindexedPhotos: number;
    activeIndexingJobs: number;
    insightFaceIndexedPhotos: number;
    rekognitionIndexedPhotos: number;
    totalUsersWithFace: number;
    photoIndexing?: {
      insightFace: number;
      rekognition: number;
      total: number;
    };
    guestMatching?: {
      insightFace: number;
      rekognition: number;
      total: number;
    };
    totalAuraFaceCalls?: number;
    totalRekognitionCalls?: number;
    totalAiCalls?: number;
    insightFacePercentage?: number;
    savingsEstimateUsd?: number;
    orphanPhotosCount?: number;
  };
  eventsList?: Array<{ _id: string; name: string; eventCode?: string }>;
  eventBreakdown?: EventAIBreakdown[];
}

export const adminAIApi = {
  getSettings: async (params?: { timeline?: string; eventId?: string }) => {
    const response = await api.get<ApiResponse<AdminAISettings>>('/admin/ai-settings', { params });
    return response.data;
  },
  updateProvider: async (provider: 'insightface' | 'rekognition') => {
    const response = await api.patch<ApiResponse<{ provider: 'insightface' | 'rekognition' }>>(
      '/admin/ai-settings',
      { provider }
    );
    return response.data;
  },
  purgeOrphanPhotos: async () => {
    const response = await api.post<ApiResponse<{ purgedCount: number; s3RawDeleted: number; s3ProcessedDeleted: number }>>(
      '/admin/purge-orphan-photos'
    );
    return response.data;
  },
  testConnection: async () => {
    const response = await api.post<ApiResponse<{ health: any }>>('/admin/ai-test-connection');
    return response.data;
  }
};

export interface CouponInfo {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  applicableTiers: string[];
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  currency: 'INR' | 'USD';
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CouponCalculationResult {
  valid: boolean;
  code: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  label: string;
}

export const paymentApi = {
  applyCoupon: async (data: { code: string; tierId: string; billingCycle?: string }) => {
    const response = await api.post<ApiResponse<CouponCalculationResult>>('/payments/apply-coupon', data);
    return response.data;
  },
  createOrder: async (data: { tierId: string; billingCycle?: string; couponCode?: string; currency?: string }) => {
    const response = await api.post<ApiResponse<{
      orderId: string;
      amount: number;
      currency: string;
      invoiceNumber: string;
      tier: { id: string; name: string };
      keyId: string;
      isSandbox: boolean;
    }>>('/payments/create-order', data);
    return response.data;
  },
  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    tierId: string;
    billingCycle?: string;
    couponCode?: string;
  }) => {
    const response = await api.post<ApiResponse<any>>('/payments/verify', data);
    return response.data;
  }
};

export const adminCouponsApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<CouponInfo[]>>('/admin/coupons');
    return response.data;
  },
  create: async (data: Partial<CouponInfo>) => {
    const response = await api.post<ApiResponse<CouponInfo>>('/admin/coupons', data);
    return response.data;
  },
  toggle: async (id: string) => {
    const response = await api.patch<ApiResponse<CouponInfo>>(`/admin/coupons/${id}/toggle`);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete<ApiResponse<any>>(`/admin/coupons/${id}`);
    return response.data;
  }
};

export interface AIPricingCalculationResult {
  quota: number;
  durationDays: number;
  recommendedPrice: number;
  floorPrice: number;
  premiumPrice: number;
  estimatedInfraCost: number;
  grossMarginPercent: number;
  enabledFeatures: string[];
  disabledFeatures: string[];
  salesPitchText: string;
}

export const adminPricingCalculatorApi = {
  calculate: async (data: {
    photoQuota: number;
    days: number;
    features: Record<string, boolean>;
    maxTeamMembers?: number;
  }) => {
    const response = await api.post<ApiResponse<AIPricingCalculationResult>>('/admin/ai-price-calculator', data);
    return response.data;
  }
};

export const adminBypassApi = {
  grantOrganizerBypass: async (data: {
    userId?: string;
    email?: string;
    effectiveTier?: string;
    days?: number;
    customPhotoQuota?: number;
    customFeatures?: Record<string, boolean>;
    agreedPrice?: number;
    customInvoiceNumber?: string;
    reason?: string;
  }) => {
    const response = await api.post<ApiResponse<any>>('/admin/bypass/organizer', data);
    return response.data;
  },
  revokeOrganizerBypass: async (userId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/admin/bypass/organizer/${userId}`);
    return response.data;
  },
  grantEventBypass: async (data: {
    eventId?: string;
    eventCode?: string;
    days?: number;
    customPhotoLimit?: number;
    allowGoogleDriveSync?: boolean;
    allowRawDownloads?: boolean;
    reason?: string;
  }) => {
    const response = await api.post<ApiResponse<any>>('/admin/bypass/event', data);
    return response.data;
  },
  revokeEventBypass: async (eventId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/admin/bypass/event/${eventId}`);
    return response.data;
  }
};

export interface CustomPaymentLinkItem {
  _id: string;
  invoiceNumber: string;
  amount: number;
  status: 'created' | 'captured' | 'failed' | 'refunded';
  gatewayPaymentLinkId?: string;
  paymentLinkUrl?: string;
  createdAt: string;
  paidAt?: string;
  targetEmail: string;
  targetName?: string;
  photoQuota?: number;
  days?: number;
  customFeatures?: Record<string, boolean>;
}

export const adminCustomPaymentLinksApi = {
  createLink: async (data: {
    email?: string;
    userId?: string;
    agreedPrice: number;
    effectiveTier?: string;
    days?: number;
    customPhotoQuota?: number;
    customFeatures?: Record<string, boolean>;
    maxTeamMembers?: number;
    reason?: string;
  }) => {
    const response = await api.post<ApiResponse<{
      orderId: string;
      paymentLinkId: string;
      paymentLinkUrl: string;
      invoiceNumber: string;
      amount: number;
      isLiveGateway: boolean;
      targetUser: { id: string; name: string; email: string };
      whatsAppShareText: string;
    }>>('/admin/create-custom-payment-link', data);
    return response.data;
  },
  listLinks: async () => {
    const response = await api.get<ApiResponse<CustomPaymentLinkItem[]>>('/admin/custom-payment-links');
    return response.data;
  },
  simulatePayment: async (data: { orderId?: string; paymentLinkId?: string }) => {
    const response = await api.post<ApiResponse<any>>('/admin/simulate-custom-payment', data);
    return response.data;
  }
};

export default api;

