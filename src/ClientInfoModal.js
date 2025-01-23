import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import { BuildingFill, GeoAltFill } from "react-bootstrap-icons";
import axios from "axios";

function ClientInfoModal({ clientId, show, onClose }) {
  const [client, setClient] = useState(null);
  const [stations, setStations] = useState([]); // Estado único para todas las estaciones
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId && show) {
      fetchClientData(clientId);
      fetchStationsByClient(clientId);
    }
  }, [clientId, show]);

  const fetchClientData = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/${id}`);
      setClient(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching client data:", error);
      setClient(null);
      setLoading(false);
    }
  };

  const fetchStationsByClient = async (id) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stations/client/${id}`);
      setStations(response.data); // Guarda todas las estaciones en un solo estado
    } catch (error) {
      console.error("Error fetching stations by client:", error);
      setStations([]);
    }
  };

  if (!clientId || loading) {
    return (
      <Modal show={show} onHide={onClose}>
        <Modal.Body>Cargando datos del cliente...</Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fw-bold">
          <BuildingFill className="me-2" /> Detalles del Cliente
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ height: "55vh" }}>
        {client ? (
          <div className="row">
            {/* Información del Cliente */}
            <div className="col-md-12 mb-4">
            <div className="bg-white shadow-sm rounded px-3 pt-3 pb-0" style={{ height: "100%" }}>
                <h5 className="text-secondary mb-3">
                  <GeoAltFill className="me-2" /> Información de la Empresa
                </h5>
                <p><strong>Empresa:</strong> {client.name || "No disponible"}</p>
                <p><strong>Dirección:</strong> {client.address || ""}, {client.department || ""}, {client.city || ""}</p>
                <p><strong>Teléfono:</strong> {client.phone || "No disponible"}</p>
                <p><strong>Tipo de Documento:</strong> {client.document_type || "No disponible"}</p>
                <p><strong>Número de Documento:</strong> {client.document_number || "No disponible"}</p>
              </div>
            </div>

            {/* Estaciones */}
            <div className="col-md-12 mb-4">
              <div className="bg-white shadow-sm rounded p-3">
                <h5 className="text-secondary mb-3">
                  <BuildingFill className="me-2" /> Estaciones
                </h5>
                <div className="table-responsive">
                  {stations.length > 0 ? (
                    <table className="table table-bordered table-hover text-center">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Descripción</th>
                          <th>Tipo</th>
                          <th>Categoría</th>
                          <th>QR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stations.map((station, index) => (
                          <tr key={station.id}>
                            <td>{index + 1}</td>
                            <td>{station.description || "No disponible"}</td>
                            <td>{station.type || "No disponible"}</td>
                            <td>{station.category || "No disponible"}</td>
                            <td>
                              {station.qr_code ? (
                                <img
                                  src={`${station.qr_code}`}
                                  alt={`QR de estación ${station.description}`}
                                  className="img-fluid rounded"
                                  style={{ maxWidth: "200px" }}
                                />
                              ) : (
                                <span className="text-muted">No disponible</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No hay estaciones registradas.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p>No se encontraron datos del cliente.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100">
          {/* Botones de acción */}
          <div className="action-buttons d-flex flex-wrap flex-md-nowrap justify-content-around mb-4">
            <Button
              className="btn-outline-primary w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() => window.open(`tel:${client?.phone || ""}`)}
            >
              <i className="fas fa-phone"></i>
              <span style={{ marginLeft: "8px" }}>Llamar</span>
            </Button>
            <Button
              className="btn-outline-success w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() =>
                window.open(
                  `https://wa.me/${client?.phone?.replace(/\D/g, "")}`,
                  "_blank"
                )
              }
            >
              <i className="fab fa-whatsapp"></i>
              <span style={{ marginLeft: "8px" }}>WhatsApp</span>
            </Button>
            <Button
              className="btn-outline-dark w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() => window.open(`mailto:${client?.email || ""}`)}
            >
              <i className="fas fa-envelope"></i>
              <span style={{ marginLeft: "8px" }}>Correo</span>
            </Button>
            <Button
              className="btn-outline-danger w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${encodeURIComponent(
                    `${client?.address || ""}, ${client?.city || ""}, ${client?.department || ""}`
                  )}`,
                  "_blank"
                )
              }
            >
              <i className="fas fa-map-marker-alt"></i>
              <span style={{ marginLeft: "8px" }}>Ubicación</span>
            </Button>
          </div>
          <Button variant="dark w-100" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default ClientInfoModal;
