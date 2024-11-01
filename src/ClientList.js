import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Table, InputGroup, FormControl, Modal, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({
    service_type: '',
    description: '',
    pest_control: '',
    areas_to_intervene: '',
    responsible: '',
    category: '',
    times_per_month: '',
    price: '',
    companion: '',
    created_by: '',
    created_at: '',
  });

  // Obtener el rol del usuario desde localStorage
  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const canAddClient = userInfo?.rol === "SuperAdministrador" || userInfo?.rol === "Administrador" || userInfo?.rol === "Comercial";

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('http://localhost:10000/api/clients');
        setClients(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching clients:", error);
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({ ...newClient, [name]: value });
  };

  const handleAddClient = async () => {
    try {
      const response = await axios.post('http://localhost:10000/api/clients', newClient);
      setClients([...clients, response.data.client]); // Agregar el nuevo cliente a la lista
      alert("Cliente agregado exitosamente");
      handleCloseModal();
    } catch (error) {
      console.error("Error al agregar cliente:", error);
      alert("Hubo un error al agregar el cliente.");
    }
  };

  if (loading) return <div>Cargando clientes...</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-primary mb-4">Listado de Clientes</h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <InputGroup className="w-25">
          <FormControl placeholder="Buscar" aria-label="Buscar" />
        </InputGroup>
        {canAddClient && (
          <Button variant="primary" onClick={handleShowModal}>
            Agregar Cliente
          </Button>
        )}
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Tipo de Servicio</th>
            <th>Descripción</th>
            <th>Plaga a Controlar</th>
            <th>Áreas a Intervenir</th>
            <th>Responsable</th>
            <th>Categoría</th>
            <th>Veces al Mes</th>
            <th>Precio</th>
            <th>Acompañante</th>
            <th>Creado Por</th>
            <th>Creado En</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.service_type}</td>
              <td>{client.description}</td>
              <td>{client.pest_control}</td>
              <td>{client.areas_to_intervene}</td>
              <td>{client.responsible}</td>
              <td>{client.category}</td>
              <td>{client.times_per_month}</td>
              <td>{client.price}</td>
              <td>{client.companion}</td>
              <td>{client.created_by}</td>
              <td>{client.created_at}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal para agregar nuevo cliente */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formServiceType" className="mb-3">
              <Form.Label>Tipo de Servicio</Form.Label>
              <Form.Control type="text" name="service_type" value={newClient.service_type} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formDescription" className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control type="text" name="description" value={newClient.description} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formPestControl" className="mb-3">
              <Form.Label>Plaga a Controlar</Form.Label>
              <Form.Control type="text" name="pest_control" value={newClient.pest_control} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formAreasToIntervene" className="mb-3">
              <Form.Label>Áreas a Intervenir</Form.Label>
              <Form.Control type="text" name="areas_to_intervene" value={newClient.areas_to_intervene} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formResponsible" className="mb-3">
              <Form.Label>Responsable</Form.Label>
              <Form.Control type="text" name="responsible" value={newClient.responsible} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formCategory" className="mb-3">
              <Form.Label>Categoría</Form.Label>
              <Form.Control type="text" name="category" value={newClient.category} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formTimesPerMonth" className="mb-3">
              <Form.Label>Veces al Mes</Form.Label>
              <Form.Control type="number" name="times_per_month" value={newClient.times_per_month} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formPrice" className="mb-3">
              <Form.Label>Precio</Form.Label>
              <Form.Control type="number" name="price" value={newClient.price} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formCompanion" className="mb-3">
              <Form.Label>Acompañante</Form.Label>
              <Form.Control type="text" name="companion" value={newClient.companion} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formCreatedBy" className="mb-3">
              <Form.Label>Creado Por</Form.Label>
              <Form.Control type="text" name="created_by" value={newClient.created_by} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formCreatedAt" className="mb-3">
              <Form.Label>Creado En</Form.Label>
              <Form.Control type="date" name="created_at" value={newClient.created_at} onChange={handleInputChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleAddClient}>Registrar Cliente</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ClientList;
