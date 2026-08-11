import { mockArtists } from '../data/mockMusic.js';
import { getAccessToken } from './authService.js';

const API_ROOT = 'https://openapi.tidal.com/v2';
const CACHE_KEY = 'tidal-wave-round-robin-v1';
const FOLLOWED_ARTISTS_STORAGE_KEY = 'tidal-wave-followed-artists-v1';
const PLACEHOLDER_ART = `${import.meta.env.BASE_URL}covers/tidal-placeholder.svg`;
const wait = (milliseconds = 250) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

let followedArtistsCache = null;
let followedArtistsPromise = null;
let lastRateLimitWait = 0;
const followedArtistsProgressListeners = new Set();
const albumsByArtistCache = new Map();
const artworkUrlCache = new Map();
const albumTracksCache = new Map();

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function readCache() {
  try {
    return JSON.parse(window.sessionStorage.getItem(CACHE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function readFollowedArtistsStorage() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(FOLLOWED_ARTISTS_STORAGE_KEY));
    return Array.isArray(stored) ? stored : null;
  } catch {
    return null;
  }
}

function writeFollowedArtistsStorage(artists) {
  try {
    window.sessionStorage.setItem(FOLLOWED_ARTISTS_STORAGE_KEY, JSON.stringify(artists));
  } catch (storageError) {
    // sessionStorage can be unavailable (e.g. private browsing quota); the
    // in-memory cache still works for the rest of the session either way, so
    // this is intentionally non-fatal. Still log it so it's not silently lost.
    console.warn('Could not persist followed artists to sessionStorage:', storageError);
  }
}

function drawFromQueue(queue, excludeId) {
  const nextId = queue.shift();
  // Defer the excluded id to the back of the queue rather than dropping it,
  // so the round-robin order still cycles through it on a later turn.
  if (excludeId != null && nextId === excludeId && queue.length > 0) {
    queue.push(nextId);
    return queue.shift();
  }
  return nextId;
}

function takeNext(cacheId, availableIds, excludeId = null) {
  if (availableIds.length === 0) return null;
  const cache = readCache();
  const validIds = new Set(availableIds);
  let queue = Array.isArray(cache[cacheId])
    ? cache[cacheId].filter((id) => validIds.has(id))
    : [];
  if (queue.length === 0) queue = shuffle(availableIds);

  let nextId = drawFromQueue(queue, excludeId);
  if (nextId === excludeId && queue.length === 0 && availableIds.length > 1) {
    // The excluded id was the only item left this round; start a fresh round
    // so there's something else available to offer instead.
    queue = shuffle(availableIds);
    nextId = drawFromQueue(queue, excludeId);
  }

  cache[cacheId] = queue;
  writeCache(cache);
  return nextId;
}

function normalizeSearchText(value) {
  return value.normalize('NFKC').toLocaleLowerCase();
}

function isLiveTitle(title) {
  // Unfortunately, Tidal doesn't have a flag in their API for live albums.
  //This isn't perfect; some artists like to get clever and call their live albums something like "Alive" (thanks, Daft Punk) and the filter will miss those.
  return /\blive\b/i.test(title ?? '');
}

function filterAlbums(albums, settings) {
  return albums.filter((album) => {
    // TIDAL identifies singles explicitly in both attributes.type and
    // attributes.albumType; normalizeAlbum maps that to album.type.
    if (album.type === 'single' && !settings.includeSingles) return false;
    if (album.type === 'ep' && !settings.includeEps) return false;
    if (!['album', 'ep', 'single'].includes(album.type)) return false;
    if (!settings.includeLiveAlbums && isLiveTitle(album.title)) return false;
    return true;
  });
}

//Handle 429s; the response will tell you how long you have to wait again to retry
function getRetryDelay(response, attempt) {
  const retryAfter = response.headers.get('Retry-After');

  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.max(0, retryAt - Date.now());
  }

  return Math.min(1000 * 2 ** attempt, 30_000) + Math.random() * 250;
}

