import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function ShowProfile() {
  const { id } = useParams(); // Obtén el ID del usuario desde la URL
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:10000/api/users/${id}`);
        setUser(response.data);
      } catch (error) {
        console.error("Error al obtener el perfil del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (loading) return <div>Cargando perfil del usuario...</div>;

  return (
    <div className="container mt-5">
      <h2>Perfil del Usuario</h2>
      {user ? (
        <div className="card p-4">
          <div className="text-center">
            <img
              src={`http://localhost:10000${user.image || '/images/default-profile.png'}`}
              alt="Profile"
              className="rounded-circle"
              width="150"
              height="150"
            />
          </div>
          <div className="mt-4">
            <p><strong>Nombre:</strong> {user.name}</p>
            <p><strong>Apellidos:</strong> {user.lastname}</p>
            <p><strong>Rol:</strong> {user.rol}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Teléfono:</strong> {user.phone}</p>
          </div>
        </div>
      ) : (
        <p>El usuario no se encontró.</p>
      )}
    </div>
  );
}

export default ShowProfile;
