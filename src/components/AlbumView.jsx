import { Badge, Button, Card, ListGroup } from 'react-bootstrap';

export default function AlbumView({ artist, album, onShuffleAgain, busy, usingTidal }) {
  const releaseYear = album.releaseDate ? new Date(album.releaseDate).getFullYear() : 'Unknown year';

  return (
    <main className="page-shell album-page">
      <div className="album-layout">
        <div>
          <img className="album-art shadow-sm" src={album.artworkUrl} alt={`${album.title} album artwork`} />
          <Button variant="outline-secondary" className="w-100 mt-3" onClick={onShuffleAgain} disabled={busy}>
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

          {album.tracks?.length > 0 ? (
            <Card className="shadow-sm">
              <ListGroup variant="flush" numbered>
                {album.tracks.map((track) => <ListGroup.Item key={track}>{track}</ListGroup.Item>)}
              </ListGroup>
            </Card>
          ) : (
            <Card className="shadow-sm"><Card.Body>{album.numberOfItems ? `${album.numberOfItems} tracks` : 'Track list not loaded.'}</Card.Body></Card>
          )}

          {usingTidal && (
            <div className="d-grid d-sm-flex gap-2 mt-4">
              <Button href={`https://tidal.com/album/${album.id}`} target="_blank" rel="noopener noreferrer">
                Open in TIDAL
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
