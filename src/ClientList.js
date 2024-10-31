import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Table, InputGroup, FormControl, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function ClientList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    representative: '',
    document_type: '',
    document_number: '',
    contact_name: '',
    contact_phone: '',
    rut: '',
  });

  const navigate = useNavigate();

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

  const handleShowModal = (client = null) => {
    setEditingClient(client);
    if (client) {
      setNewClient(client); // Si editamos, llenamos los datos del cliente seleccionado
    } else {
      setNewClient({
        name: '',
        address: '',
        phone: '',
        email: '',
        representative: '',
        document_type: '',
        document_number: '',
        contact_name: '',
        contact_phone: '',
        rut: '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({ ...newClient, [name]: value });
  };

  const handleAddOrEditClient = async () => {
    try {
      if (editingClient) {
        // Editar cliente existente
        await axios.put(`http://localhost:10000/api/clients/${editingClient.id}`, newClient);
        setClients(clients.map((client) => (client.id === editingClient.id ? newClient : client)));
        alert("Cliente actualizado exitosamente");
      } else {
        // Crear nuevo cliente
        const response = await axios.post('http://localhost:10000/api/clients', newClient);
        setClients([...clients, response.data.client]);
        alert("Cliente agregado exitosamente");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
      alert("Hubo un error al guardar el cliente.");
    }
  };

  const deleteClient = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este cliente?")) {
      try {
        await axios.delete(`http://localhost:10000/api/clients/${id}`);
        setClients(clients.filter(client => client.id !== id));
        alert("Cliente eliminado exitosamente.");
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        alert("Hubo un error al eliminar el cliente.");
      }
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
        <Button variant="primary" onClick={() => handleShowModal()}>
          Agregar Cliente
        </Button>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Dirección</th>
            <th>Teléfono</th>
            <th>Correo</th>
            <th>Responsable</th>
            <th>Tipo de Documento</th>
            <th>Número de Documento</th>
            <th>Nombre de Contacto</th>
            <th>Teléfono de Contacto</th>
            <th>RUT</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.address}</td>
              <td>{client.phone}</td>
              <td>{client.email}</td>
              <td>{client.representative}</td>
              <td>{client.document_type}</td>
              <td>{client.document_number}</td>
              <td>{client.contact_name}</td>
              <td>{client.contact_phone}</td>
              <td>{client.rut}</td>
              <td>
                <Button variant="success" size="sm" onClick={() => handleShowModal(client)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => deleteClient(client.id)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal para agregar/editar cliente */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingClient ? "Editar Cliente" : "Agregar Cliente"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formClientName" className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control type="text" name="name" value={newClient.name} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientAddress" className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control type="text" name="address" value={newClient.address} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientPhone" className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control type="text" name="phone" value={newClient.phone} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientEmail" className="mb-3">
              <Form.Label>Correo</Form.Label>
              <Form.Control type="email" name="email" value={newClient.email} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientRepresentative" className="mb-3">
              <Form.Label>Responsable</Form.Label>
              <Form.Control type="text" name="representative" value={newClient.representative} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientDocumentType" className="mb-3">
              <Form.Label>Tipo de Documento</Form.Label>
              <Form.Control type="text" name="document_type" value={newClient.document_type} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientDocumentNumber" className="mb-3">
              <Form.Label>Número de Documento</Form.Label>
              <Form.Control type="text" name="document_number" value={newClient.document_number} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientContactName" className="mb-3">
              <Form.Label>Nombre de Contacto</Form.Label>
              <Form.Control type="text" name="contact_name" value={newClient.contact_name} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientContactPhone" className="mb-3">
              <Form.Label>Teléfono de Contacto</Form.Label>
              <Form.Control type="text" name="contact_phone" value={newClient.contact_phone} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formClientRUT" className="mb-3">
              <Form.Label>RUT</Form.Label>
              <Form.Control type="text" name="rut" value={newClient.rut} onChange={handleInputChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleAddOrEditClient}>
            {editingClient ? "Guardar Cambios" : "Registrar Cliente"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ClientList;
