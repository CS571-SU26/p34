import { Alert, Button, Form, Modal } from 'react-bootstrap';

export default function SettingsModal({ show, settings, onChange, onClose, authenticated }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>Settings</Modal.Title></Modal.Header>
      <Modal.Body>
        <h2 className="h6">Album selection</h2>
        <Form.Check type="switch" id="include-eps" label="Include EPs" checked={settings.includeEps} onChange={(event) => onChange('includeEps', event.target.checked)} className="mb-3" />
        <Form.Check type="switch" id="include-singles" label="Include singles" checked={settings.includeSingles} onChange={(event) => onChange('includeSingles', event.target.checked)} className="mb-3" />
        <Form.Check type="switch" id="include-live-albums" label="Include albums with “live” in the title" checked={settings.includeLiveAlbums} onChange={(event) => onChange('includeLiveAlbums', event.target.checked)} className="mb-4" />
        <h2 className="h6">Appearance</h2>
        <Form.Check type="switch" id="dark-mode" label="Dark mode" checked={settings.darkMode} onChange={(event) => onChange('darkMode', event.target.checked)} className="mb-4" />

        <h2 className="h6">Data source</h2>
        <Form.Select value={settings.dataSource} onChange={(event) => onChange('dataSource', event.target.value)} aria-label="Choose music data source">
          <option value="mock">Mock data</option>
          <option value="tidal">Real TIDAL data</option>
        </Form.Select>
        {settings.dataSource === 'tidal' && !authenticated && (
          <Alert variant="info" className="mt-3 mb-0">Choose Log in after closing settings.</Alert>
        )}
      </Modal.Body>
      <Modal.Footer><Button variant="primary" onClick={onClose}>Done</Button></Modal.Footer>
    </Modal>
  );
}
