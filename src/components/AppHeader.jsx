import { Button, Container, Navbar } from 'react-bootstrap';

export default function AppHeader({ onHome, onOpenSettings }) {
  return (
    <Navbar className="app-header border-bottom" sticky="top">
      <Container>
        <Navbar.Brand as="button" className="brand-button" onClick={onHome}>
          Tidal Wave
        </Navbar.Brand>
        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            href="https://tidal.com"
            target="_blank"
            rel="noreferrer"
          >
            Go to TIDAL
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={onOpenSettings}>
            Settings
          </Button>
          <Button variant="dark" size="sm" disabled title="OAuth comes later">
            Log in
          </Button>
        </div>
      </Container>
    </Navbar>
  );
}
