import { useState } from 'react';
import AppHeader from './components/AppHeader.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import HomeView from './components/HomeView.jsx';
import ArtistReveal from './components/ArtistReveal.jsx';
import AlbumView from './components/AlbumView.jsx';
import {
  getNewestAlbum,
  getRandomAlbum,
  getRandomArtist,
  searchArtists,
} from './services/musicService.js';

const initialSettings = {
  includeEps: true,
  includeLiveAlbums: false,
};

export default function App() {
  const [view, setView] = useState('home');
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState(initialSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function resetHome() {
    setView('home');
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setError('');
  }

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  async function handleSearch(event) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const matches = await searchArtists(query);
      const artist = matches[0];

      if (!artist) {
        setError('No matching artist was found in the mock catalog.');
        return;
      }

      const album = await getNewestAlbum(artist, settings);

      if (!album) {
        setError('That artist has no albums matching the current settings.');
        return;
      }

      setSelectedArtist(artist);
      setSelectedAlbum(album);
      setView('album');
    } finally {
      setBusy(false);
    }
  }

  async function handleSurprise() {
    setBusy(true);
    setError('');

    try {
      const artist = await getRandomArtist();
      setSelectedArtist(artist);
      setSelectedAlbum(null);
      setView('artist');
    } finally {
      setBusy(false);
    }
  }

  async function chooseRandomAlbum() {
    if (!selectedArtist) return;

    setBusy(true);
    setError('');

    try {
      const album = await getRandomAlbum(selectedArtist, settings);

      if (!album) {
        setError('This artist has no albums matching the current settings.');
        setView('home');
        return;
      }

      setSelectedAlbum(album);
      setView('album');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-root">
      <AppHeader onHome={resetHome} onOpenSettings={() => setSettingsOpen(true)} />

      {view === 'home' && (
        <HomeView
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onSurprise={handleSurprise}
          busy={busy}
          error={error}
        />
      )}

      {view === 'artist' && selectedArtist && (
        <ArtistReveal
          artist={selectedArtist}
          onTryAgain={handleSurprise}
          onContinue={chooseRandomAlbum}
          busy={busy}
        />
      )}

      {view === 'album' && selectedArtist && selectedAlbum && (
        <AlbumView
          artist={selectedArtist}
          album={selectedAlbum}
          onShuffleAgain={chooseRandomAlbum}
          busy={busy}
        />
      )}

      <SettingsModal
        show={settingsOpen}
        settings={settings}
        onChange={updateSetting}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
