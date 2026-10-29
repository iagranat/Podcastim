import AsyncStorage from '@react-native-async-storage/async-storage';
import { Episode, Podcast, Category, PodcastSortOption } from './types';

const BASE_URL = 'https://podcastim.org.il/wp-json/wp/v2';
export const KIDS_CATEGORY_ID = 8; // Official 'ילדים' category on podcastim.org.il

const CACHE_KEYS = {
  KIDS_PODCASTS: '@podcastim_cache_kids_podcasts_v4',
  ALL_PODCASTS: '@podcastim_cache_all_podcasts_v4',
  CATEGORIES: '@podcastim_cache_categories_v1',
  PODCAST_PREFIX: '@podcastim_cache_pod_v4_',
  CATALOG_INDEX: '@podcastim_cache_catalog_index_v4',
};

const HEBREW_NUM_WORDS: Record<string, number> = {
  'ראשון': 1,
  'ראשונה': 1,
  'שני': 2,
  'שניה': 2,
  'שנייה': 2,
  'שלישי': 3,
  'שלישית': 3,
  'רביעי': 4,
  'רביעית': 4,
  'חמישי': 5,
  'חמישית': 5,
  'שישי': 6,
  'שישית': 6,
  'שביעי': 7,
  'שביעית': 7,
  'שמיני': 8,
  'שמינית': 8,
  'תשיעי': 9,
  'תשיעית': 9,
  'עשירי': 10,
  'עשירית': 10,
};

// Helper to decode HTML entities, unicode escapes, and quotes in titles and descriptions
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    // Decode unicode character escapes (e.g. \u05d0 -> א)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Common HTML typography entities
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&#8243;/g, '″')
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    // Quotes and apostrophes
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#034;/g, '"')
    .replace(/&#34;/g, '"')
    // Tags and symbols
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>?/gm, '') // Strip remaining HTML tags
    .trim();
}

