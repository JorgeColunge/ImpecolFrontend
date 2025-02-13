import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getProfile, saveProfile } from './indexedDBHandler';
import { PencilSquare, Person, Envelope, Phone } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function UserProfile({ userInfo }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (navigator.onLine) { 
          console.log("Modo online: obteniendo perfil del servidor...");
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${userInfo.id_usuario}`);
          setUser(response.data);
          await saveProfile(response.data); // Guarda el perfil en IndexedDB
        } else {
          console.log("Modo offline: obteniendo perfil de IndexedDB...");
          const offlineUser = await getProfile(userInfo.id_usuario);
          if (offlineUser) {
            setUser(offlineUser);
          } else {
            console.warn("No hay datos en IndexedDB para este usuario.");
          }
        }
      } catch (error) {
        console.error("Error al obtener la información del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userInfo.id_usuario]);

  const handleEditProfile = () => {
    navigate(`/edit-my-profile/${userInfo.id_usuario}`);
  };

  if (loading) return <div className="text-center mt-5">Cargando...</div>;

  return (
    <div className="container mt-3 d-flex justify-content-center">
      <div className="card shadow-sm" style={{ maxWidth: '400px', borderRadius: '15px' }}>
        <div className="card-body text-center position-relative">
          <div className="position-relative">
            <div className='img-mask mx-auto'>
            <img
              src={`${user?.image || "/images/Logo Fumiplagax.png"}`}
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
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
