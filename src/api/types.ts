export interface Episode {
  id: string;
  title: string;
  author?: string;
  date?: string;
  link?: string;
  src: string; // Direct MP3 or audio stream URL
  duration?: string;
  durationMs?: number;
  description?: string;
  season?: number;
  podcastId: number;
  podcastTitle: string;
  podcastImage: string;
}

export interface Podcast {
  id: number;
  title: string;
  slug: string;
  link: string;
  imageUrl: string;
  categories: number[];
  categoryNames?: string[];
  excerpt: string;
  episodeCount: number;
  episodes: Episode[];
  isKidFriendly: boolean;
  date: string;
  rating?: number;
  ratingCount?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  count: number;
  icon?: string;
  color?: string;
}

export type AppMode = 'kids' | 'full';

export interface SleepTimerOption {
  label: string;
  minutes: number | null; // null for end of episode
}

export type PodcastSortOption = 'date' | 'rating' | 'name';
export type EpisodeSortOption = 'asc' | 'desc';

