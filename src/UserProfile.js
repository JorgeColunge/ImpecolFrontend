import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function UserProfile({ userInfo }) {
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState('/images/default-profile.png');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserInfo = JSON.parse(localStorage.getItem("user_info"));
    if (storedUserInfo) {
      setProfilePic(`http://localhost:10000${storedUserInfo.image || '/images/default-profile.png'}`);
    }
    setLoading(false);
  }, []);

  const handleEditProfile = () => {
    navigate(`/edit-profile/${userInfo.id_usuario}`);
  };

  if (loading) return <div className="text-center mt-5">Cargando...</div>;

  return (
    <div className="container mt-5">
      <div className="text-center">
        <img
          src={profilePic}
          alt="Profile"
          className="rounded-circle"
          width="150"
          height="150"
        />
      </div>
      <div className="mt-5 text-center">
        <h2>Información del Usuario</h2>
        <ul className="list-group mt-3">
          <li className="list-group-item"><strong>Nombre:</strong> {userInfo.name}</li>
          <li className="list-group-item"><strong>Apellido:</strong> {userInfo.lastname}</li>
          <li className="list-group-item"><strong>Rol:</strong> {userInfo.rol}</li>
          <li className="list-group-item"><strong>Email:</strong> {userInfo.email}</li>
          <li className="list-group-item"><strong>Teléfono:</strong> {userInfo.phone}</li>
        </ul>
        <button onClick={handleEditProfile} className="btn btn-secondary mt-3">Editar</button>
      </div>
    </div>
  );
}

export default UserProfile;
