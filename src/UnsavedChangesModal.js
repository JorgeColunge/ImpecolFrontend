import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnsavedChanges } from './UnsavedChangesContext';
import { Modal, Button } from 'react-bootstrap';

const UnsavedChangesModal = () => {
  const {
    showUnsavedModal,
    setShowUnsavedModal,
    unsavedRoute,
    setHasUnsavedChanges,
    setUnsavedRoute,
  } = useUnsavedChanges();
  const navigate = useNavigate();

  const handleIgnoreChanges = () => {
    setHasUnsavedChanges(false); // Ignora los cambios
    setShowUnsavedModal(false); // Cierra el modal
    navigate(unsavedRoute); // Navega a la ruta pendiente
    setUnsavedRoute(''); // Limpia la ruta pendiente
  };

  const handleStay = () => {
    setShowUnsavedModal(false); // Solo cierra el modal
  };

  if (!showUnsavedModal) return null; // No renderiza nada si el modal no está visible

  return (
    <Modal
      show={showUnsavedModal}
      onHide={handleStay}
      centered // Centra el modal
      backdrop="static" // Evita cerrar haciendo clic fuera
    >
      <Modal.Header closeButton>
        <Modal.Title>Cambios sin guardar</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Tienes cambios sin guardar. ¿Qué deseas hacer?</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={handleIgnoreChanges}>
          Ignorar cambios y continuar
        </Button>
        <Button variant="success" onClick={handleStay}>
          Permanecer y guardar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UnsavedChangesModal;