async function tidalFetch(path, attempt = 0) {
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${API_ROOT}${path}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.api+json',
    },
  });

  if (response.status === 429 && attempt < 5) {
    const delay = getRetryDelay(response, attempt);
    lastRateLimitWait = delay;
    await wait(delay);
    return tidalFetch(path, attempt + 1);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TIDAL request failed (${response.status}): ${body}`);
  }
  return response.json();
}

function normalizeFollowedArtistsPage(page) {
  const artistsById = new Map(
    (page.included ?? [])
      .filter((item) => item.type === 'artists')
      .map((artist) => [artist.id, artist]),
  );

  return page.data.map((relationship) => {
    const artist = artistsById.get(relationship.id);
    return {
      id: relationship.id,
      name: artist?.attributes?.name ?? 'Unknown artist',
      addedAt: relationship.meta?.addedAt ?? null,
      popularity: artist?.attributes?.popularity ?? null,
      imageUrl: PLACEHOLDER_ART,
      source: 'tidal',
    };
  });
}

async function getFollowedArtistsTotal() {
  try {
    const response = await tidalFetch('/userCollectionArtists/me?countryCode=US');
    return response.data?.attributes?.numberOfItems ?? null;
  } catch {
    // Total is a nice-to-have for the progress message, but don't fail the load over it.
    return null;
  }
}

//Handle the paginated API response recursively (we don't know how many pages the entire response will be)
async function getFollowedArtistPages(
  url = null,
  pageNumber = 1,
  loadedCount = 0,
  total = null,
) {
  const requestUrl =
    url ??
    '/userCollectionArtists/me/relationships/items?countryCode=US&include=items';
  const page = await tidalFetch(requestUrl);
  const nextLoadedCount = loadedCount + page.data.length;
  followedArtistsProgressListeners.forEach((listener) =>
    listener({ pageNumber, loaded: nextLoadedCount, total }),
  );
  const nextUrl = page.links?.next;

  if (!nextUrl) return [page]; //We reached the end; send it

  // Keep cursor pagination sequential and avoid hammering the API.
  await wait(250);
  return [
    page,
    ...(await getFollowedArtistPages(
      nextUrl,
      pageNumber + 1,
      nextLoadedCount,
      total,
    )),
  ];
}

export async function loadFollowedArtists(onProgress = null, force = false) {
  if (onProgress) followedArtistsProgressListeners.add(onProgress);

  if (!followedArtistsCache && !force) {
    const stored = readFollowedArtistsStorage();
    if (stored) followedArtistsCache = stored;
  }

  if (followedArtistsCache && !force) {
    followedArtistsProgressListeners.delete(onProgress);
    return followedArtistsCache;
  }
  if (followedArtistsPromise && !force) {
    return followedArtistsPromise.finally(() => followedArtistsProgressListeners.delete(onProgress));
  }

  followedArtistsPromise = getFollowedArtistsTotal()
    .then((total) => getFollowedArtistPages(null, 1, 0, total))
    .then(async (pages) => {
      followedArtistsCache = pages.flatMap(normalizeFollowedArtistsPage);
      writeFollowedArtistsStorage(followedArtistsCache);
      // Give TIDAL's rate limiter the same cooldown we just had to wait out,
      // so whatever runs right after (e.g. loading the chosen artist's
      // albums) doesn't immediately land back in a 429 loop.
      if (lastRateLimitWait > 0) {
        await wait(lastRateLimitWait);
        lastRateLimitWait = 0;
      }
      return followedArtistsCache;
    })
    .catch((error) => {
      followedArtistsPromise = null;
      throw error;
    })
    .finally(() => followedArtistsProgressListeners.delete(onProgress));

  return followedArtistsPromise;
}

async function getArtworkUrl(artworkId, preferredWidth = 640) {
  if (!artworkId) return PLACEHOLDER_ART;
  if (artworkUrlCache.has(artworkId)) return artworkUrlCache.get(artworkId);

  const response = await tidalFetch(`/artworks/${artworkId}?countryCode=US`);
  const files = response.data?.attributes?.files ?? [];

  //Tidal offers a plethora of album artwork sizes; find the one that fits best
  const selected =
    files.find((file) => file.meta?.width === preferredWidth) ??
    [...files].sort(
      (a, b) =>
        Math.abs((a.meta?.width ?? 0) - preferredWidth) -
        Math.abs((b.meta?.width ?? 0) - preferredWidth),
    )[0];
  const url = selected?.href ?? PLACEHOLDER_ART;
  artworkUrlCache.set(artworkId, url);
  return url;
}

async function hydrateArtist(artist) {
  if (artist.source !== 'tidal') return artist;
  const response = await tidalFetch(
    `/artists/${artist.id}?countryCode=US&include=profileArt`,
  );
  const profileArtId = response.data?.relationships?.profileArt?.data?.[0]?.id;
  return { ...artist, imageUrl: await getArtworkUrl(profileArtId, 640) };
}

function normalizeAlbum(resource) {
  const albumType = resource.attributes?.albumType ?? resource.attributes?.type;
  return {
    id: resource.id,
    title: resource.attributes?.title ?? 'Untitled album',
    releaseDate: resource.attributes?.releaseDate ?? null,
    type: String(albumType ?? 'album').toLocaleLowerCase(),
    artworkId: resource.relationships?.coverArt?.data?.[0]?.id ?? null,
    artworkUrl: PLACEHOLDER_ART,
    tidalUrl: `https://tidal.com/album/${resource.id}`,
    tracks: [],
    numberOfItems: resource.attributes?.numberOfItems ?? null,
    source: 'tidal',
  };
}

