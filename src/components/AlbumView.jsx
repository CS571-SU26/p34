import { Badge, Button, Card, ListGroup } from 'react-bootstrap';

export default function AlbumView({ artist, album, onShuffleAgain, busy }) {
  const releaseYear = new Date(album.releaseDate).getFullYear();

  return (
    <main className="page-shell album-page">
      <div className="album-layout">
        <div>
          <img
            className="album-art shadow-sm"
            src={album.artworkUrl}
            alt={`${album.title} album artwork`}
          />
          <Button
            variant="outline-secondary"
            className="w-100 mt-3"
            onClick={onShuffleAgain}
            disabled={busy}
          >
            {busy ? 'Choosing…' : 'Shuffle album'}
          </Button>
        </div>

        <section aria-labelledby="album-title">
          <div className="d-flex align-items-center gap-2 mb-2">
            <Badge bg="secondary">{album.type.toUpperCase()}</Badge>
            <span className="text-secondary">{releaseYear}</span>
          </div>
          <h1 id="album-title">{album.title}</h1>
          <p className="lead">{artist.name}</p>

          <Card className="shadow-sm">
            <ListGroup variant="flush" numbered>
              {album.tracks.map((track) => (
                <ListGroup.Item key={track}>{track}</ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          <div className="d-grid d-sm-flex gap-2 mt-4">
            <Button href={album.tidalUrl} target="_blank" rel="noreferrer">
              Open in TIDAL
            </Button>
            <Button variant="outline-secondary" disabled title="Playback is a later milestone">
              Play here later
            </Button>
          </div>
        </section>
      </div>

      <div className="future-anchor mt-5">
        <strong>Enhancement anchor:</strong> this region can become the Cover
        Flow-style album selector without changing the rest of the page.
      </div>
    </main>
  );
}
