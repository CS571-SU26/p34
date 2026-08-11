//Across the whole app: why window.sessionStorage and window.localStorage instead of just sessionStorage/localStorage?

import { useEffect, useMemo, useState } from 'react';
import AppHeader from './components/AppHeader.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import HomeView from './components/HomeView.jsx';
import ArtistReveal from './components/ArtistReveal.jsx';
import AlbumView from './components/AlbumView.jsx';
import {
  getArtistSuggestions,
  getNewestAlbum,
  getNextAlbum,
  getNextArtist,
  hydrateSelectedArtist,
  loadFollowedArtists,
  searchArtists,
  clearTidalDataCache,
} from './services/musicService.js';
import {
  beginTidalLogin,
  completeTidalLoginFromUrl,
  isAuthenticated,
  logoutFromTidal,
} from './services/authService.js';

const SETTINGS_KEY = 'tidal-wave-settings-v1';
const initialSettings = {
  includeEps: true,
  includeLiveAlbums: false,
  darkMode: true,
  dataSource: 'mock',
};

function loadSettings() {
  try {
    return { ...initialSettings, ...JSON.parse(window.localStorage.getItem(SETTINGS_KEY)) };
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
  const [suggestions, setSuggestions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(isAuthenticated);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [artistsLoading, setArtistsLoading] = useState(false);
  const [error, setError] = useState('');

  const usingTidal = settings.dataSource === 'tidal';
  const tidalUrl = useMemo(() => { //Is this really that expensive that it needs to be useMemo?
    if (!usingTidal) return 'https://tidal.com/';
    if (view === 'album' && selectedAlbum) return `https://tidal.com/album/${selectedAlbum.id}`;
    if (view === 'artist' && selectedArtist) return `https://tidal.com/artist/${selectedArtist.id}`;
    return 'https://tidal.com/';
  }, [usingTidal, view, selectedArtist, selectedAlbum]);

  useEffect(() => {
    document.documentElement.dataset.bsTheme = settings.darkMode ? 'dark' : 'light';
    document.documentElement.dataset.theme = settings.darkMode ? 'dark' : 'light';
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    let active = true;
    async function finishAuth() {
      setAuthBusy(true);
      try {
        const completed = await completeTidalLoginFromUrl();
        if (active && completed) {
          setAuthenticated(true);
          setSettings((current) => ({ ...current, dataSource: 'tidal' }));
        }
      } catch (authError) {
        if (active) setError(authError.message || 'TIDAL login could not be completed.');
      } finally {
        if (active) setAuthBusy(false);
      }
    }
    finishAuth();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!usingTidal || !authenticated) return;
    let active = true;
    setArtistsLoading(true);
    setLoadingMessage('Loading your followed artists…');
    loadFollowedArtists(({ loaded, total }) => {
      if (active) {
        setLoadingMessage(
          `Loading your followed artists… ${loaded}${total ? ` of ${total}` : ''} loaded`,
        );
      }
    })
      .then((artists) => {
        if (active) setLoadingMessage(`${artists.length} followed artists ready.`);
        window.setTimeout(() => active && setLoadingMessage(''), 1600);
      })
      .catch((loadError) => active && setError(loadError.message))
      .finally(() => {
        if (active) {
          setArtistsLoading(false);
          window.setTimeout(() => setLoadingMessage(''), 1600);
        }
      });
    return () => { active = false; };
  }, [usingTidal, authenticated]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!query.trim() || (usingTidal && !authenticated)) {
        setSuggestions([]);
        return;
      }
      getArtistSuggestions(query, settings.dataSource)
        .then((items) => active && setSuggestions(items))
        .catch(() => active && setSuggestions([]));
    }, 120);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, settings.dataSource, usingTidal, authenticated]);

  function resetHome() {
    setView('home');
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setSuggestions([]);
    setError('');
  }

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
    if (name !== 'darkMode') resetHome(); //you can toggle dark mode without going back to the home screen.
  }

  async function runAction(action, message = '') {
    setBusy(true);
    setLoadingMessage(message);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message || 'Something went wrong.');
      setView('home');
    } finally {
      setBusy(false);
      setLoadingMessage('');
    }
  }

  async function showArtistNewestAlbum(artist) {
    const hydratedArtist = await hydrateSelectedArtist(artist);
    const album = await getNewestAlbum(hydratedArtist, settings, settings.dataSource);
    if (!album) {
      setError('That artist has no albums matching the current settings.');
      return;
    }
    setSelectedArtist(hydratedArtist);
    setSelectedAlbum(album);
    setView('album');
  }

  function handleSearch(event) {
    event.preventDefault();
    runAction(async () => {
      const matches = await searchArtists(query, settings.dataSource);
      const exact = matches.find((artist) => artist.name.localeCompare(query, undefined, { sensitivity: 'accent' }) === 0);
      const artist = exact ?? matches[0];
      if (!artist) {
        setError('No matching artist was found in the current catalog.');
        return;
      }
      await showArtistNewestAlbum(artist);
      setSuggestions([]);
    }, usingTidal ? 'Loading artist and album…' : 'Choosing album…'); //Why is this different depending on whether I'm using Tidal?
  }

  function chooseSuggestion(artist) {
    setQuery(artist.name);
    setSuggestions([]);
    runAction(() => showArtistNewestAlbum(artist), usingTidal ? 'Loading artist and album…' : 'Choosing album…'); //Why is this different depending on whether I'm using Tidal?
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
    }, usingTidal ? 'Choosing a followed artist…' : 'Choosing an artist…');
  }

  function chooseNextAlbum() {
    if (!selectedArtist) return;
    runAction(async () => {
      const album = await getNextAlbum(selectedArtist, settings, settings.dataSource, selectedAlbum?.id);
      if (!album) {
        setError('This artist has no albums matching the current settings.');
        return;
      }
      setSelectedAlbum(album);
      setView('album');
    }, usingTidal ? 'Loading albums and artwork…' : 'Choosing album…'); //Why is this different depending on whether I'm using Tidal? This hsould probably just be "Choosing album..." regardless
  }

  async function handleLogin() {
    setAuthBusy(true);
    setError('');
    try {
      await beginTidalLogin();
    } catch (loginError) {
      setError(loginError.message);
      setAuthBusy(false);
    }
  }

  function handleLogout() {
    logoutFromTidal();
    clearTidalDataCache();
    setAuthenticated(false);
    resetHome();
  }

  return (
    <div className="app-root">
      <AppHeader
        onHome={resetHome}
        onOpenSettings={() => setSettingsOpen(true)}
        dataSource={settings.dataSource}
        tidalUrl={tidalUrl}
        authenticated={authenticated}
        authBusy={authBusy}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {view === 'home' && (
        <HomeView
          query={query}
          onQueryChange={setQuery}
          onSearch={handleSearch}
          onSurprise={handleSurprise}
          onChooseSuggestion={chooseSuggestion}
          suggestions={suggestions}
          busy={busy}
          loadingMessage={loadingMessage}
          error={error}
          dataSource={settings.dataSource}
          authenticated={authenticated}
          artistsLoading={artistsLoading}
        />
      )}

      {view === 'artist' && selectedArtist && (
        <ArtistReveal artist={selectedArtist} onTryAgain={handleSurprise} onContinue={chooseNextAlbum} busy={busy} />
      )}

      {view === 'album' && selectedArtist && selectedAlbum && (
        <AlbumView artist={selectedArtist} album={selectedAlbum} onShuffleAgain={chooseNextAlbum} busy={busy} usingTidal={usingTidal} />
      )}

      <SettingsModal
        show={settingsOpen}
        settings={settings}
        onChange={updateSetting}
        onClose={() => setSettingsOpen(false)}
        authenticated={authenticated}
      />
    </div>
  );
}
