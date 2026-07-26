import { Button, Form, Modal } from 'react-bootstrap';

export default function SettingsModal({ show, settings, onChange, onClose }) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Album selection settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Check
          type="switch"
          id="include-eps"
          label="Include EPs"
          checked={settings.includeEps}
          onChange={(event) => onChange('includeEps', event.target.checked)}
          className="mb-3"
        />
        <Form.Check
          type="switch"
          id="include-live-albums"
          label="Include live albums"
          checked={settings.includeLiveAlbums}
          onChange={(event) =>
            onChange('includeLiveAlbums', event.target.checked)
          }
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
