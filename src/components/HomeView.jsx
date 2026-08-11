import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Form, InputGroup, ListGroup, Spinner } from 'react-bootstrap';

export default function HomeView({
  query,
  onQueryChange,
  onSearch,
  onSurprise,
  onChooseSuggestion,
  suggestions,
  busy,
  loadingMessage,
  error,
  dataSource,
  authenticated,
  artistsLoading,
}) {
  const tidalLocked = dataSource === 'tidal' && !authenticated;
  const controlsDisabled = busy || tidalLocked || artistsLoading;
  const mainRef = useRef(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const visibleSuggestions = suggestionsDismissed ? [] : suggestions;

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
    setSuggestionsDismissed(false);
  }, [suggestions]);

  function handleQueryKeyDown(event) {
    if (!visibleSuggestions.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % visibleSuggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((index) => (index - 1 + visibleSuggestions.length) % visibleSuggestions.length);
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      onChooseSuggestion(visibleSuggestions[highlightedIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setSuggestionsDismissed(true);
    }
  }

  return (
    <main className="page-shell" ref={mainRef} tabIndex={-1}>
      <h1 className="visually-hidden">Tidal Wave — discover an album from an artist you follow</h1>
      <section className="intro-copy">
        <img
          className="intro-hero"
          src={`${import.meta.env.BASE_URL}tidalWave.png`}
          alt="Tidal Wave"
        />
      </section>

      {tidalLocked && <Alert variant="info">Log in to search and shuffle your followed TIDAL artists.</Alert>}
      {loadingMessage && (
        <Alert variant="secondary" className="d-flex align-items-center gap-2" aria-live="polite">
          <Spinner size="sm" /> {loadingMessage}
        </Alert>
      )}
      {error && <Alert variant="danger" role="alert">{error}</Alert>}

      <Card className="action-card shadow-sm">
        <Card.Body>
          <Form onSubmit={onSearch}>
            <Form.Label htmlFor="artist-search" className="fw-semibold">
              Find the newest album from…
            </Form.Label>
            <div className="artist-search-wrap">
              <InputGroup>
                <Form.Control
                  id="artist-search"
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  onKeyDown={handleQueryKeyDown}
                  placeholder="Enter an artist name"
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-haspopup="listbox"
                  aria-expanded={visibleSuggestions.length > 0}
                  aria-controls="artist-suggestions"
                  aria-activedescendant={highlightedIndex >= 0 ? `artist-option-${visibleSuggestions[highlightedIndex].id}` : undefined}
                  disabled={controlsDisabled}
                />
                <Button type="submit" disabled={controlsDisabled || !query.trim()}>
                  {busy ? <Spinner size="sm" /> : 'Go'}
                </Button>
              </InputGroup>
              {visibleSuggestions.length > 0 && (
                <ListGroup id="artist-suggestions" className="suggestions shadow" role="listbox">
                  {visibleSuggestions.map((artist, index) => (
                    <ListGroup.Item
                      action
                      key={artist.id}
                      id={`artist-option-${artist.id}`}
                      role="option"
                      active={index === highlightedIndex}
                      aria-selected={index === highlightedIndex}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        onChooseSuggestion(artist);
                      }}
                    >
                      {artist.name}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          </Form>
        </Card.Body>
      </Card>

      <div className="or-divider" aria-hidden="true"><span>or</span></div>

      <Button
        className="surprise-button"
        size="lg"
        variant="dark"
        onClick={onSurprise}
        disabled={controlsDisabled}
      >
        {busy ? 'Choosing…' : 'Surprise me'}
      </Button>

      {dataSource === 'tidal' && (
        <p className="permission-note">
          Tidal Wave requests only read-only access to your TIDAL library and playback-related permissions.
        </p>
      )}
    </main>
  );
}
