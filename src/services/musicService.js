import { mockArtists } from '../data/mockMusic.js';
import { getAccessToken } from './authService.js';

const API_ROOT = 'https://openapi.tidal.com/v2';
const CACHE_KEY = 'tidal-wave-round-robin-v1';
const PLACEHOLDER_ART = `${import.meta.env.BASE_URL}covers/tidal-placeholder.svg`;
const wait = (milliseconds = 250) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

let followedArtistsCache = null;
let followedArtistsPromise = null;
const albumsByArtistCache = new Map();
const artworkUrlCache = new Map();

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

function takeNext(cacheId, availableIds) {
  if (availableIds.length === 0) return null;
  const cache = readCache();
  const validIds = new Set(availableIds);
  let queue = Array.isArray(cache[cacheId])
    ? cache[cacheId].filter((id) => validIds.has(id))
    : [];
  if (queue.length === 0) queue = shuffle(availableIds);
  const nextId = queue.shift();
  cache[cacheId] = queue;
  writeCache(cache);
  return nextId;
}

function normalizeSearchText(value) {
  return value.normalize('NFKC').toLocaleLowerCase();
}

function isLiveTitle(title) {
  return /\blive\b/i.test(title ?? '');
}

function filterAlbums(albums, settings) {
  return albums.filter((album) => {
    // Singles are never eligible. TIDAL identifies them explicitly in both
    // attributes.type and attributes.albumType; normalizeAlbum maps that to album.type.
    if (album.type === 'single') return false;
    if (album.type === 'ep' && !settings.includeEps) return false;
    if (!['album', 'ep'].includes(album.type)) return false;
    if (!settings.includeLiveAlbums && isLiveTitle(album.title)) return false;
    return true;
  });
}

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
    await wait(getRetryDelay(response, attempt));
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

async function getFollowedArtistPages(
  url = null,
  onProgress = null,
  pageNumber = 1,
  loadedCount = 0,
) {
  const requestUrl =
    url ??
    '/userCollectionArtists/me/relationships/items?countryCode=US&include=items';
  const page = await tidalFetch(requestUrl);
  const nextLoadedCount = loadedCount + page.data.length;
  onProgress?.({ pageNumber, loaded: nextLoadedCount });
  const nextUrl = page.links?.next;

  if (!nextUrl) return [page];

  // Keep cursor pagination sequential and avoid hammering the API.
  await wait(250);
  return [
    page,
    ...(await getFollowedArtistPages(
      nextUrl,
      onProgress,
      pageNumber + 1,
      nextLoadedCount,
    )),
  ];
}

export async function loadFollowedArtists(onProgress = null, force = false) {
  if (followedArtistsCache && !force) return followedArtistsCache;
  if (followedArtistsPromise && !force) return followedArtistsPromise;

  followedArtistsPromise = getFollowedArtistPages(null, onProgress)
    .then((pages) => {
      followedArtistsCache = pages.flatMap(normalizeFollowedArtistsPage);
      return followedArtistsCache;
    })
    .catch((error) => {
      followedArtistsPromise = null;
      throw error;
    });

  return followedArtistsPromise;
}

async function getArtworkUrl(artworkId, preferredWidth = 640) {
  if (!artworkId) return PLACEHOLDER_ART;
  if (artworkUrlCache.has(artworkId)) return artworkUrlCache.get(artworkId);

  const response = await tidalFetch(`/artworks/${artworkId}?countryCode=US`);
  const files = response.data?.attributes?.files ?? [];
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
  return { ...album, artworkUrl: await getArtworkUrl(album.artworkId, 640) };
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

export async function getArtistSuggestions(query, dataSource = 'mock', limit = 8) {
  if (!query.trim()) return [];
  const artists = dataSource === 'mock' ? mockArtists : await loadFollowedArtists();
  const needle = normalizeSearchText(query.trim());
  return artists
    .map((artist) => {
      const name = normalizeSearchText(artist.name);
      if (name.startsWith(needle)) return { artist, rank: 0 };
      if (name.includes(needle)) return { artist, rank: 1 };
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
  return album ? hydrateAlbumArtwork(album) : null;
}

export async function getNextArtist(dataSource = 'mock') {
  if (dataSource === 'mock') await wait();
  const artists = dataSource === 'mock' ? mockArtists : await loadFollowedArtists();
  const nextId = takeNext(`artists:${dataSource}`, artists.map((artist) => artist.id));
  const artist = artists.find((candidate) => candidate.id === nextId) ?? null;
  return artist ? hydrateArtist(artist) : null;
}

export async function getNextAlbum(artist, settings, dataSource = 'mock') {
  if (dataSource === 'mock') await wait();
  const albums = dataSource === 'mock' ? artist.albums : await loadArtistAlbums(artist.id);
  const eligible = filterAlbums(albums, settings);
  const settingsKey = `${settings.includeEps}-${settings.includeLiveAlbums}`;
  const nextId = takeNext(
    `albums:${dataSource}:${artist.id}:${settingsKey}`,
    eligible.map((album) => album.id),
  );
  const album = eligible.find((candidate) => candidate.id === nextId) ?? null;
  return album ? hydrateAlbumArtwork(album) : null;
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
}
