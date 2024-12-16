import React, { useEffect, useState } from 'react';
import api from './Api';
import { saveRequest, isOffline } from './offlineHandler';
import { initUsersDB, saveUsers, getUsers } from './indexedDBHandler';
import { Button, Table, InputGroup, FormControl, Modal, Form, Dropdown } from 'react-bootstrap';
import { PencilSquare, Trash, Envelope, Telephone, Whatsapp, ThreeDots } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';
import './App.css'
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
    rol: 'Técnico',
    password: '',
    email: '', // Campo agregado para email
    image: null,
  });

  const navigate = useNavigate();

  const userInfo = JSON.parse(localStorage.getItem("user_info"));
  const canAddUser = userInfo?.rol === "Superadministrador" || userInfo?.rol === "Administrador";
  const [profilePicPreview, setProfilePicPreview] = useState('/images/default-profile.png');
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú está abierto y se hace clic fuera, cerrarlo
      if (dropdownPosition && !event.target.closest(".dropdown-menu")) {
        closeDropdown();
      }
    };

    // Escuchar clics en todo el documento
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownPosition]);

  const handleDropdownClick = (e, user) => {
    e.stopPropagation(); // Prevenir que el clic afecte otras acciones de la fila
    const rect = e.target.getBoundingClientRect(); // Obtener posición del botón
    if (selectedUser?.id === user.id) {
      // Si se hace clic nuevamente en el mismo botón, cerrar el menú
      closeDropdown();
    } else {
      setDropdownPosition({
        top: rect.bottom + window.scrollY, // Coordenada Y del botón
        left: rect.left + window.scrollX, // Coordenada X del botón
      });
      setSelectedUser(user); // Guardar el usuario seleccionado
    }
  };

  const closeDropdown = () => {
    setDropdownPosition(null);
    setSelectedUser(null);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        if (isOffline()) {
          // Cargar usuarios desde IndexedDB si está offline
          const localUsers = await getUsers();
          setUsers(localUsers);
          console.log('Usuarios cargados desde IndexedDB');
        } else {
          // Cargar usuarios desde el servidor
          const response = await api.get('/users');
          setUsers(response.data);
    
          // Guardar usuarios en IndexedDB
          await saveUsers(response.data, true);
          console.log('Usuarios guardados en IndexedDB');
        }
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    return () => {
      users.forEach((user) => {
        if (user.imageUrl) {
          URL.revokeObjectURL(user.imageUrl); // Libera la memoria de las URLs temporales
        }
      });
    };
  }, [users]); 

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const validateUserData = () => {
    const { id, name, lastname, phone, rol, password, email } = newUser;
    if (!id || !name || !lastname || !phone || !rol || !password || !email) {
      alert("Todos los campos son obligatorios.");
      return false;
    }
    return true;
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };  

  const filteredUsers = users.filter((user) => {
    const search = searchTerm.toLowerCase();
    return (
      user.id.toLowerCase().includes(search) ||
      user.name.toLowerCase().includes(search) ||
      user.lastname.toLowerCase().includes(search) ||
      user.phone.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.rol.toLowerCase().includes(search)
    );
  });  

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewUser({ ...newUser, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicPreview(reader.result); // Actualiza la previsualización
      };
      reader.readAsDataURL(file);
    }
  };  

  function hexToRgb(hex) {
    const bigint = parseInt(hex.replace("#", ""), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
  }

  const handleAddUser = async () => {
    if (!validateUserData()) return;
  
    const formData = new FormData();
    formData.append('id', newUser.id);
    formData.append('name', newUser.name);
    formData.append('lastname', newUser.lastname);
    formData.append('phone', newUser.phone);
    formData.append('rol', newUser.rol);
    formData.append('password', newUser.password);
    formData.append('email', newUser.email);
  
    if (newUser.image) {
      formData.append('image', newUser.image);
    }
  
    try {
      if (isOffline()) {
        const blob = newUser.image ? await newUser.image.arrayBuffer() : null;
        const userOffline = {
          id: newUser.id,
          name: newUser.name,
          lastname: newUser.lastname,
          phone: newUser.phone,
          rol: newUser.rol,
          password: newUser.password,
          email: newUser.email,
          imageBlob: blob ? new Blob([blob], { type: newUser.image.type }) : null,
          synced: false,
        };
  
        console.log('Usuario a guardar offline:', userOffline);
        await saveUsers([userOffline], false);
        setUsers([...users, userOffline]);
        alert('Usuario creado en modo offline.');
      } else {
        const response = await api.post('/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
  
        const newUserWithImage = {
          ...newUser,
          image: response.data.profilePicURL,
          synced: true,
        };
  
        console.log('Usuario creado online:', newUserWithImage);
        await saveUsers([newUserWithImage], true);
        setUsers([...users, newUserWithImage]);
        alert('Usuario agregado exitosamente.');
      }
  
      handleCloseModal();
    } catch (error) {
      console.error('Error al agregar usuario:', error);
      alert(error.response?.data?.message || 'Hubo un error al agregar el usuario.');
    }
  };

  

  // Función para eliminar el usuario
const deleteUser = async (id) => {
  if (isOffline()) {
    if (window.confirm("¿Estás seguro de que deseas eliminar este usuario en modo offline?")) {
      try {
        const db = await initUsersDB();
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const user = await store.get(id);

        if (user) {
          user.deleted = true;
          await store.put(user);
        }

        // Guarda la solicitud en IndexedDB
        await saveRequest({
          url: `/users/${id}`, // Ruta relativa será completada en `saveRequest`
          method: 'DELETE',
          headers: {},
        });

        // Actualiza la lista local de usuarios
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
        alert('Usuario eliminado en modo offline.');
      } catch (error) {
        console.error('Error al marcar usuario para eliminación offline:', error);
      }
    }
  } else {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
      alert('Usuario eliminado exitosamente.');
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Hubo un error al eliminar el usuario.');
    }
  }
};


  if (loading) return <div>Cargando usuarios...</div>;

  return (
    <div className="container mt-4">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="w-25">
          <label>Mostrar </label>
          <select className="form-select d-inline w-auto mx-2">
            <option>10</option>
            <option>20</option>
            <option>30</option>
          </select>
          <label> registros</label>
        </div>
        <InputGroup className="w-75">
          <FormControl
            placeholder="Buscar"
            aria-label="Buscar"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </InputGroup>
      </div>

      <Table striped hover responsive className="modern-table">
        <thead>
          <tr>
            <th className="text-center">Foto</th>
            <th className="text-center">ID</th>
            <th className="text-center">Usuario</th>
            <th className="text-center">Sector</th>
            <th className="text-center">Último Ingreso</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr
              key={user.id}
              onClick={() => navigate(`/show-profile/${user.id}`)}
            >
              <td className="text-center align-middle  zoom">
                {isOffline() ? (
                  user.imageUrl ? (
                    <div className="img-mask mx-auto">
                      <img
                        src={user.imageUrl}
                        alt="Foto de perfil"
                        className="rounded-img"
                        width="50"
                        height="50"
                      />
                    </div>
                  ) : (
                    <div>No Image</div>
                  )
                ) : (
                  user.image ? (
                    <div className="img-mask-sm mx-auto">
                      <img
                        src={`${user.image}`}
                        alt="Foto de perfil"
                        className="rounded-img-sm"
                        width="50"
                        height="50"
                      />
                    </div>
                  ) : (
                    <div>No Image</div>
                  )
                )}
              </td>
              <td className="text-center align-middle"><p>{user.id}</p></td>
              <td className="text-center align-middle"><p>{user.name}</p></td>
              <td className="text-center align-middle"><p>{user.rol}</p></td>
              <td className="text-center align-middle"><p>{user.lastLogin || 'N/A'}</p></td>
              <td className="text-center align-middle">
                <div
                  className="action-icon"
                  onClick={(e) => handleDropdownClick(e, user)}
                >
                  ⋮ {/* Ícono o botón para abrir el dropdown */}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Dropdown global */}
      {dropdownPosition && selectedUser && (
        <div
          className="dropdown-menu acciones show"
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 1060,
          }}
        >
          <Dropdown.Item
            onClick={() => {
              closeDropdown();
              navigate(`/edit-profile/${selectedUser.id}`);
            }}
          >
            <PencilSquare className="me-2" /> Editar
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              closeDropdown();
              deleteUser(selectedUser.id);
            }}
          >
            <Trash className="me-2 text-danger" /> Eliminar
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              closeDropdown();
              window.open(`tel:${selectedUser.phone}`, '_self');
            }}
          >
            <Telephone className="me-2 text-success" /> Llamar
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              closeDropdown();
              window.open(`https://wa.me/${selectedUser.phone}`, '_blank');
            }}
          >
            <Whatsapp className="me-2 text-success" /> WhatsApp
          </Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              closeDropdown();
              window.open(`mailto:${selectedUser.email}`, '_self');
            }}
          >
            <Envelope className="me-2 text-primary" /> Correo
          </Dropdown.Item>
        </div>
      )}

      {canAddUser && (
        <div className="d-flex justify-content-end mt-2 mb-2">
          <Button variant="success" onClick={handleShowModal}>
            Agregar Usuario
          </Button>
        </div>
      )}

    <Modal show={showModal} onHide={handleCloseModal} centered size="mg">
      <Modal.Header closeButton>
        <Modal.Title>Registrar Nuevo Usuario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="text-center mb-4">
          <div className="img-mask mx-auto">
            <img
              src={profilePicPreview} // Previsualización de la imagen cargada
              alt="Foto de perfil"
              className="rounded-img shadow-sm"
              width="150"
              height="150"
              onClick={() => document.querySelector('#file-input').click()}
              style={{ cursor: 'pointer' }}
              title="Haz clic para cargar una imagen"
            />
          </div>
          <input
            id="file-input"
            type="file"
            className="d-none"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
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
          <Form.Group controlId="formUserRol" className="mb-3">
            <Form.Label>Cargo</Form.Label>
            <Form.Control as="select" name="rol" value={newUser.rol} onChange={handleInputChange}>
              <option value="Superadministrador">Superadministrador</option>
              <option value="Administrador">Administrador</option>
              <option value="Comercial">Comercial</option>
              <option value="Supervisor Técnico">Supervisor Técnico</option>
              <option value="Técnico">Técnico</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="formUserEmail" className="mb-3">
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control type="email" name="email" value={newUser.email} onChange={handleInputChange} />
          </Form.Group>
          <Form.Group controlId="formUserPassword" className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control type="password" name="password" value={newUser.password} onChange={handleInputChange} />
          </Form.Group>
          <Form.Group controlId="formUserColor" className="mb-3">
            <Form.Label>Color</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="color"
                name="color"
                value={newUser.hexColor || "#ffffff"}
                onChange={(e) => {
                  const hexColor = e.target.value;
                  const rgbColor = hexToRgb(hexColor);
                  setNewUser((prevUser) => ({
                    ...prevUser,
                    hexColor,
                    color: rgbColor,
                  }));
                }}
                style={{ width: "60px", height: "40px", marginRight: "10px" }}
              />
              <span className="text-muted">Color seleccionado: {newUser.color || "rgb(255, 255, 255)"}</span>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="dark" onClick={handleCloseModal}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleAddUser}>
          Registrar Usuario
        </Button>
      </Modal.Footer>
    </Modal>
    </div>
  );
}

export default UserList;