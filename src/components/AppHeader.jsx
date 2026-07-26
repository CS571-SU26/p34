import { Button, Container, Navbar } from 'react-bootstrap';

export default function AppHeader({
  onHome,
  onOpenSettings,
  dataSource,
  tidalUrl,
  authenticated,
  authBusy,
  onLogin,
  onLogout,
}) {
  const usingTidal = dataSource === 'tidal';

  return (
    <Navbar className="app-header border-bottom" sticky="top">
      <Container>
        <Navbar.Brand as="button" className="brand-button" onClick={onHome}>
          Tidal Wave
        </Navbar.Brand>
        <div className="d-flex align-items-center gap-2">
          {usingTidal && (
            <Button
              variant="outline-secondary"
              size="sm"
              href={tidalUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Go to TIDAL
            </Button>
          )}
          <Button variant="outline-secondary" size="sm" onClick={onOpenSettings}>
            Settings
          </Button>
          {usingTidal && (
            <Button
              variant={authenticated ? 'outline-danger' : 'dark'}
              size="sm"
              onClick={authenticated ? onLogout : onLogin}
              disabled={authBusy}
            >
              {authBusy ? 'Working…' : authenticated ? 'Log out' : 'Log in'}
            </Button>
          )}
        </div>
      </Container>
    </Navbar>
  );
}
