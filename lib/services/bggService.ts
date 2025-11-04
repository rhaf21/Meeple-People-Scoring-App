import { parseStringPromise } from 'xml2js';

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';

export interface BGGSearchResult {
  id: number;
  name: string;
  yearPublished?: number;
  type: string;
}

export interface BGGGameDetails {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playingTime?: number;
  minPlaytime?: number;
  maxPlaytime?: number;
  minAge?: number;
  designers: string[];
  artists: string[];
  publishers: string[];
  categories: string[];
  mechanics: string[];
  rating?: number;
  averageWeight?: number;
  bggUrl: string;
}

/**
 * Search for board games on BGG
 */
export async function searchBGG(query: string): Promise<BGGSearchResult[]> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${BGG_API_BASE}/search?query=${encodedQuery}&type=boardgame`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`);
    }

    const xmlData = await response.text();
    const result = await parseStringPromise(xmlData);

    if (!result.items || !result.items.item) {
      return [];
    }

    const items = Array.isArray(result.items.item) ? result.items.item : [result.items.item];

    return items.map((item: any) => ({
      id: parseInt(item.$.id),
      name: item.name[0].$.value,
      yearPublished: item.yearpublished ? parseInt(item.yearpublished[0].$.value) : undefined,
      type: item.$.type,
    }));
  } catch (error) {
    console.error('Error searching BGG:', error);
    throw new Error('Failed to search BoardGameGeek');
  }
}

/**
 * Get detailed information about a specific game from BGG
 */
export async function getBGGGameDetails(bggId: number): Promise<BGGGameDetails> {
  try {
    const url = `${BGG_API_BASE}/thing?id=${bggId}&stats=1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`BGG API error: ${response.status}`);
    }

    const xmlData = await response.text();
    const result = await parseStringPromise(xmlData);

    if (!result.items || !result.items.item || result.items.item.length === 0) {
      throw new Error('Game not found on BGG');
    }

    const item = result.items.item[0];

    // Helper to get first value from array
    const getFirst = (arr: any[]): string | undefined => {
      return arr && arr.length > 0 ? arr[0] : undefined;
    };

    // Helper to get primary name
    const getPrimaryName = (names: any[]): string => {
      const primaryName = names.find((n: any) => n.$.type === 'primary');
      return primaryName ? primaryName.$.value : names[0].$.value;
    };

    // Helper to extract values from link items
    const extractLinks = (links: any[], type: string): string[] => {
      if (!links) return [];
      return links
        .filter((link: any) => link.$.type === type)
        .map((link: any) => link.$.value);
    };

    // Parse description and remove HTML tags
    const description = item.description ? item.description[0].replace(/<[^>]*>/g, '').trim() : '';

    // Parse stats
    const stats = item.statistics?.[0]?.ratings?.[0];
    const rating = stats?.average?.[0]?.$.value ? parseFloat(stats.average[0].$.value) : undefined;
    const averageWeight = stats?.averageweight?.[0]?.$.value ? parseFloat(stats.averageweight[0].$.value) : undefined;

    const yearPublished = item.yearpublished?.[0] ? parseInt(item.yearpublished[0]) : undefined;
    const minPlayers = item.minplayers?.[0]?.$?.value ? parseInt(item.minplayers[0].$.value) : undefined;
    const maxPlayers = item.maxplayers?.[0]?.$?.value ? parseInt(item.maxplayers[0].$.value) : undefined;
    const playingTime = item.playingtime?.[0]?.$?.value ? parseInt(item.playingtime[0].$.value) : undefined;
    const minPlaytime = item.minplaytime?.[0]?.$?.value ? parseInt(item.minplaytime[0].$.value) : undefined;
    const maxPlaytime = item.maxplaytime?.[0]?.$?.value ? parseInt(item.maxplaytime[0].$.value) : undefined;
    const minAge = item.minage?.[0]?.$?.value ? parseInt(item.minage[0].$.value) : undefined;

    return {
      id: parseInt(item.$.id),
      name: getPrimaryName(item.name),
      description,
      imageUrl: getFirst(item.image),
      thumbnailUrl: getFirst(item.thumbnail),
      yearPublished,
      minPlayers,
      maxPlayers,
      playingTime,
      minPlaytime,
      maxPlaytime,
      minAge,
      designers: extractLinks(item.link, 'boardgamedesigner'),
      artists: extractLinks(item.link, 'boardgameartist'),
      publishers: extractLinks(item.link, 'boardgamepublisher'),
      categories: extractLinks(item.link, 'boardgamecategory'),
      mechanics: extractLinks(item.link, 'boardgamemechanic'),
      rating,
      averageWeight,
      bggUrl: `https://boardgamegeek.com/boardgame/${bggId}`,
    };
  } catch (error) {
    console.error('Error fetching BGG game details:', error);
    throw new Error('Failed to fetch game details from BoardGameGeek');
  }
}

/**
 * Rate-limited search with retry logic
 * BGG API has rate limits, so we implement basic retry logic
 */
export async function searchBGGWithRetry(query: string, maxRetries = 3): Promise<BGGSearchResult[]> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await searchBGG(query);
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to search BGG after retries');
}

/**
 * Get game details with retry logic
 */
export async function getBGGGameDetailsWithRetry(bggId: number, maxRetries = 3): Promise<BGGGameDetails> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await getBGGGameDetails(bggId);
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to fetch BGG game details after retries');
}
