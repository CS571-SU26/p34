import { Button, Card } from 'react-bootstrap';

export default function ArtistReveal({ artist, onTryAgain, onContinue, busy }) {
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
        {/* Can we add a "go to Tidal" button that goes to the selected artist here?*/}
      </div>
    </main>
  );
}