export function getEpisodeNumber(title: string): number | null {
  if (!title) return null;
  // Check Hebrew written ordinals like פרק ראשון, פרק שני
  const mWord = title.match(/פרק\s+(ראשון|ראשונה|שני|שניה|שנייה|שלישי|שלישית|רביעי|רביעית|חמישי|חמישית|שישי|שישית|שביעי|שביעית|שמיני|שמינית|תשיעי|תשיעית|עשירי|עשירית)/i);
  if (mWord && HEBREW_NUM_WORDS[mWord[1]]) {
    return HEBREW_NUM_WORDS[mWord[1]];
  }
  // Check numeric expressions like פרק 8, episode 8, פרק: 8, פרק מס' 8
  const m = title.match(/(?:פרק|episode)\s*(?:מס'|מספר|[:#\s])*\s*(\d+)/i);
  if (m) return parseInt(m[1], 10);
  const m2 = title.match(/#(\d+)/);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

export function parseDateToTime(dateStr?: string): number {
  if (!dateStr) return 0;
  const clean = dateStr.replace(/\\/g, '').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d).getTime();
  }
  const t = new Date(clean).getTime();
  return isNaN(t) ? 0 : t;
}

const PPS_KNOWN_KEYS =
  'title|description|author|date|link|src|mediatype|season|categories|duration|episodetype|source_mime|source_format|is_hls|timestamp|key';

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
    const regex = /&quot;(ppe-[^&quot;]+)&quot;:\s*\{([\s\S]*?&quot;key&quot;:&quot;[^&quot;]+&quot;)\}/g;
    let match;

    while ((match = regex.exec(raw)) !== null) {
      const key = match[1];
      const block = match[2];

      const getField = (fieldName: string): string | undefined => {
        // Match string until the next known property key or ending brace, preventing embedded quotes from breaking fields
        const strRegex = new RegExp(
          `&quot;${fieldName}&quot;:\\s*&quot;([\\s\\S]*?)&quot;(?=\\s*,\\s*&quot;(?:${PPS_KNOWN_KEYS})&quot;|\\s*\\})`
        );
        const sm = block.match(strRegex);
        if (sm) return sm[1];

        // Non-string fields (number, boolean, array)
        const valRegex = new RegExp(`&quot;${fieldName}&quot;:\\s*([0-9]+|true|false|\\[[^\\]]*\\])`);
        const vm = block.match(valRegex);
        if (vm) return vm[1];

        return undefined;
      };

      const titleRaw = getField('title') || '';
      const author = getField('author');
      const dateRaw = getField('date');
      const link = getField('link');
      const srcRaw = getField('src');
      const duration = getField('duration');
      const descRaw = getField('description') || '';
      const seasonRaw = getField('season');

      if (srcRaw) {
        const src = srcRaw.replace(/\\\//g, '/');
        const cleanDate = dateRaw ? dateRaw.replace(/\\\//g, '/') : undefined;
        episodes.push({
          id: `${podcastId}-${key}`,
          title: decodeHtmlEntities(titleRaw) || `פרק ${episodes.length + 1}`,
          author: author ? decodeHtmlEntities(author) : undefined,
          date: cleanDate,
          link: link ? link.replace(/\\\//g, '/') : undefined,
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

  // 3. Sort episodes chronologically ascending so Episode 1 is ALWAYS at the top (index 0)
  if (episodes.length > 1) {
    const parsedWithNums = episodes.map((ep) => ({
      ep,
      num: getEpisodeNumber(ep.title),
      time: parseDateToTime(ep.date),
    }));

    const hasNums =
      parsedWithNums.filter((p) => p.num !== null).length >= Math.ceil(episodes.length * 0.4);

    if (hasNums) {
      parsedWithNums.sort((a, b) => {
        if (a.num !== null && b.num !== null) return a.num - b.num;
        if (a.num !== null) return -1;
        if (b.num !== null) return 1;
        return a.time - b.time;
      });
      return parsedWithNums.map((p) => p.ep);
    } else {
      parsedWithNums.sort((a, b) => a.time - b.time);
      return parsedWithNums.map((p) => p.ep);
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
      const imageUrl = extractFeaturedImage(post);

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
            const imageUrl = extractFeaturedImage(post);
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
  const imageUrl = extractFeaturedImage(post);

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

let memoryCatalogIndex: Podcast[] = [];
let isCatalogSyncing = false;

/**
 * Initializes and retrieves the local podcast catalog index.
 * Instant 0ms load from memory or disk, followed by background synchronization.
 */
export async function getOrLoadCatalogIndex(): Promise<Podcast[]> {
  if (memoryCatalogIndex.length > 0) {
    return memoryCatalogIndex;
  }

  try {
    const diskData = await AsyncStorage.getItem(CACHE_KEYS.CATALOG_INDEX);
    if (diskData) {
      memoryCatalogIndex = JSON.parse(diskData);
    }
  } catch (e) {
    console.warn('Error reading catalog index from storage', e);
  }

  // Trigger non-blocking background sync
  syncCatalogIndexInBackground().catch(() => {});

  return memoryCatalogIndex;
}

function extractFeaturedImage(post: any): string {
  return (
    post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
    post.featured_media_src_url ||
    'https://podcastim.org.il/wp-content/uploads/2023/04/אפליקציית-פודקאסטים-בעברית-אייקון-קטן.jpg'
  );
}

/**
 * Sorts a list of podcasts by date, rating, or Hebrew name
 */
export function sortPodcasts(list: Podcast[], sort: PodcastSortOption = 'date'): Podcast[] {
  const copy = [...list];
  if (sort === 'rating') {
    return copy.sort((a, b) => {
      const diff = (b.rating || 0) - (a.rating || 0);
      if (diff !== 0) return diff;
      return (b.ratingCount || 0) - (a.ratingCount || 0);
    });
  }
  if (sort === 'name') {
    return copy.sort((a, b) => a.title.localeCompare(b.title, 'he'));
  }
  // 'date' (latest first)
  return copy.sort((a, b) => {
    const timeA = new Date(a.date || 0).getTime();
    const timeB = new Date(b.date || 0).getTime();
    if (timeA !== timeB) return timeB - timeA;
    return b.id - a.id;
  });
}

/**
 * Syncs recent podcasts and kids catalog in the background.
 */
export async function syncCatalogIndexInBackground(): Promise<void> {
  if (isCatalogSyncing) return;
  isCatalogSyncing = true;

  try {
    // 1. Fetch all kids podcasts (99 items) with _links and _embedded to retrieve featured media images
    const kidsUrl = `${BASE_URL}/posts?categories=${KIDS_CATEGORY_ID}&per_page=100&_embed=wp:featuredmedia&_fields=id,title,slug,link,categories,excerpt,date,_links,_embedded,content`;
    const resKids = await fetch(kidsUrl);
    if (resKids.ok) {
      const kidsPosts = await resKids.json();
      if (Array.isArray(kidsPosts)) {
        const parsedKids: Podcast[] = kidsPosts.map((post: any) => {
          const title = decodeHtmlEntities(post.title?.rendered || '');
          const imageUrl = extractFeaturedImage(post);
          const rawContent = post.content?.rendered || '';
          const { rating, ratingCount } = parseRatingsFromContent(rawContent);

          return {
            id: post.id,
            title,
            slug: post.slug,
            link: post.link,
            imageUrl,
            categories: post.categories || [KIDS_CATEGORY_ID],
            excerpt: decodeHtmlEntities(post.excerpt?.rendered || ''),
            episodeCount: 0,
            episodes: [],
            isKidFriendly: true,
            date: post.date,
            rating,
            ratingCount,
          };
        });

        const existingMap = new Map<number, Podcast>();
        for (const item of memoryCatalogIndex) {
          existingMap.set(item.id, item);
        }
        for (const item of parsedKids) {
          existingMap.set(item.id, item);
        }
        memoryCatalogIndex = Array.from(existingMap.values());
        await AsyncStorage.setItem(CACHE_KEYS.CATALOG_INDEX, JSON.stringify(memoryCatalogIndex));
        await AsyncStorage.setItem(CACHE_KEYS.KIDS_PODCASTS, JSON.stringify(parsedKids));
      }
    }

    // 2. Fetch top 100 recent podcasts for general catalog index
    const allUrl = `${BASE_URL}/posts?per_page=100&_embed=wp:featuredmedia&_fields=id,title,slug,link,categories,excerpt,date,_links,_embedded,content`;
    const resAll = await fetch(allUrl);
    if (resAll.ok) {
      const allPosts = await resAll.json();
      if (Array.isArray(allPosts)) {
        const parsedAll: Podcast[] = allPosts.map((post: any) => {
          const title = decodeHtmlEntities(post.title?.rendered || '');
          const imageUrl = extractFeaturedImage(post);
          const rawContent = post.content?.rendered || '';
          const { rating, ratingCount } = parseRatingsFromContent(rawContent);
          const isKidFriendly = Array.isArray(post.categories) && post.categories.includes(KIDS_CATEGORY_ID);

          return {
            id: post.id,
            title,
            slug: post.slug,
            link: post.link,
            imageUrl,
            categories: post.categories || [],
            excerpt: decodeHtmlEntities(post.excerpt?.rendered || ''),
            episodeCount: 0,
            episodes: [],
            isKidFriendly,
            date: post.date,
            rating,
            ratingCount,
          };
        });

        const existingMap = new Map<number, Podcast>();
        for (const item of memoryCatalogIndex) {
          existingMap.set(item.id, item);
        }
        for (const item of parsedAll) {
          existingMap.set(item.id, item);
        }
        memoryCatalogIndex = Array.from(existingMap.values());
        await AsyncStorage.setItem(CACHE_KEYS.CATALOG_INDEX, JSON.stringify(memoryCatalogIndex));
      }
    }
  } catch (e) {
    console.warn('Background catalog sync error:', e);
  } finally {
    isCatalogSyncing = false;
  }
}

/**
 * Instant local search with fast substring and topic matching
 */
export async function searchPodcastsFast(params: {
  query: string;
  isKids?: boolean;
  categoryId?: number;
  sort?: PodcastSortOption;
}): Promise<Podcast[]> {
  const { query, isKids, categoryId, sort } = params;
  const catalog = await getOrLoadCatalogIndex();

  const cleanQuery = query.trim().toLowerCase();
  let results: Podcast[];

  if (!cleanQuery && !categoryId) {
    results = isKids ? catalog.filter((p) => p.isKidFriendly) : catalog.slice(0, 30);
  } else {
    results = catalog.filter((podcast) => {
      if (isKids && !podcast.isKidFriendly && !podcast.categories.includes(KIDS_CATEGORY_ID)) {
        return false;
      }
      if (categoryId && !podcast.categories.includes(categoryId)) {
        return false;
      }
      if (!cleanQuery) return true;

      const titleMatch = podcast.title.toLowerCase().includes(cleanQuery);
      const excerptMatch = podcast.excerpt?.toLowerCase().includes(cleanQuery);
      return titleMatch || excerptMatch;
    });
  }

  if (sort) {
    return sortPodcasts(results, sort);
  }
  return results;
}

