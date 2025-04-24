import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { PencilSquare, Person, Envelope, Phone, Gear } from 'react-bootstrap-icons';
import { Modal, Button, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function ShowProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [apiData, setApiData] = useState({
    action: 'create',
    assignment_type: 'colaborador',
    assignment_id: '',
    Authorization: '',
    X_Company_ID: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${id}`);
        setUser(response.data);
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleChange = (e) => {
    setApiData({ ...apiData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/scheduling-api`, {
        user_id: id,
        ...apiData
      });
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar la configuración:", error);
      alert("Error al guardar la configuración");
    }
  };

  if (loading) return <div>Cargando perfil del usuario...</div>;

  return (
    <div className="container mt-3 d-flex justify-content-center">
      <div className="card shadow-sm" style={{ maxWidth: '400px', borderRadius: '15px' }}>
        <div className="card-body text-center position-relative">
          <div className="img-mask mx-auto">
            <img
              src={`${user?.image || '/images/LogoImpecol.png'}`}
              alt="Profile"
              className="rounded-img shadow-sm"
              width="150"
              height="150"
            />
          </div>
          <h5 className="mt-3">{user?.name} {user?.lastname}</h5>
          <p className="text-muted">{user?.rol}</p>
          <hr />
          <ul className="list-group list-group-flush">
            <li className="list-group-item d-flex align-items-center">
              <Person className="me-3" size={20} />
              <span><strong>Nombre:</strong> {user?.name}</span>
            </li>
            <li className="list-group-item d-flex align-items-center">
              <Envelope className="me-3" size={20} />
              <span><strong>Email:</strong> {user?.email}</span>
            </li>
            <li className="list-group-item d-flex align-items-center">
              <Phone className="me-3" size={20} />
              <span><strong>Teléfono:</strong> {user?.phone}</span>
            </li>
          </ul>
          <div className="mt-3">
            <Button variant="success" onClick={handleShowModal}>
              <Gear className="me-2" /> Configurar API Botix
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para configurar API */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Configurar API de Botix</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Acción</Form.Label>
              <Form.Select name="action" value={apiData.action} onChange={handleChange}>
                <option value="create">Crear</option>
                <option value="update">Actualizar</option>
                <option value="delete">Eliminar</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de asignación</Form.Label>
              <Form.Control name="assignment_type" value={apiData.assignment_type} onChange={handleChange} placeholder="Ej. colaborador" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>ID de asignación</Form.Label>
              <Form.Control name="assignment_id" type="number" value={apiData.assignment_id} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Token de Botix</Form.Label>
              <Form.Control name="Authorization" value={apiData.Authorization} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Company ID</Form.Label>
              <Form.Control name="X_Company_ID" value={apiData.X_Company_ID} onChange={handleChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="success" onClick={handleSubmit}>Guardar Configuración</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ShowProfile;
