import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Table, InputGroup, FormControl } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Llama al backend para obtener la lista de usuarios
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

  // Función para ver el perfil del usuario
  const viewProfile = (id) => {
    navigate(`/profile/${id}`);
  };

  // Función para editar el usuario
  const editUser = (id) => {
    navigate(`/edit-profile/${id}`);
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
                <Button variant="info" size="sm" className="me-2" onClick={() => viewProfile(user.id)}>
                  <i className="fas fa-eye"></i>
                </Button>
                <Button variant="success" size="sm" className="me-2" onClick={() => editUser(user.id)}>
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

      <div className="d-flex justify-content-between align-items-center mt-3">
        <span>Mostrando del 1 al {users.length} de un total de {users.length} registros</span>
        <Button variant="primary">Agregar Usuario</Button>
      </div>

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