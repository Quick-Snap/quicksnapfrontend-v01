export type EventCategory = 'wedding' | 'college' | 'corporate' | 'festival' | 'general';

export interface SubEventItem {
  _id?: string;
  name: string;
  date?: string;
  coverPhotoUrl?: string;
  order?: number;
}

export interface EventProfile {
  id: EventCategory;
  name: string;
  icon: string;
  accentGlow: string;
  accentBorder: string;
  accentText: string;
  badgeClass: string;
  heroSubtitle: string;
  albumButtonLabel: string;
  quickCeremonies: string[];
}

export const EVENT_PROFILES: Record<EventCategory, EventProfile> = {
  wedding: {
    id: 'wedding',
    name: 'Wedding & Pre-Wedding',
    icon: '💍',
    accentGlow: 'from-amber-400/20 via-rose-500/20 to-purple-500/20',
    accentBorder: 'border-rose-500/30',
    accentText: 'text-rose-400',
    badgeClass: 'border-rose-500/40 bg-rose-950/50 text-rose-300 shadow-rose-950/40',
    heroSubtitle: 'Celebrate the Sacred Union',
    albumButtonLabel: 'Select for Wedding Album',
    quickCeremonies: [
      'Haldi & Mehndi',
      'Sangeet',
      'Engagement',
      'Tilak',
      'Wedding',
      'Prewedding',
      'Reception',
    ],
  },
  college: {
    id: 'college',
    name: 'College Fest & Campus',
    icon: '🎓',
    accentGlow: 'from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20',
    accentBorder: 'border-violet-500/30',
    accentText: 'text-violet-400',
    badgeClass: 'border-violet-500/40 bg-violet-950/50 text-violet-300 shadow-violet-950/40',
    heroSubtitle: 'Live Campus Moments & Highlights',
    albumButtonLabel: 'Save Favorites',
    quickCeremonies: ['Day 1', 'Day 2', 'Competitions', 'Celebrity Night'],
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Conference & Summit',
    icon: '🏢',
    accentGlow: 'from-blue-500/20 via-indigo-500/20 to-slate-500/20',
    accentBorder: 'border-blue-500/30',
    accentText: 'text-blue-400',
    badgeClass: 'border-blue-500/40 bg-blue-950/50 text-blue-300 shadow-blue-950/40',
    heroSubtitle: 'Official Conference & Summit Media',
    albumButtonLabel: 'Save for Press / Media',
    quickCeremonies: ['Keynotes', 'Panel Discussions', 'Workshops', 'Gala Dinner'],
  },
  festival: {
    id: 'festival',
    name: 'Cultural Fest & Concert',
    icon: '🎉',
    accentGlow: 'from-amber-500/20 via-orange-500/20 to-rose-500/20',
    accentBorder: 'border-orange-500/30',
    accentText: 'text-orange-400',
    badgeClass: 'border-orange-500/40 bg-orange-950/50 text-orange-300 shadow-orange-950/40',
    heroSubtitle: 'Festival Gallery & Live Action',
    albumButtonLabel: 'Save Favorites',
    quickCeremonies: ['Day 1', 'Day 2', 'Main Stage', 'After Party'],
  },
  general: {
    id: 'general',
    name: 'General Event / Party',
    icon: '✨',
    accentGlow: 'from-violet-500/15 via-purple-500/15 to-indigo-500/15',
    accentBorder: 'border-white/20',
    accentText: 'text-zinc-300',
    badgeClass: 'border-white/20 bg-zinc-900/90 text-zinc-300 shadow-black/40',
    heroSubtitle: 'Event Photo Gallery',
    albumButtonLabel: 'Select Photos',
    quickCeremonies: [],
  },
};

export function getEventProfile(category?: string | null): EventProfile {
  if (!category) return EVENT_PROFILES.wedding;
  const key = category.toLowerCase() as EventCategory;
  return EVENT_PROFILES[key] || EVENT_PROFILES.wedding;
}
