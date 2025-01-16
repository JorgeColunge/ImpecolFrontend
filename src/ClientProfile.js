import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { PencilSquare, Person, Envelope, Phone, Map } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function ClientProfile({ userInfo }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/${userInfo.id_usuario}`);
        setUser(response.data);
      } catch (error) {
        console.error("Error al obtener la información del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userInfo.id_usuario]);

  const handleEditProfile = () => {
    navigate(`/edit-my-profile-client/${userInfo.id_usuario}`);
  };

  if (loading) return <div className="text-center mt-5">Cargando...</div>;

  return (
    <div className="container mt-3 d-flex justify-content-center">
      <div className="card shadow-sm" style={{ maxWidth: '400px', borderRadius: '15px' }}>
        <div className="card-body text-center position-relative">
          <div className="position-relative">
            <div className='img-mask mx-auto'>
            <img
              src={`${user?.photo || '/images/default-profile.png'}`}
              alt="Profile"
              className="rounded-img shadow-sm"
              width="150"
              height="150"
            />
            </div>
            <PencilSquare
              className="position-absolute"
              size={22}
              style={{ top: 0, right: 0, cursor: 'pointer' }}
              onClick={handleEditProfile}
              title="Editar perfil"
            />
          </div>
          <h5 className="mt-3">{user?.name}</h5>
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
            <li className="list-group-item d-flex align-items-center">
              <Map className="me-3" size={20} />
              <span><strong>Dirección:</strong> {user?.address}, {user?.city}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ClientProfile;
