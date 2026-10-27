import AsyncStorage from '@react-native-async-storage/async-storage';
import { Episode, Podcast, Category } from './types';

const BASE_URL = 'https://podcastim.org.il/wp-json/wp/v2';
export const KIDS_CATEGORY_ID = 8; // Official 'ילדים' category on podcastim.org.il

const CACHE_KEYS = {
  KIDS_PODCASTS: '@podcastim_cache_kids_podcasts_v2',
  ALL_PODCASTS: '@podcastim_cache_all_podcasts_v2',
  CATEGORIES: '@podcastim_cache_categories_v1',
  PODCAST_PREFIX: '@podcastim_cache_pod_v2_',
};

// Helper to decode HTML entities in titles and descriptions
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>?/gm, '') // Strip remaining HTML tags
    .trim();
}

/**
 * Extracts episodes from WordPress post content rendered by Podcast Player plugin
 */
export function parseEpisodesFromContent(
  content: string,
  podcastId: number,
  podcastTitle: string,
  podcastImage: string
): Episode[] {
  const episodes: Episode[] = [];

  // 1. Try parsing from data-ppsdata attribute (which holds the complete episode metadata list)
  const ppsMatch = content.match(/data-ppsdata="([^"]+)"/);
  if (ppsMatch) {
    const raw = ppsMatch[1];
    const regex = /&quot;(ppe-[^&quot;]+)&quot;:\s*\{(&quot;title&quot;[\s\S]*?&quot;key&quot;:&quot;[^&quot;]+&quot;)\}/g;
    let match;

    while ((match = regex.exec(raw)) !== null) {
      const key = match[1];
      const block = match[2];

      const getField = (fieldName: string): string | undefined => {
        const fieldRegex = new RegExp(`&quot;${fieldName}&quot;:\\s*(&quot;([\\s\\S]*?)&quot;|(\\d+)|true|false|\\[[^\\]]*\\])`);
        const fm = block.match(fieldRegex);
        if (!fm) return undefined;
        if (fm[2] !== undefined) {
          try {
            return JSON.parse(`"${fm[2]}"`);
          } catch {
            return fm[2];
          }
        }
        return fm[1];
      };

      const titleRaw = getField('title') || '';
      const author = getField('author');
      const date = getField('date');
      const link = getField('link');
      const srcRaw = getField('src');
      const duration = getField('duration');
      const descRaw = getField('description') || '';
      const seasonRaw = getField('season');

      if (srcRaw) {
        const src = srcRaw.replace(/\\\//g, '/');
        episodes.push({
          id: `${podcastId}-${key}`,
          title: decodeHtmlEntities(titleRaw) || `פרק ${episodes.length + 1}`,
          author: author ? decodeHtmlEntities(author) : undefined,
          date,
          link,
          src,
          duration,
          description: decodeHtmlEntities(descRaw),
          season: seasonRaw ? parseInt(seasonRaw, 10) : undefined,
          podcastId,
          podcastTitle,
          podcastImage,
        });
      }
    }
  }

  // 2. Fallback: Check for HTML <audio> tags or direct MP3 source links
  if (episodes.length === 0) {
    const audioSrcMatches = [...content.matchAll(/<audio[^>]*>[\s\S]*?<source[^>]*src="([^"]+)"/gi)];
    for (let i = 0; i < audioSrcMatches.length; i++) {
      const src = audioSrcMatches[i][1];
      if (src && (src.includes('.mp3') || src.includes('anchor.fm') || src.includes('audio'))) {
        episodes.push({
          id: `${podcastId}-audio-${i}`,
          title: `${podcastTitle} - פרק ${i + 1}`,
          src,
          podcastId,
          podcastTitle,
          podcastImage,
        });
      }
    }
  }

  return episodes;
}

/**
 * Extracts average rating and total vote count from WordPress post content (Rate My Post plugin)
 */
export function parseRatingsFromContent(content: string): { rating?: number; ratingCount?: number } {
  if (!content) return {};
  const avgMatch = content.match(/class="[^"]*js-rmp-avg-rating[^"]*"[^>]*>\s*([\d.]+)\s*<\/span>/i);
  const votesMatch = content.match(/class="[^"]*js-rmp-vote-count[^"]*"[^>]*>\s*(\d+)\s*<\/span>/i);

  const rating = avgMatch ? parseFloat(avgMatch[1]) : undefined;
  const ratingCount = votesMatch ? parseInt(votesMatch[1], 10) : undefined;

  return { rating, ratingCount };
}

/**
 * Fetch podcasts with Stale-While-Revalidate caching
 */
