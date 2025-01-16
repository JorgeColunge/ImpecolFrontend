import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Card, Col, Row, Button, Modal, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function CompanyStations() {
  const { client_id } = useParams(); // Obtén client_id desde la URL
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [newStation, setNewStation] = useState({
    description: '',
    category: '',
    type: '',
    control_method: '',
    qr_code: '',
  });

  useEffect(() => {
    console.log('Client ID received from URL:', client_id);

    if (!client_id) {
      console.error('Error: client_id is undefined or null.');
      setLoading(false);
      return;
    }

    const fetchStations = async () => {
      try {
        console.log(`Fetching stations for client ID: ${client_id}`);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stations/client/${client_id}`);
        console.log('Stations fetched successfully:', response.data);
        setStations(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stations:', error);
        setLoading(false);
      }
    };

    fetchStations();
  }, [client_id]);

  const handleShowAddStationModal = () => setShowAddStationModal(true);
  const handleCloseAddStationModal = () => {
    setShowAddStationModal(false);
    setNewStation({
      description: '',
      category: '',
      type: '',
      control_method: '',
      qr_code: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveStation = async () => {
    console.log('Attempting to save station for client ID:', client_id);

    if (!client_id) {
      console.error('Error: Cannot save station because client_id is undefined.');
      return;
    }

    try {
      const stationData = { ...newStation, client_id };
      console.log('Station data being sent to the server:', stationData);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/stations`, stationData);

      if (response.data.success) {
        console.log('Station created successfully:', response.data.station);
        alert('Estación creada con éxito');
        setStations((prev) => [...prev, response.data.station]);
        handleCloseAddStationModal();
      } else {
        console.error('Error creating station:', response.data.message);
      }
    } catch (error) {
      console.error('Error saving station:', error);
    }
  };

  // Agrupar estaciones por categoría
  const groupedStations = stations.reduce((acc, station) => {
    if (!acc[station.category]) {
      acc[station.category] = [];
    }
    acc[station.category].push(station);
    return acc;
  }, {});

  if (!client_id) {
    return <div>Error: No se proporcionó un ID de cliente válido.</div>;
  }

  if (loading) return <div>Cargando estaciones...</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-primary mb-4">Estaciones de la Empresa</h2>
      {Object.keys(groupedStations).map((category) => (
        <div key={category} className="mb-4">
          <h3 className="text-secondary">{category}</h3>
          <Row>
            {groupedStations[category].map((station) => (
              <Col md={4} key={station.id} className="mb-3">
                <Card className="border">
                  <Card.Body>
                    <h5 className="text-primary">{station.description}</h5>
                    <p><strong>Categoría:</strong> {station.category}</p>
                    <p><strong>Tipo:</strong> {station.type}</p>
                    <p><strong>Método de Control:</strong> {station.control_method}</p>
                    <p><strong>QR Code:</strong> {station.qr_code || 'N/A'}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
      <Button variant="primary" className="mt-3" onClick={handleShowAddStationModal}>
        Añadir Estación
      </Button>

      {/* Modal para añadir una nueva estación */}
      <Modal show={showAddStationModal} onHide={handleCloseAddStationModal} backdrop="static" centered>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nueva Estación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formDescription" className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                type="text"
                name="description"
                value={newStation.description}
                onChange={handleInputChange}
                placeholder="Ingresa la descripción"
              />
            </Form.Group>
            <Form.Group controlId="formCategory" className="mb-3">
              <Form.Label>Categoría</Form.Label>
              <Form.Control
                type="text"
                name="category"
                value={newStation.category}
                onChange={handleInputChange}
                placeholder="Ingresa la categoría"
              />
            </Form.Group>
            <Form.Group controlId="formType" className="mb-3">
              <Form.Label>Tipo</Form.Label>
              <Form.Control
                type="text"
                name="type"
                value={newStation.type}
                onChange={handleInputChange}
                placeholder="Ingresa el tipo"
              />
            </Form.Group>
            <Form.Group controlId="formControlMethod" className="mb-3">
              <Form.Label>Método de Control</Form.Label>
              <Form.Control
                type="text"
                name="control_method"
                value={newStation.control_method}
                onChange={handleInputChange}
                placeholder="Ingresa el método de control"
              />
            </Form.Group>
            <Form.Group controlId="formQRCode" className="mb-3">
              <Form.Label>QR Code</Form.Label>
              <Form.Control
                type="text"
                name="qr_code"
                value={newStation.qr_code}
                onChange={handleInputChange}
                placeholder="Ingresa el código QR (opcional)"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAddStationModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveStation}>Guardar Estación</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default CompanyStations;
