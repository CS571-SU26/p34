import { mockArtists } from '../data/mockMusic.js';

const wait = (milliseconds = 250) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function filterAlbums(albums, settings) {
  return albums.filter((album) => {
    if (!settings.includeEps && album.type === 'ep') return false;
    if (!settings.includeLiveAlbums && album.type === 'live') return false;
    return true;
  });
}

export async function searchArtists(query) {
  await wait();
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) return [];

  return mockArtists.filter((artist) =>
    artist.name.toLowerCase().includes(normalizedQuery),
  );
}

export async function getNewestAlbum(artist, settings) {
  await wait();
  const eligibleAlbums = filterAlbums(artist.albums, settings);

  return [...eligibleAlbums].sort(
    (left, right) => new Date(right.releaseDate) - new Date(left.releaseDate),
  )[0] ?? null;
}

export async function getRandomArtist() {
  await wait();
  const index = Math.floor(Math.random() * mockArtists.length);
  return mockArtists[index];
}

export async function getRandomAlbum(artist, settings) {
  await wait();
  const eligibleAlbums = filterAlbums(artist.albums, settings);

  if (eligibleAlbums.length === 0) return null;

  const index = Math.floor(Math.random() * eligibleAlbums.length);
  return eligibleAlbums[index];
}

// Integration anchor: replace these mock functions with a TIDAL-backed
// implementation while preserving their inputs and return shapes.
