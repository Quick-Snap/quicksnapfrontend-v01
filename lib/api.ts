import { AxiosError } from 'axios';
import { ApiResponse } from '@/types';
import api from '@/app/api/axios';

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
  getUploadUrls: async (eventId: string, files: UploadUrlRequest[]) => {
    const response = await api.post<ApiResponse<{ urls: UploadUrlResponse[] }>>(
      '/photos/get-upload-urls',
      {
        eventId,
        files,
      }
    );
    return response.data;
  },

  // Upload a single file directly to S3 using presigned URL
  uploadToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
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
      xhr.setRequestHeader('Content-Type', file.type);
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
    concurrency: number = 5
  ) => {
    // Step 1: Get presigned URLs for all files
    const fileRequests: UploadUrlRequest[] = files.map((file) => ({
      fileName: file.name,
      fileType: file.type || 'application/octet-stream',
    }));

    const urlResponse = await photoApi.getUploadUrls(eventId, fileRequests);
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
        });

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

  getMyPhotos: async (params?: { page?: number; limit?: number; eventId?: string }) => {
    const response = await api.get<ApiResponse<any>>('/photos/my-photos', { params });
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

  downloadMyPhotosZip: async () => {
    const response = await api.get('/photos/my-photos/download', {
      responseType: 'blob'
    });
    return response.data;
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

  getById: async (eventId: string) => {
    const response = await api.get<ApiResponse<any>>(`/events/${eventId}`);
    return response.data;
  },

  update: async (eventId: string, data: Partial<any>) => {
    const response = await api.put<ApiResponse<any>>(`/events/${eventId}`, data);
    return response.data;
  },

  delete: async (eventId: string) => {
    const response = await api.delete<ApiResponse<any>>(`/events/${eventId}`);
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

  assignPhotographer: async (eventId: string, email: string) => {
    const response = await api.post<ApiResponse<any>>(`/events/${eventId}/photographers`, { email });
    return response.data;
  },

  getPhotos: async (eventId: string, params?: { page?: number; limit?: number }) => {
    const response = await api.get<ApiResponse<any>>(`/events/${eventId}/photos`, { params });
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

  updateName: async (name: string) => {
    const response = await api.patch<ApiResponse<any>>('/users/name', { name });
    return response.data;
  },

  becomeOrganizer: async () => {
    const response = await api.patch<ApiResponse<any>>('/users/become-organizer');
    return response.data;
  },
};

export default api;