export async function fetchPodcasts(params?: {
  categoryId?: number;
  search?: string;
  page?: number;
  perPage?: number;
  onBackgroundUpdate?: (updated: Podcast[]) => void;
}): Promise<Podcast[]> {
  const { categoryId, search, page = 1, perPage = 16, onBackgroundUpdate } = params || {};

  const isKidsDefault = categoryId === KIDS_CATEGORY_ID && !search && page === 1;
  const isAllDefault = !categoryId && !search && page === 1;
  const cacheKey = isKidsDefault
    ? CACHE_KEYS.KIDS_PODCASTS
    : isAllDefault
    ? CACHE_KEYS.ALL_PODCASTS
    : null;

  // 1. Try reading from instant disk cache
  let cachedData: Podcast[] | null = null;
  if (cacheKey) {
    try {
      const stored = await AsyncStorage.getItem(cacheKey);
      if (stored) {
        cachedData = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Cache read error', e);
    }
  }

  // Construct network URL with optimized fields filter to reduce payload size
  let url = `${BASE_URL}/posts?_embed=1&per_page=${perPage}&page=${page}&_fields=id,title,slug,link,categories,excerpt,date,_links,_embedded,content`;
  if (categoryId) {
    url += `&categories=${categoryId}`;
  }
  if (search && search.trim().length > 0) {
    url += `&search=${encodeURIComponent(search.trim())}`;
  }

  const networkFetch = async (): Promise<Podcast[]> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const parsed: Podcast[] = data.map((post: any) => {
      const title = decodeHtmlEntities(post.title?.rendered || '');
      const imageUrl =
        post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
        'https://podcastim.org.il/wp-content/uploads/2023/04/אפליקציית-פודקאסטים-בעברית-אייקון-קטן.jpg';

      const rawContent = post.content?.rendered || '';
      const episodes = parseEpisodesFromContent(rawContent, post.id, title, imageUrl);
      const isKidFriendly = Array.isArray(post.categories) && post.categories.includes(KIDS_CATEGORY_ID);
      const { rating, ratingCount } = parseRatingsFromContent(rawContent);

      return {
        id: post.id,
        title,
        slug: post.slug,
        link: post.link,
        imageUrl,
        categories: post.categories || [],
        excerpt: decodeHtmlEntities(post.excerpt?.rendered || ''),
        episodeCount: episodes.length,
        episodes,
        isKidFriendly,
        date: post.date,
        rating,
        ratingCount,
      };
    });

    // Save to cache asynchronously if applicable
    if (cacheKey && parsed.length > 0) {
      AsyncStorage.setItem(cacheKey, JSON.stringify(parsed)).catch(() => {});
    }

    return parsed;
  };

  // If we have cached data, return it immediately and revalidate in background!
  if (cachedData && cachedData.length > 0) {
    // Background revalidation
    networkFetch()
      .then((freshData) => {
        if (onBackgroundUpdate && freshData.length > 0) {
          // Compare if changed
          const isSame =
            cachedData &&
            cachedData.length === freshData.length &&
            cachedData[0]?.id === freshData[0]?.id &&
            cachedData[0]?.episodeCount === freshData[0]?.episodeCount;
          if (!isSame) {
            onBackgroundUpdate(freshData);
          }
        }
      })
      .catch((e) => console.log('Background fetch failed silently', e.message));

    return cachedData;
  }

  // If no cache exists, await the network fetch directly
  return networkFetch();
}

/**
 * Fetch a single podcast by ID with caching
 */
