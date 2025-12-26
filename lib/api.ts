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

// Photo API
export const photoApi = {
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

