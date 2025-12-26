import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'organizer' | 'photographer' | 'admin';
  selfieUrl?: string;
}

export interface AppEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  coverImage: string;
  organizerId: string;
  photoCount: number;
}

export interface AppPhoto {
  id: string;
  url: string;
  eventId: string;
  eventName: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'queued' | 'processing' | 'approved' | 'rejected';
  rejectionReason?: string;
  isPublic: boolean;
  detectedFaces?: Array<{
    id: string;
    userId?: string;
    confidence: number;
    thumbnail: string;
  }>;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  modalOpen: string | null;
}

interface AppState {
  user: AppUser | null;
  events: AppEvent[];
  photos: AppPhoto[];
  loading: boolean;
  ui: UIState;
}

interface AppActions {
  setUser: (user: AppUser | null) => void;
  setEvents: (events: AppEvent[]) => void;
  addEvent: (event: AppEvent) => void;
  updateEvent: (id: string, updates: Partial<AppEvent>) => void;
  removeEvent: (id: string) => void;
  setPhotos: (photos: AppPhoto[]) => void;
  addPhoto: (photo: AppPhoto) => void;
  addPhotos: (photos: AppPhoto[]) => void;
  updatePhoto: (id: string, updates: Partial<AppPhoto>) => void;
  removePhoto: (id: string) => void;
  setLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  reset: () => void;
}

type AppStore = AppState & AppActions;

// Mock data for initial state
const mockEvents: AppEvent[] = [
  {
    id: '1',
    name: 'Spring Festival 2024',
    date: '2024-03-15',
    location: 'Main Campus',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    organizerId: 'org1',
    photoCount: 156
  },
  {
    id: '2',
    name: 'Tech Symposium',
    date: '2024-03-20',
    location: 'Engineering Building',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    organizerId: 'org1',
    photoCount: 89
  },
  {
    id: '3',
    name: 'Sports Day',
    date: '2024-03-25',
    location: 'Stadium',
    coverImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    organizerId: 'org2',
    photoCount: 234
  },
  {
    id: '4',
    name: 'Cultural Night',
    date: '2024-04-01',
    location: 'Auditorium',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    organizerId: 'org1',
    photoCount: 167
  }
];

const mockPhotos: AppPhoto[] = [
  {
    id: 'p1',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800',
    eventId: '1',
    eventName: 'Spring Festival 2024',
    uploadedBy: 'org1',
    uploadedAt: '2024-03-15T10:00:00Z',
    status: 'approved',
    isPublic: true,
    detectedFaces: [
      { id: 'f1', confidence: 0.95, thumbnail: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' },
      { id: 'f2', confidence: 0.92, thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }
    ]
  },
  {
    id: 'p2',
    url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800',
    eventId: '1',
    eventName: 'Spring Festival 2024',
    uploadedBy: 'org1',
    uploadedAt: '2024-03-15T11:00:00Z',
    status: 'approved',
    isPublic: true,
    detectedFaces: [
      { id: 'f3', confidence: 0.88, thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }
    ]
  },
  {
    id: 'p3',
    url: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800',
    eventId: '2',
    eventName: 'Tech Symposium',
    uploadedBy: 'org1',
    uploadedAt: '2024-03-20T09:00:00Z',
    status: 'approved',
    isPublic: false,
    detectedFaces: []
  },
  {
    id: 'p4',
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
    eventId: '3',
    eventName: 'Sports Day',
    uploadedBy: 'org2',
    uploadedAt: '2024-03-25T14:00:00Z',
    status: 'approved',
    isPublic: true,
    detectedFaces: [
      { id: 'f4', confidence: 0.91, thumbnail: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100' }
    ]
  }
];

const initialState: AppState = {
  user: null,
  events: mockEvents,
  photos: mockPhotos,
  loading: false,
  ui: {
    sidebarOpen: true,
    theme: 'dark',
    modalOpen: null,
  },
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setUser: (user) => set({ user }),

    setEvents: (events) => set({ events }),

    addEvent: (event) => set((state) => ({ 
      events: [...state.events, event] 
    })),

    updateEvent: (id, updates) => set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      ),
    })),

    removeEvent: (id) => set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    })),

    setPhotos: (photos) => set({ photos }),

    addPhoto: (photo) => set((state) => ({ 
      photos: [...state.photos, photo] 
    })),

    addPhotos: (photos) => set((state) => ({ 
      photos: [...state.photos, ...photos] 
    })),

    updatePhoto: (id, updates) => set((state) => ({
      photos: state.photos.map((photo) =>
        photo.id === id ? { ...photo, ...updates } : photo
      ),
    })),

    removePhoto: (id) => set((state) => ({
      photos: state.photos.filter((photo) => photo.id !== id),
    })),

    setLoading: (loading) => set({ loading }),

    toggleSidebar: () => set((state) => ({ 
      ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } 
    })),

    setSidebarOpen: (open) => set((state) => ({ 
      ui: { ...state.ui, sidebarOpen: open } 
    })),

    setTheme: (theme) => set((state) => ({ 
      ui: { ...state.ui, theme } 
    })),

    openModal: (modalId) => set((state) => ({ 
      ui: { ...state.ui, modalOpen: modalId } 
    })),

    closeModal: () => set((state) => ({ 
      ui: { ...state.ui, modalOpen: null } 
    })),

    reset: () => set(initialState),
  }))
);

// Selector hooks for optimized re-renders
export const useEvents = () => useAppStore((state) => state.events);
export const usePhotos = () => useAppStore((state) => state.photos);
export const useAppLoading = () => useAppStore((state) => state.loading);
export const useUI = () => useAppStore((state) => state.ui);
export const useSidebarOpen = () => useAppStore((state) => state.ui.sidebarOpen);
export const useTheme = () => useAppStore((state) => state.ui.theme);

// Computed selectors
export const useEventById = (id: string) => useAppStore((state) => 
  state.events.find((event) => event.id === id)
);

export const usePhotosByEvent = (eventId: string) => useAppStore((state) => 
  state.photos.filter((photo) => photo.eventId === eventId)
);

export const useApprovedPhotos = () => useAppStore((state) => 
  state.photos.filter((photo) => photo.status === 'approved')
);

export const usePendingPhotos = () => useAppStore((state) => 
  state.photos.filter((photo) => photo.status === 'queued' || photo.status === 'processing')
);

