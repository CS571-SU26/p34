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
}) {
  const tidalLocked = dataSource === 'tidal' && !authenticated;

  return (
    <main className="page-shell">
      <section className="intro-copy">
        <p className="eyebrow">Album-first music discovery</p>
        <h1>Pick an album, not another playlist.</h1>
        <p>Find an artist&apos;s newest record or let Tidal Wave choose an artist and album for you.</p>
      </section>

      {tidalLocked && <Alert variant="info">Log in to search and shuffle your followed TIDAL artists.</Alert>}
      {loadingMessage && (
        <Alert variant="secondary" className="d-flex align-items-center gap-2" aria-live="polite">
          <Spinner size="sm" /> {loadingMessage}
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}

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
                  placeholder="Enter an artist name"
                  autoComplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={suggestions.length > 0}
                  aria-controls="artist-suggestions"
                  disabled={tidalLocked}
                />
                <Button type="submit" disabled={busy || tidalLocked || !query.trim()}>
                  {busy ? <Spinner size="sm" /> : 'Go'}
                </Button>
              </InputGroup>
              {suggestions.length > 0 && (
                <ListGroup id="artist-suggestions" className="suggestions shadow" role="listbox">
                  {suggestions.map((artist) => (
                    <ListGroup.Item
                      action
                      key={artist.id}
                      role="option"
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
        disabled={busy || tidalLocked}
      >
        {busy ? 'Choosing…' : 'Surprise me'}
      </Button>
    </main>
  );
}
