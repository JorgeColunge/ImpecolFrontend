import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function EditProfile({ userInfo }) {
  const [name, setName] = useState(userInfo?.name || '');
  const [lastname, setLastname] = useState(userInfo?.lastname || '');
  const [email, setEmail] = useState(userInfo?.email || '');
  const [phone, setPhone] = useState(userInfo?.phone || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('lastname', lastname);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('userId', userInfo.id_usuario); // Asegúrate de pasar el ID del usuario
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
  
    try {
      const response = await axios.post('http://localhost:10000/api/updateProfile', formData);
      
      // Verificar respuesta del servidor
      if (response.status === 200) {
        console.log("Perfil actualizado exitosamente:", response.data);
        alert("Perfil actualizado exitosamente!");
      } else {
        console.warn("Error al actualizar el perfil:", response);
        alert("Error al actualizar el perfil");
      }
  
      // Actualiza el perfil en localStorage
      const updatedUserInfo = { ...userInfo, name, lastname, email, phone, photo: response.data.profilePicURL };
      localStorage.setItem("user_info", JSON.stringify(updatedUserInfo));
  
      navigate('/profile'); // Redirige de vuelta al perfil
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al actualizar el perfil");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Editar Perfil</h2>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm p-4">
            <div className="mb-3 text-center">
              <img
                src={userInfo?.photo ? `http://localhost:10000${userInfo.photo}` : '/images/default-profile.png'}
                alt="Profile"
                className="rounded-circle"
                width="100"
                height="100"
              />
            </div>
            <form>
              <div className="mb-3">
                <label className="form-label">Nombre</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Apellido</label>
                <input
                  type="text"
                  className="form-control"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  className="form-control"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Foto de perfil</label>
                <input
                  type="file"
                  className="form-control"
                  onChange={handleFileChange}
                />
              </div>
              <div className="text-center">
                <button type="button" onClick={handleSave} className="btn btn-primary me-2">Guardar cambios</button>
                <button type="button" onClick={() => navigate('/profile')} className="btn btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;