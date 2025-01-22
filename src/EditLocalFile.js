import React, { useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const EditLocalFile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Extraer el ID del documento desde el estado de navegación
  const { documentId } = location.state || {};

  if (!documentId) {
    return (
      <div className="container mt-4">
        <Card>
          <Card.Body>
            <p className="text-danger">No se encontró el ID del documento.</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Manejar selección de archivo
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Manejar evento de arrastrar y soltar
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setFile(e.dataTransfer.files[0]);
  };

  // Manejar guardar cambios
  const handleSaveChanges = async () => {
    if (!file) {
      alert("Por favor, selecciona un archivo antes de guardar.");
      return;
    }
  
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file); // Asegúrate de que "file" tiene el archivo seleccionado
      formData.append("generatedDocumentId", documentId);
  
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/replace-local-file`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      if (response.data.success) {
        alert("Archivo actualizado con éxito.");
        console.log("Nueva URL del documento:", response.data.documentUrl);
        console.log("Documento actualizado:", response.data.updatedDocument);
        navigate(-1); // Regresa a la página anterior
      } else {
        alert("Hubo un problema al actualizar el archivo: " + response.data.message);
      }
    } catch (error) {
      console.error("Error al guardar los cambios:", error);
      alert("Hubo un error al actualizar el archivo.");
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
          <h5>Editar Archivo Localmente</h5>
        </Card.Header>
        <Card.Body>
          <div
            className="mb-3 p-3 border border-dashed text-center"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            style={{ cursor: "pointer", backgroundColor: "#f9f9f9" }}
          >
            <p>
              {file
                ? `Archivo seleccionado: ${file.name}`
                : "Arrastra y suelta un archivo aquí o haz clic para seleccionar."}
            </p>
            <Form.Control type="file" onChange={handleFileChange} accept=".docx,.pdf,.txt" />
          </div>
          <p className="mt-3">
            Una vez que hayas seleccionado el archivo, presiona "Guardar Cambios" para subirlo y reemplazar el documento anterior.
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

export default EditLocalFile;
