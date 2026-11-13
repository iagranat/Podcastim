/**
 * Intercepts incoming deep links (Android App Links, iOS Universal Links, custom scheme)
 * from https://podcastim.org.il and maps them to internal Expo Router paths.
 */
export function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    if (!path) return '/';

    let clean = path;

    // Handle custom podcastim:// scheme
    if (clean.startsWith('podcastim://')) {
      let afterScheme = clean.slice('podcastim://'.length);
      if (!afterScheme.startsWith('/')) {
        afterScheme = `/${afterScheme}`;
      }
      clean = afterScheme;
    } else if (clean.includes('://')) {
      // Handle full web URLs e.g. https://podcastim.org.il/... or https://www.podcastim.org.il/...
      const idx = clean.indexOf('://');
      const rest = clean.substring(idx + 3);
      const slashIdx = rest.indexOf('/');
      if (slashIdx === -1) {
        clean = '/';
      } else {
        clean = rest.substring(slashIdx);
      }
    }

    // Split path into pathname and query string
    const [pathname, search] = clean.split('?');
    const searchSuffix = search ? `?${search}` : '';

    const segments = pathname.split('/').filter(Boolean);

    // Root URL e.g. "https://podcastim.org.il/"
    if (segments.length === 0) {
      if (search) {
        const params = new URLSearchParams(search);
        // If query is ?p=<podcast_id> (WordPress post ID permalink)
        const pId = params.get('p');
        if (pId) {
          return `/podcast/${pId}${searchSuffix}`;
        }
        // If query is ?s=<search_query> (WordPress site search)
        const sQuery = params.get('s');
        if (sQuery) {
          return `/(tabs)/search?q=${encodeURIComponent(sQuery)}`;
        }
      }
      return '/';
    }

    const firstSegment = segments[0];

    // Already an internal route
    if (firstSegment === 'podcast') {
      return clean;
    }
    if (firstSegment === '(tabs)') {
      return clean;
    }
    if (['search', 'favorites', 'settings'].includes(firstSegment)) {
      return `/(tabs)/${firstSegment}${searchSuffix}`;
    }

    // If query has ?p=<id>
    if (search) {
      const params = new URLSearchParams(search);
      const pId = params.get('p');
      if (pId) {
        return `/podcast/${pId}${searchSuffix}`;
      }
      const sQuery = params.get('s');
      if (sQuery) {
        return `/(tabs)/search?q=${encodeURIComponent(sQuery)}`;
      }
    }

    // Default: map podcast slug from podcastim.org.il/<slug>/ to /podcast/<slug>
    return `/podcast/${firstSegment}${searchSuffix}`;
  } catch (err) {
    console.warn('Error in redirectSystemPath:', err);
    return path;
  }
}
