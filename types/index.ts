export type UserRole = 'user' | 'organizer' | 'photographer' | 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole; // active role
  roles: UserRole[]; // all available roles
  faceRegistered: boolean;
  createdAt?: string; // Member since date
  settings?: {
    notifications: boolean;
    autoDownload: boolean;
    privacy: 'public' | 'friends' | 'private';
  };
  events?: string[]; // IDs of joined/organized events
}

export interface Event {
  _id: string;
  name: string;
  description: string;
  organizer: User;
  startDate: string;
  endDate: string;
  venue: string;
  isActive: boolean;
  attendees: User[];
  photographers?: User[];
  photos: string[];
  settings: {
    autoApprovePhotos: boolean;
    allowPublicUpload: boolean;
    faceMatchingEnabled: boolean;
    moderationEnabled: boolean;
    requireRegistration: boolean;
  };
  accessCode?: string;
  tags: string[];
  coverImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Photo {
  _id: string;
  originalKey: string;
  processedKey?: string;
  publicKey?: string;
  eventId: Event | string;
  uploadedBy: User | string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  faceMatches: FaceMatch[];
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationLabels: string[];
  isPublic: boolean;
  metadata: {
    cameraMake?: string;
    cameraModel?: string;
    takenAt?: string;
    location?: string;
  };
  viewCount: number;
  downloadCount: number;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FaceMatch {
  userId: User | string;
  faceId?: string;
  confidence: number;
  boundingBox?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

