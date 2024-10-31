import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Card, Modal, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function ServiceList() {
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    service_type: '',
    description: '',
    responsible: '',
    category: '',
    quantity_per_month: '',
    client_id: '',
    value: '',
    companion: ''
  });

  const storedUserInfo = JSON.parse(localStorage.getItem("user_info")); // Obteniendo el ID del usuario logueado

  useEffect(() => {
    const fetchServicesClientsUsers = async () => {
      try {
        const servicesResponse = await axios.get('http://localhost:10000/api/services');
        const clientsResponse = await axios.get('http://localhost:10000/api/clients');
        const usersResponse = await axios.get('http://localhost:10000/api/users'); // Obtiene los usuarios
        setServices(servicesResponse.data);
        setClients(clientsResponse.data);
        setUsers(usersResponse.data); // Almacena los usuarios
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchServicesClientsUsers();
  }, []);

  const handleShowModal = (service = null) => {
    setEditingService(service);
    if (service) {
      setNewService(service);
    } else {
      setNewService({
        service_type: '',
        description: '',
        responsible: '',
        category: '',
        quantity_per_month: '',
        client_id: '',
        value: '',
        companion: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewService({ ...newService, [name]: value });
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setNewService({ ...newService, category: value, quantity_per_month: value === 'Periodico' ? '' : null });
  };

  const handleAddOrEditService = async () => {
    const payload = {
      ...newService,
      created_by: storedUserInfo.id // Envía el ID del usuario logueado
    };

    try {
      if (editingService) {
        await axios.put(`http://localhost:10000/api/services/${editingService.id}`, payload);
        setServices(services.map((service) => (service.id === editingService.id ? payload : service)));
        alert("Servicio actualizado exitosamente");
      } else {
        const response = await axios.post('http://localhost:10000/api/services', payload);
        setServices([...services, response.data.service]);
        alert("Servicio agregado exitosamente");
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar el servicio:", error);
      alert("Hubo un error al guardar el servicio.");
    }
  };

  const deleteService = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este servicio?")) {
      try {
        await axios.delete(`http://localhost:10000/api/services/${id}`);
        setServices(services.filter(service => service.id !== id));
        alert("Servicio eliminado exitosamente.");
      } catch (error) {
        console.error("Error al eliminar servicio:", error);
        alert("Hubo un error al eliminar el servicio.");
      }
    }
  };

  if (loading) return <div>Cargando servicios...</div>;

  const groupedServices = clients.map(client => ({
    client,
    services: services.filter(service => service.client_id === client.id)
  }));

  return (
    <div className="container mt-4">
      <h2 className="text-primary mb-4">Servicios</h2>

      <Button variant="primary" className="mb-4" onClick={() => handleShowModal()}>
        Agregar Servicio
      </Button>

      <div className="row">
        {groupedServices.map(({ client, services }) => (
          <div key={client.id} className="col-md-6 mb-4">
            <h4>{client.name}</h4>
            {services.length > 0 ? (
              services.map((service) => (
                <Card key={service.id} className="mb-3">
                  <Card.Body>
                    <Card.Title>{service.service_type}</Card.Title>
                    <Card.Text>
                      <strong>Descripción:</strong> {service.description}<br />
                      <strong>Responsable:</strong> {service.responsible}<br />
                      <strong>Categoría:</strong> {service.category}<br />
                      {service.category === 'Periodico' && (
                        <>
                          <strong>Cantidad al mes:</strong> {service.quantity_per_month}<br />
                        </>
                      )}
                      <strong>Valor:</strong> ${service.value}<br />
                      <strong>Acompañante:</strong> {service.companion}
                    </Card.Text>
                    <Button variant="success" size="sm" onClick={() => handleShowModal(service)}>
                      Editar
                    </Button>
                    <Button variant="danger" size="sm" className="ms-2" onClick={() => deleteService(service.id)}>
                      Eliminar
                    </Button>
                  </Card.Body>
                </Card>
              ))
            ) : (
              <p>No hay servicios para este cliente</p>
            )}
          </div>
        ))}
      </div>

      {/* Modal para agregar/editar servicio */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingService ? "Editar Servicio" : "Agregar Servicio"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formServiceType" className="mb-3">
              <Form.Label>Tipo de Servicio</Form.Label>
              <Form.Control as="select" name="service_type" value={newService.service_type} onChange={handleInputChange}>
                <option value="">Selecciona un tipo</option>
                <option value="Hogar">Hogar</option>
                <option value="Empresarial">Empresarial</option>
                <option value="Propiedad Horizontal">Propiedad Horizontal</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="formDescription" className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control as="textarea" name="description" value={newService.description} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formResponsible" className="mb-3">
              <Form.Label>Responsable</Form.Label>
              <Form.Control as="select" name="responsible" value={newService.responsible} onChange={handleInputChange}>
                <option value="">Selecciona un responsable</option>
                {users.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="formCategory" className="mb-3">
              <Form.Label>Categoría</Form.Label>
              <Form.Control as="select" name="category" value={newService.category} onChange={handleCategoryChange}>
                <option value="">Selecciona una categoría</option>
                <option value="Puntual">Puntual</option>
                <option value="Periodico">Periodico</option>
              </Form.Control>
            </Form.Group>
            {newService.category === 'Periodico' && (
              <Form.Group controlId="formQuantityPerMonth" className="mb-3">
                <Form.Label>Cantidad al Mes</Form.Label>
                <Form.Control type="number" name="quantity_per_month" value={newService.quantity_per_month} onChange={handleInputChange} />
              </Form.Group>
            )}
            <Form.Group controlId="formClient" className="mb-3">
              <Form.Label>Cliente</Form.Label>
              <Form.Control as="select" name="client_id" value={newService.client_id} onChange={handleInputChange}>
                <option value="">Selecciona un cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="formValue" className="mb-3">
              <Form.Label>Valor</Form.Label>
              <Form.Control type="number" name="value" value={newService.value} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formCompanion" className="mb-3">
              <Form.Label>Acompañante</Form.Label>
              <Form.Control as="select" name="companion" value={newService.companion} onChange={handleInputChange}>
                <option value="">Selecciona un acompañante</option>
                {users.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleAddOrEditService}>
            {editingService ? "Guardar Cambios" : "Registrar Servicio"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ServiceList;
