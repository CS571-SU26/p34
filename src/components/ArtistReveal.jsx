import { Button, Card } from 'react-bootstrap';

export default function ArtistReveal({ artist, onTryAgain, onContinue, busy, usingTidal }) {
  return (
    <main className="page-shell">
      <p className="eyebrow">You&apos;ll be listening to…</p>
      <Card className="reveal-card shadow-sm overflow-hidden">
        <img className="artist-image" src={artist.imageUrl} alt="" />
        <Card.Body>
          <h1 className="h2 mb-1">{artist.name}</h1>
          <p className="text-secondary mb-0">
            Next, we&apos;ll choose an eligible album from this artist.
          </p>
        </Card.Body>
      </Card>
      <div className="d-grid d-sm-flex gap-2 mt-4">
        <Button variant="outline-secondary" onClick={onTryAgain} disabled={busy}>
          Try again
        </Button>
        <Button variant="primary" onClick={onContinue} disabled={busy}>
          {busy ? 'Choosing album…' : "Let's go"}
        </Button>
      </div>
      {usingTidal && (
        <div className="d-grid d-sm-flex mt-2">
          <Button
            variant="outline-secondary"
            href={`https://tidal.com/artist/${artist.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Artist in TIDAL
          </Button>
        </div>
      )}
    </main>
  );
}
