import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Table, InputGroup, FormControl, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    lastname: '',
    phone: '',
    email: '', // Agregamos el campo de email
    role: 'técnico',
    password: '',
    image: null,
  });

  const navigate = useNavigate();

  // Obtener el rol del usuario actualmente logueado desde localStorage
  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const isAuthorized = userInfo?.rol?.toLowerCase() === "superadministrador" || userInfo?.rol?.toLowerCase() === "administrador";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:10000/api/users');
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Funciones para manejo del modal
  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleFileChange = (e) => {
    setNewUser({ ...newUser, image: e.target.files[0] });
  };

  const handleAddUser = async () => {
    // Verificar si el rol del usuario permite agregar usuarios
    if (!isAuthorized) {
      alert("No tienes permisos para agregar un usuario.");
      return;
    }

    const formData = new FormData();
    formData.append('id', newUser.id);
    formData.append('name', newUser.name);
    formData.append('lastname', newUser.lastname);
    formData.append('phone', newUser.phone);
    formData.append('email', newUser.email); // Agregar el email al formData
    formData.append('role', newUser.role);
    formData.append('password', newUser.password);
    if (newUser.image) formData.append('image', newUser.image);
  
    try {
      const userId = userInfo?.id_usuario; // Obtener user_id del usuario actual
      await axios.post('http://localhost:10000/api/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'user_id': userId // Incluir el user_id en los encabezados
        }
      });
      alert("Usuario agregado exitosamente");
      handleCloseModal();
      setUsers([...users, { ...newUser, image: URL.createObjectURL(newUser.image) }]);
    } catch (error) {
      console.error("Error al agregar usuario:", error);
      alert("Hubo un error al agregar el usuario.");
    }
  };

  // Función para eliminar el usuario
  const deleteUser = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      try {
        await axios.delete(`http://localhost:10000/api/users/${id}`);
        setUsers(users.filter(user => user.id !== id)); // Actualiza la lista de usuarios localmente
        alert("Usuario eliminado exitosamente.");
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("Hubo un error al eliminar el usuario.");
      }
    }
  };

  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-primary mb-4">Listado de Usuarios del Sistema</h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <label>Mostrar </label>
          <select className="form-select d-inline w-auto mx-2">
            <option>10</option>
            <option>20</option>
            <option>30</option>
          </select>
          <label> registros</label>
        </div>
        <InputGroup className="w-25">
          <FormControl placeholder="Buscar" aria-label="Buscar" />
        </InputGroup>
      </div>

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Foto</th>
            <th>ID</th>
            <th>Usuario</th>
            <th>Sector</th>
            <th>Último Ingreso</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <img 
                  src={`http://localhost:10000${user.image}`} // Ajusta la URL si es necesario
                  alt="Foto de perfil"
                  className="rounded-circle"
                  width="50"
                  height="50"
                />
              </td>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.rol}</td>
              <td>{user.lastLogin || "N/A"}</td>
              <td>
                <Button variant="info" size="sm" className="me-2" onClick={() => navigate(`/profile/${user.id}`)}>
                  <i className="fas fa-eye"></i>
                </Button>
                <Button variant="success" size="sm" className="me-2" onClick={() => navigate(`/edit-profile/${user.id}`)}>
                  <i className="fas fa-edit"></i>
                </Button>
                <Button variant="danger" size="sm" onClick={() => deleteUser(user.id)}>
                  <i className="fas fa-trash"></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Botón "Agregar Usuario" visible para todos, pero solo roles autorizados pueden agregar */}
      <div className="d-flex justify-content-end mt-3">
        <Button variant="primary" onClick={handleShowModal}>
          Agregar Usuario
        </Button>
      </div>

      {/* Modal de registro de usuario */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Nuevo Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formUserID" className="mb-3">
              <Form.Label>Número de Documento</Form.Label>
              <Form.Control type="text" name="id" value={newUser.id} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formUserName" className="mb-3">
              <Form.Label>Nombres</Form.Label>
              <Form.Control type="text" name="name" value={newUser.name} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formUserLastName" className="mb-3">
              <Form.Label>Apellidos</Form.Label>
              <Form.Control type="text" name="lastname" value={newUser.lastname} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formUserPhone" className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control type="text" name="phone" value={newUser.phone} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formUserEmail" className="mb-3">
              <Form.Label>Correo Electrónico</Form.Label>
              <Form.Control type="email" name="email" value={newUser.email} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formUserRole" className="mb-3">
              <Form.Label>Cargo</Form.Label>
              <Form.Control as="select" name="role" value={newUser.role} onChange={handleInputChange}>
                <option value="superadministrador">Superadministrador</option>
                <option value="administrador">Administrador</option>
                <option value="comercial">Comercial</option>
                <option value="supervisor técnico">Supervisor Técnico</option>
                <option value="técnico">Técnico</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="formUserPassword" className="mb-3">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control type="password" name="password" value={newUser.password} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formUserImage" className="mb-3">
              <Form.Label>Foto de perfil</Form.Label>
              <Form.Control type="file" onChange={handleFileChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAddUser}>
            Registrar Usuario
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Paginación */}
      <div className="d-flex justify-content-center mt-3">
        <nav>
          <ul className="pagination">
            <li className="page-item disabled">
              <button className="page-link">Anterior</button>
            </li>
            <li className="page-item active">
              <button className="page-link">1</button>
            </li>
            <li className="page-item">
              <button className="page-link">Siguiente</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}

export default UserList;