import React, { useState } from "react";
import TemplateSelector from "./TemplateSelector";
import DocumentConfigurator from "./DocumentConfigurator";
import { Form, Card } from "react-bootstrap";

const DocumentAutomation = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState("");

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId); // Establece la plantilla seleccionada
    setSelectedEntity(""); // Resetea la entidad al cambiar de plantilla
  };

  const handleEntitySelect = (event) => {
    setSelectedEntity(event.target.value);
  };

  return (
    <div className="document-automation container">
      <Card className="mt-1 mb-4">
        <Card.Header>
          <h4 className="text-center">Configuración de Documentos</h4>
        </Card.Header>
        <Card.Body>
          {/* Fila para los selectores */}
      <div className="row" style={{height:'auto'}}>
        {/* Selector de plantilla */}
        <div className="col-12 col-lg-6">
          <TemplateSelector onTemplateSelect={handleTemplateSelect} />
        </div>

        {/* Selector de entidad */}
        {selectedTemplateId && (
          <div className="col-12 col-lg-6">
            <Form.Group controlId="entitySelect">
              <Form.Label>Seleccionar Entidad</Form.Label>
              <Form.Control
                as="select"
                value={selectedEntity}
                onChange={handleEntitySelect}
              >
                <option value="">-- Selecciona una entidad --</option>
                <option value="cliente">Cliente</option>
                <option value="usuario">Usuario</option>
                <option value="servicio">Servicio</option>
                <option value="inspeccion">Inspección</option>
              </Form.Control>
            </Form.Group>
          </div>
        )}
      </div>
        </Card.Body>
      </Card>

      {/* Mostrar configurador si hay una plantilla y una entidad seleccionada */}
      {selectedTemplateId && selectedEntity && (
        <div className="mt-4">
          <DocumentConfigurator
            selectedTemplateId={selectedTemplateId}
            selectedEntity={selectedEntity}
          />
        </div>
      )}
      
    </div>
  );
};

export default DocumentAutomation;
