import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import TemplateSelector from "./TemplateSelector";
import DocumentConfigurator from "./DocumentConfigurator";
import { Form, Card, Spinner, Badge } from "react-bootstrap";

const DocumentAutomation = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [loadingConfig, setLoadingConfig] = useState(false);

  /* 1. Leer ?configId=… */
  const [searchParams] = useSearchParams();
  const configId = searchParams.get("configId");

  /* 2. Si existe, precargar metadatos */
  useEffect(() => {
    if (!configId) return;

    const fetchMeta = async () => {
      try {
        setLoadingConfig(true);
        const url = `${process.env.REACT_APP_API_URL}/api/get-configuration/${configId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Config ${configId} no encontrada`);
        const meta = await res.json();

        /* Puede venir envuelta */
        let cfg = meta.configuration ?? meta;
        if (typeof cfg === "string") cfg = JSON.parse(cfg);

        const tpl = Number(cfg.templateId ?? cfg.template_id ?? 0) || null;
        const ent = cfg.entity ?? "";

        setSelectedTemplateId(tpl);
        setSelectedEntity(ent);
      } catch (err) {
        console.error("[DocumentAutomation] error:", err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchMeta();
  }, [configId]);

  /* 3. Handlers modo NUEVO */
  const handleTemplateSelect = (tplId) => {
    setSelectedTemplateId(tplId);
    setSelectedEntity("");
  };
  const handleEntitySelect = (e) => setSelectedEntity(e.target.value);

  /* 4. Render */
  return (
    <div className="document-automation container">

      {/* Cabecera */}
      {!configId && (
        <Card className="mt-1 mb-4">
          <Card.Header>
            <h4 className="text-center">Configuración de Documentos</h4>
          </Card.Header>

          <Card.Body>

            {/* ─────── A) Modo NUEVO (sin configId) ─────── */}
            {!configId && (
              <div className="row" style={{ height: "auto" }}>
                <div className="col-12 col-lg-6">
                  <TemplateSelector
                    onTemplateSelect={handleTemplateSelect}
                    initialSelectedId={selectedTemplateId}
                  />
                </div>

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
            )}

            {/* ─────── B) Modo EDICIÓN (con configId) ─────── */}
            {configId && !loadingConfig && selectedTemplateId && (
              <div className="row mb-3" style={{ minHeight: 0, height: 'auto' }}>
                <div className="col text-center">
                  <h6 className="mb-0">
                    Entidad <Badge bg="info">{selectedEntity}</Badge>
                  </h6>
                </div>
              </div>
            )}

            {loadingConfig && (
              <div className="text-center py-3">
                <Spinner animation="border" />
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Configurador */}
      {selectedTemplateId && selectedEntity && (
        <DocumentConfigurator
          selectedTemplateId={selectedTemplateId}
          selectedEntity={selectedEntity}
        />
      )}
    </div>
  );
};

export default DocumentAutomation;
