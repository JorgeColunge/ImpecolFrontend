import React, { useState } from "react";
import { Button, Card } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const EditGoogleDrive = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Extraer los datos del estado de navegación
  const { documentInfo } = location.state || {};

  if (!documentInfo) {
    return (
      <div className="container mt-4">
        <Card>
          <Card.Body>
            <p className="text-danger">No se encontró información del documento.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const { id, entity_id, document_url, google_drive_url, google_drive_id } = documentInfo;

  // Manejar guardar cambios
  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/replace-google-drive-url`, {
        googleDriveId: google_drive_id,
        generatedDocumentId: id,
      });

      if (response.data.success) {
        alert("Cambios guardados exitosamente.");
        console.log("Nueva URL del documento:", response.data.documentUrl);
        console.log("Documento actualizado:", response.data.updatedDocument);
        navigate(-1); // Regresa a la página anterior
      } else {
        alert("Hubo un problema al guardar los cambios: " + response.data.message);
      }
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  // Manejar cancelar
  const handleCancel = () => {
    navigate(-1); // Regresa a la página anterior
  };

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <h5>Editar Archivo en Google Drive</h5>
        </Card.Header>
        <Card.Body>
          <p>
            <strong>ID del Documento:</strong> {id}
          </p>
          <p>
            <strong>ID de Entidad:</strong> {entity_id}
          </p>
          <p>
            <strong>URL del Documento:</strong>{" "}
            <a href={document_url} target="_blank" rel="noopener noreferrer">
              {document_url}
            </a>
          </p>
          <p>
            <strong>URL Pública de Google Drive:</strong>{" "}
            <a href={google_drive_url} target="_blank" rel="noopener noreferrer">
              {google_drive_url}
            </a>
          </p>
          <p>
            <strong>Identificador de Google Drive:</strong> {google_drive_id}
          </p>
          <p className="mt-3">
            Edita el archivo en Google Drive y, al finalizar, presiona "Guardar cambios".
          </p>
        </Card.Body>
        <Card.Footer className="d-flex justify-content-end">
          <Button variant="secondary" className="me-2" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSaveChanges} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
};

export default EditGoogleDrive;