//Handle the paginated API response recursively (we don't know how many pages the entire response will be)
async function getArtistAlbumPages(artistId, url = null) {
  const requestUrl =
    url ??
    `/artists/${artistId}/relationships/albums?countryCode=US&include=albums`;
  const page = await tidalFetch(requestUrl);
  const nextUrl = page.links?.next;
  return nextUrl
    ? [page, ...(await getArtistAlbumPages(artistId, nextUrl))]
    : [page];
}

async function loadArtistAlbums(artistId) {
  if (albumsByArtistCache.has(artistId)) return albumsByArtistCache.get(artistId);
  const pages = await getArtistAlbumPages(artistId);
  const albums = pages
    .flatMap((page) => page.included ?? [])
    .filter((resource) => resource.type === 'albums')
    .map(normalizeAlbum);
  const uniqueAlbums = [...new Map(albums.map((album) => [album.id, album])).values()];
  albumsByArtistCache.set(artistId, uniqueAlbums);
  return uniqueAlbums;
}

async function hydrateAlbumArtwork(album) {
  if (album.source !== 'tidal') return album;
  // The artist relationship endpoint only supports `include=albums`, so albums
  // sourced that way never carry coverArt. Re-fetch the single album with
  // include=coverArt, the same pattern hydrateArtist uses for profileArt.
  const response = await tidalFetch(
    `/albums/${album.id}?countryCode=US&include=coverArt`,
  );
  const artworkId = response.data?.relationships?.coverArt?.data?.[0]?.id ?? null;
  return { ...album, artworkId, artworkUrl: await getArtworkUrl(artworkId, 640) };
}

//Handle the paginated API response recursively (we don't know how many pages the entire response will be)
async function getAlbumTrackPages(albumId, url = null) {
  const requestUrl =
    url ??
    `/albums/${albumId}/relationships/items?countryCode=US&include=items`;
  const page = await tidalFetch(requestUrl);
  const nextUrl = page.links?.next;
  return nextUrl
    ? [page, ...(await getAlbumTrackPages(albumId, nextUrl))]
    : [page];
}

async function loadAlbumTracks(albumId) {
  if (albumTracksCache.has(albumId)) return albumTracksCache.get(albumId);

  const pages = await getAlbumTrackPages(albumId);
  const trackTitlesById = new Map(
    pages
      .flatMap((page) => page.included ?? [])
      .filter((resource) => resource.type === 'tracks')
      .map((resource) => [resource.id, resource.attributes?.title]),
  );
  const tracks = pages
    .flatMap((page) => page.data ?? [])
    .filter((item) => item.type === 'tracks')
    .sort((a, b) =>
      (a.meta?.volumeNumber ?? 0) - (b.meta?.volumeNumber ?? 0) ||
      (a.meta?.trackNumber ?? 0) - (b.meta?.trackNumber ?? 0),
    )
    .map((item) => trackTitlesById.get(item.id))
    .filter(Boolean);

  albumTracksCache.set(albumId, tracks);
  return tracks;
}

