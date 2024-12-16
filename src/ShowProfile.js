import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { PencilSquare, Person, Envelope, Phone } from 'react-bootstrap-icons';
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
    <div className="container mt-3 d-flex justify-content-center">
      <div className="card shadow-sm" style={{ maxWidth: '400px', borderRadius: '15px' }}>
        <div className="card-body text-center position-relative">
          <div className="position-relative">
            <div className="img-mask mx-auto">
              <img
                src={`${user?.image || '/images/default-profile.png'}`}
                alt="Profile"
                className="rounded-img shadow-sm"
                width="150"
                height="150"
              />
            </div>
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

export default ShowProfile;