export async function fetchPodcastById(id: number): Promise<Podcast> {
  const cacheKey = `${CACHE_KEYS.PODCAST_PREFIX}${id}`;

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Background refresh
      fetch(`${BASE_URL}/posts/${id}?_embed=1`)
        .then((r) => r.json())
        .then((post) => {
          if (post && post.id) {
            const title = decodeHtmlEntities(post.title?.rendered || '');
            const imageUrl =
              post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
              'https://podcastim.org.il/wp-content/uploads/2023/04/אפליקציית-פודקאסטים-בעברית-אייקון-קטן.jpg';
            const rawContent = post.content?.rendered || '';
            const episodes = parseEpisodesFromContent(rawContent, post.id, title, imageUrl);
            const { rating, ratingCount } = parseRatingsFromContent(rawContent);
            const fresh: Podcast = {
              id: post.id,
              title,
              slug: post.slug,
              link: post.link,
              imageUrl,
              categories: post.categories || [],
              excerpt: decodeHtmlEntities(post.excerpt?.rendered || ''),
              episodeCount: episodes.length,
              episodes,
              isKidFriendly: Array.isArray(post.categories) && post.categories.includes(KIDS_CATEGORY_ID),
              date: post.date,
              rating,
              ratingCount,
            };
            AsyncStorage.setItem(cacheKey, JSON.stringify(fresh)).catch(() => {});
          }
        })
        .catch(() => {});

      return parsed;
    }
  } catch (e) {
    console.warn('Error reading single podcast cache', e);
  }

  const res = await fetch(`${BASE_URL}/posts/${id}?_embed=1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const post = await res.json();

  const title = decodeHtmlEntities(post.title?.rendered || '');
  const imageUrl =
    post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
    'https://podcastim.org.il/wp-content/uploads/2023/04/אפליקציית-פודקאסטים-בעברית-אייקון-קטן.jpg';

  const rawContent = post.content?.rendered || '';
  const episodes = parseEpisodesFromContent(rawContent, post.id, title, imageUrl);
  const isKidFriendly = Array.isArray(post.categories) && post.categories.includes(KIDS_CATEGORY_ID);
  const { rating, ratingCount } = parseRatingsFromContent(rawContent);

  const podcast: Podcast = {
    id: post.id,
    title,
    slug: post.slug,
    link: post.link,
    imageUrl,
    categories: post.categories || [],
    excerpt: decodeHtmlEntities(post.excerpt?.rendered || ''),
    episodeCount: episodes.length,
    episodes,
    isKidFriendly,
    date: post.date,
    rating,
    ratingCount,
  };

  AsyncStorage.setItem(cacheKey, JSON.stringify(podcast)).catch(() => {});
  return podcast;
}

let memoryCategoriesCache: Category[] | null = null;

/**
 * Fetch all categories with memory + disk caching
 */
export async function fetchCategories(): Promise<Category[]> {
  if (memoryCategoriesCache && memoryCategoriesCache.length > 0) {
    return memoryCategoriesCache;
  }

  // Try reading disk cache first for 0ms startup
  try {
    const diskCached = await AsyncStorage.getItem(CACHE_KEYS.CATEGORIES);
    if (diskCached) {
      memoryCategoriesCache = JSON.parse(diskCached);
      // Trigger background refresh
      fetch(`${BASE_URL}/categories?per_page=100`)
        .then((r) => r.json())
        .then((raw) => {
          if (Array.isArray(raw)) {
            const updated = formatCategories(raw);
            memoryCategoriesCache = updated;
            AsyncStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(updated)).catch(() => {});
          }
        })
        .catch(() => {});
      return memoryCategoriesCache!;
    }
  } catch (e) {
    console.warn('Error reading categories cache', e);
  }

  const res = await fetch(`${BASE_URL}/categories?per_page=100`);
  if (!res.ok) return [];

  const rawCats = await res.json();
  if (!Array.isArray(rawCats)) return [];

  const formatted = formatCategories(rawCats);
  memoryCategoriesCache = formatted;
  AsyncStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(formatted)).catch(() => {});
  return formatted;
}

function formatCategories(rawCats: any[]): Category[] {
  const filtered = rawCats
    .filter((c: any) => c.count > 0 && c.id !== 1 && c.id !== 39)
    .map((c: any) => ({
      id: c.id,
      name: decodeHtmlEntities(c.name),
      slug: c.slug,
      count: c.count,
      icon: getCategoryIcon(c.id),
      color: getCategoryColor(c.id),
    }));

  filtered.sort((a, b) => {
    if (a.id === KIDS_CATEGORY_ID) return -1;
    if (b.id === KIDS_CATEGORY_ID) return 1;
    return b.count - a.count;
  });

  return filtered;
}

function getCategoryIcon(catId: number): string {
  switch (catId) {
    case KIDS_CATEGORY_ID:
      return 'happy-outline';
    case 21:
      return 'planet-outline';
    case 2:
      return 'hourglass-outline';
    case 4:
      return 'musical-notes-outline';
    case 22:
      return 'hardware-chip-outline';
    case 60:
      return 'sparkles-outline';
    case 57:
      return 'book-outline';
    case 116:
      return 'school-outline';
    case 169:
      return 'paw-outline';
    case 47:
      return 'map-outline';
    case 14:
      return 'football-outline';
    case 132:
      return 'restaurant-outline';
    case 95:
      return 'game-controller-outline';
    default:
      return 'mic-outline';
  }
}

function getCategoryColor(catId: number): string {
  switch (catId) {
    case KIDS_CATEGORY_ID:
      return '#FF6584';
    case 21:
      return '#6C5CE7';
    case 2:
      return '#E17055';
    case 4:
      return '#FD79A8';
    case 22:
      return '#0984E3';
    case 60:
      return '#FDCB6E';
    case 57:
      return '#00B894';
    case 169:
      return '#20BF6B';
    default:
      return '#4A69BD';
  }
}