async function hydrateAlbum(album) {
  const [withArtwork, tracks] = await Promise.all([
    hydrateAlbumArtwork(album),
    album.source === 'tidal' ? loadAlbumTracks(album.id) : Promise.resolve(album.tracks),
  ]);
  return { ...withArtwork, tracks };
}

export async function searchArtists(query, dataSource = 'mock') {
  if (dataSource === 'mock') {
    await wait();
    const normalizedQuery = normalizeSearchText(query.trim());
    return mockArtists.filter((artist) =>
      normalizeSearchText(artist.name).includes(normalizedQuery),
    );
  }

  const artists = await loadFollowedArtists();
  const normalizedQuery = normalizeSearchText(query.trim());
  return artists.filter((artist) =>
    normalizeSearchText(artist.name).includes(normalizedQuery),
  );
}

//Show up to 8 artist suggestions as the user types the name
export async function getArtistSuggestions(query, dataSource = 'mock', limit = 8) {
  if (!query.trim()) return [];
  const artists = dataSource === 'mock' ? mockArtists : await loadFollowedArtists();
  const searchTerm = normalizeSearchText(query.trim());
  return artists
    .map((artist) => {
      const name = normalizeSearchText(artist.name);
      if (name.startsWith(searchTerm)) return { artist, rank: 0 };
      if (name.includes(searchTerm)) return { artist, rank: 1 };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || a.artist.name.localeCompare(b.artist.name))
    .slice(0, limit)
    .map(({ artist }) => artist);
}

export async function getNewestAlbum(artist, settings, dataSource = 'mock') {
  const albums = dataSource === 'mock' ? artist.albums : await loadArtistAlbums(artist.id);
  const eligible = filterAlbums(albums, settings);
  const album = [...eligible].sort(
    (left, right) => new Date(right.releaseDate) - new Date(left.releaseDate),
  )[0];
  return album ? hydrateAlbum(album) : null;
}

export async function getNextArtist(dataSource = 'mock') {
  if (dataSource === 'mock') await wait(); // Simulate mock latency so mock mode's timing/UX matches a real Tidal fetch.
  const artists = dataSource === 'mock' ? mockArtists : await loadFollowedArtists();
  const nextId = takeNext(`artists:${dataSource}`, artists.map((artist) => artist.id));
  const artist = artists.find((candidate) => candidate.id === nextId) ?? null;
  return artist ? hydrateArtist(artist) : null;
}

export async function getNextAlbum(artist, settings, dataSource = 'mock', currentAlbumId = null) {
  if (dataSource === 'mock') await wait(); // Simulate mock latency so mock mode's timing/UX matches a real Tidal fetch.
  const albums = dataSource === 'mock' ? artist.albums : await loadArtistAlbums(artist.id);
  const eligible = filterAlbums(albums, settings);
  const settingsKey = `${settings.includeEps}-${settings.includeSingles}-${settings.includeLiveAlbums}`;
  const nextId = takeNext(
    `albums:${dataSource}:${artist.id}:${settingsKey}`,
    eligible.map((album) => album.id),
    currentAlbumId,
  );
  const album = eligible.find((candidate) => candidate.id === nextId) ?? null;
  return album ? hydrateAlbum(album) : null;
}

export async function hydrateSelectedArtist(artist) {
  return hydrateArtist(artist);
}

export function clearSelectionCache() {
  window.sessionStorage.removeItem(CACHE_KEY);
}

export function clearTidalDataCache() {
  followedArtistsCache = null;
  followedArtistsPromise = null;
  albumsByArtistCache.clear();
  artworkUrlCache.clear();
  albumTracksCache.clear();
  window.sessionStorage.removeItem(FOLLOWED_ARTISTS_STORAGE_KEY);
}
