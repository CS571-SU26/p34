import { Alert, Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap';

export default function HomeView({
  query,
  onQueryChange,
  onSearch,
  onSurprise,
  busy,
  error,
  dataSource,
}) {
  return (
    <main className="page-shell">
      <section className="intro-copy">
        <p className="eyebrow">Album-first music discovery</p>
        <h1>Pick an album, not another playlist.</h1>
        <p>
          Find an artist&apos;s newest record or let Tidal Wave choose an artist
          and album for you.
        </p>
      </section>

      {dataSource === 'tidal' && (
        <Alert variant="info">
          Real TIDAL data is selected, but the provider is still a placeholder.
        </Alert>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="action-card shadow-sm">
        <Card.Body>
          <Form onSubmit={onSearch}>
            <Form.Label htmlFor="artist-search" className="fw-semibold">
              Find the newest album from…
            </Form.Label>
            <InputGroup>
              <Form.Control
                id="artist-search"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Enter an artist name"
                autoComplete="off"
              />
              <Button type="submit" disabled={busy || !query.trim()}>
                {busy ? <Spinner size="sm" /> : 'Go'}
              </Button>
            </InputGroup>
          </Form>
        </Card.Body>
      </Card>

      <div className="or-divider" aria-hidden="true">
        <span>or</span>
      </div>

      <Button
        className="surprise-button"
        size="lg"
        variant="dark"
        onClick={onSurprise}
        disabled={busy}
      >
        {busy ? 'Choosing…' : 'Surprise me'}
      </Button>
    </main>
  );
}
