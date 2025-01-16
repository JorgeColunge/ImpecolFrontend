import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";

const TemplateSelector = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");

  // Cargar las plantillas disponibles al montar el componente
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get-templates`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates);
        } else {
          console.error("Error al obtener las plantillas");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
      }
    };

    fetchTemplates();
  }, []);

  const handleTemplateChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedTemplate(selectedValue);
    if (selectedValue) {
      onTemplateSelect(selectedValue);
    }
  };

  return (
    <div className="template-selector">
      <Form>
        <Form.Group controlId="templateSelect">
          <Form.Label>Seleccionar Plantilla</Form.Label>
          <Form.Control
            as="select"
            value={selectedTemplate}
            onChange={handleTemplateChange}
          >
            <option value="">-- Selecciona una plantilla --</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.nombre}
              </option>
            ))}
          </Form.Control>
        </Form.Group>
      </Form>
    </div>
  );
};

export default TemplateSelector;
