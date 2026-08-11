import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Collapse, ListGroup } from 'react-bootstrap';

const MAX_EMBED_RETRIES = 3;

export default function AlbumView({ artist, album, onShuffleAgain, busy, usingTidal }) {
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown year';
  const [tracksOpen, setTracksOpen] = useState(false);
  const trackCount = album.tracks?.length || album.numberOfItems || null;
  const [embedAttempt, setEmbedAttempt] = useState(0);
  const [embedStalled, setEmbedStalled] = useState(false);
  const embedLoadedRef = useRef(false);
  const mainRef = useRef(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, []);

  useEffect(() => {
    setTracksOpen(false);
  }, [album.id]);

  useEffect(() => {
    setEmbedAttempt(0);
    setEmbedStalled(false);
  }, [album.id]);

  // TIDAL's embed endpoint is... pretty flaky. Doing our best here to give sensible retries, etc. but it could still break occasionally.
  useEffect(() => {
    if (!usingTidal) return undefined;
    embedLoadedRef.current = false;
    if (embedAttempt >= MAX_EMBED_RETRIES) {
      setEmbedStalled(true);
      return undefined;
    }
    const delay = Math.min(2500 * 2 ** embedAttempt, 10_000);
    const timer = window.setTimeout(() => {
      if (!embedLoadedRef.current) setEmbedAttempt((attempt) => attempt + 1);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [usingTidal, album.id, embedAttempt]);

  function handleEmbedLoad() {
    embedLoadedRef.current = true;
    setEmbedStalled(false);
  }

  function handleEmbedError() {
    if (embedAttempt < MAX_EMBED_RETRIES) setEmbedAttempt((attempt) => attempt + 1);
    else setEmbedStalled(true);
  }

  return (
    <main className="page-shell album-page" ref={mainRef} tabIndex={-1}>
      <div className="album-layout">
        <div>
          <img className="album-art shadow-sm" src={album.artworkUrl} alt={`${album.title} album artwork`} />
          <Button variant="outline-secondary" className="w-100 mt-3" onClick={onShuffleAgain} disabled={busy}>
            {busy ? 'Choosing…' : 'Shuffle album'}
          </Button>

          {usingTidal && (
            <>
              <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
                <span className="fw-semibold text-secondary text-uppercase small">30-second preview</span>
              </div>
              {embedStalled ? (
                <Alert variant="warning" className="mb-0 d-flex align-items-center justify-content-between gap-2">
                  <span>TIDAL's preview player is being slow (possibly rate-limited).</span>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    onClick={() => {
                      setEmbedStalled(false);
                      setEmbedAttempt(0);
                    }}
                  >
                    Retry
                  </Button>
                </Alert>
              ) : (
                <div className="album-embed shadow-sm">
                  <iframe
                    key={`${album.id}-${embedAttempt}`}
                    title={`TIDAL 30-second preview player for ${album.title}`}
                    src={`https://embed.tidal.com/albums/${album.id}`}
                    width="100%"
                    height="120"
                    frameBorder="0"
                    allow="encrypted-media"
                    allowFullScreen
                    loading="lazy"
                    onLoad={handleEmbedLoad}
                    onError={handleEmbedError}
                  />
                </div>
              )}

              <div className="d-grid gap-2 mt-3">
                <Button href={`https://tidal.com/album/${album.id}`} target="_blank" rel="noopener noreferrer">
                  Open in TIDAL for full playback
                </Button>
              </div>
            </>
          )}
        </div>

        <section aria-labelledby="album-title">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Badge bg="secondary">{album.type.toUpperCase()}</Badge>
            <span className="text-secondary">{releaseYear}</span>
          </div>
          <h1 id="album-title">{album.title}</h1>
          <p className="lead">{artist.name}</p>

          <Card className="shadow-sm">
            <Button
              variant="link"
              className="w-100 text-start text-decoration-none d-flex align-items-center justify-content-between py-3 px-3 text-body fw-semibold"
              onClick={() => setTracksOpen((open) => !open)}
              aria-expanded={tracksOpen}
              disabled={!album.tracks?.length}
            >
              <span>{trackCount ? `${trackCount} track${trackCount === 1 ? '' : 's'}` : 'Track list not loaded.'}</span>
              {album.tracks?.length > 0 && <span aria-hidden="true">{tracksOpen ? '▲' : '▼'}</span>}
            </Button>
            {album.tracks?.length > 0 && (
              <Collapse in={tracksOpen}>
                <div>
                  <ListGroup variant="flush" numbered>
                    {album.tracks.map((track) => <ListGroup.Item key={track}>{track}</ListGroup.Item>)}
                  </ListGroup>
                </div>
              </Collapse>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
