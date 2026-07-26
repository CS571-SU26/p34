import { useEffect, useState } from 'react';
import AppHeader from './components/AppHeader.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import HomeView from './components/HomeView.jsx';
import ArtistReveal from './components/ArtistReveal.jsx';
import AlbumView from './components/AlbumView.jsx';
import {
  getNewestAlbum,
  getNextAlbum,
  getNextArtist,
  searchArtists,
} from './services/musicService.js';

const SETTINGS_KEY = 'tidal-wave-settings-v1';
const initialSettings = {
  includeEps: true,
  includeLiveAlbums: false,
  darkMode: true,
  dataSource: 'mock',
};

function loadSettings() {
  try {
    return {
      ...initialSettings,
      ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY)),
    };
  } catch {
    return initialSettings;
  }
}

export default function App() {
  const [view, setView] = useState('home');
  const [query, setQuery] = useState('');
  const [settings, setSettings] = useState(loadSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.dataset.bsTheme = settings.darkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light';
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  function resetHome() {
    setView('home');
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setError('');
  }

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  async function runAction(action) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
      setView('home');
    } finally {
      setBusy(false);
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    runAction(async () => {
      const matches = await searchArtists(query, settings.dataSource);
      const artist = matches[0];

      if (!artist) {
        setError('No matching artist was found in the current catalog.');
        return;
      }

      const album = await getNewestAlbum(artist, settings, settings.dataSource);
      if (!album) {
        setError('That artist has no albums matching the current settings.');
        return;
      }

      setSelectedArtist(artist);
      setSelectedAlbum(album);
      setView('album');
    });
  }

  function handleSurprise() {
    runAction(async () => {
      const artist = await getNextArtist(settings.dataSource);
      if (!artist) {
        setError('No artists are available in the current catalog.');
        return;
      }
      setSelectedArtist(artist);
      setSelectedAlbum(null);
      setView('artist');
    });
  }

  function chooseNextAlbum() {
    if (!selectedArtist) return;

    runAction(async () => {
      const album = await getNextAlbum(
        selectedArtist,
        settings,
        settings.dataSource,
      );

      if (!album) {
        setError('This artist has no albums matching the current settings.');
        return;
      }

      setSelectedAlbum(album);
      setView('album');
    });
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
          dataSource={settings.dataSource}
        />
      )}

      {view === 'artist' && selectedArtist && (
        <ArtistReveal
          artist={selectedArtist}
          onTryAgain={handleSurprise}
          onContinue={chooseNextAlbum}
          busy={busy}
        />
      )}

      {view === 'album' && selectedArtist && selectedAlbum && (
        <AlbumView
          artist={selectedArtist}
          album={selectedAlbum}
          onShuffleAgain={chooseNextAlbum}
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
