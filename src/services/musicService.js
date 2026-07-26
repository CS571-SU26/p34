import { mockArtists } from '../data/mockMusic.js';

const wait = (milliseconds = 250) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const CACHE_KEY = 'tidal-wave-round-robin-v1';

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

  // Refill only after every currently eligible option has been used.
  if (queue.length === 0) {
    queue = shuffle(availableIds);
  }

  const nextId = queue.shift();
  cache[cacheId] = queue;
  writeCache(cache);
  return nextId;
}

function filterAlbums(albums, settings) {
  return albums.filter((album) => {
    if (!settings.includeEps && album.type === 'ep') return false;
    if (!settings.includeLiveAlbums && album.type === 'live') return false;
    return true;
  });
}

function assertMockSource(dataSource) {
  if (dataSource === 'tidal') {
    throw new Error(
      'Real TIDAL data is not connected yet. Switch Data source back to Mock data.',
    );
  }
}

export async function searchArtists(query, dataSource = 'mock') {
  await wait();
  assertMockSource(dataSource);
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return [];

  return mockArtists.filter((artist) =>
    artist.name.toLowerCase().includes(normalizedQuery),
  );
}

export async function getNewestAlbum(artist, settings, dataSource = 'mock') {
  await wait();
  assertMockSource(dataSource);
  const eligibleAlbums = filterAlbums(artist.albums, settings);

  return [...eligibleAlbums].sort(
    (left, right) => new Date(right.releaseDate) - new Date(left.releaseDate),
  )[0] ?? null;
}

export async function getNextArtist(dataSource = 'mock') {
  await wait();
  assertMockSource(dataSource);
  const nextId = takeNext(
    'artists',
    mockArtists.map((artist) => artist.id),
  );

  return mockArtists.find((artist) => artist.id === nextId) ?? null;
}

export async function getNextAlbum(artist, settings, dataSource = 'mock') {
  await wait();
  assertMockSource(dataSource);
  const eligibleAlbums = filterAlbums(artist.albums, settings);
  const settingsKey = `${settings.includeEps}-${settings.includeLiveAlbums}`;
  const nextId = takeNext(
    `albums:${artist.id}:${settingsKey}`,
    eligibleAlbums.map((album) => album.id),
  );

  return eligibleAlbums.find((album) => album.id === nextId) ?? null;
}

export function clearSelectionCache() {
  window.sessionStorage.removeItem(CACHE_KEY);
}

// Integration anchor: add a TIDAL-backed provider here while preserving the
// normalized artist and album shapes consumed by the React components.
