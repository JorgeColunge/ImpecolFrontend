import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function EditProfile() {
  const { id } = useParams(); // Obtén el id del usuario desde la URL
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [profilePic, setProfilePic] = useState('/images/default-profile.png');

  useEffect(() => {
    // Llama al backend para obtener la información del usuario por su id
    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`http://localhost:10000/api/users/${id}`);
        const userData = response.data;
        setName(userData.name);
        setLastname(userData.lastname);
        setEmail(userData.email);
        setPhone(userData.phone);
        if (userData.image) {
          setProfilePic(`http://localhost:10000${userData.image}`);
        }
      } catch (error) {
        console.error("Error al obtener información del usuario:", error);
        alert("No se pudo cargar la información del usuario.");
      }
    };

    fetchUserInfo();
  }, [id]);

  const handleFileChange = (e) => setSelectedFile(e.target.files[0]);

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('lastname', lastname);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('userId', id); // Usa el ID del usuario de los parámetros de la URL
    if (selectedFile) {
      formData.append('image', selectedFile); // Agrega el archivo de imagen si se seleccionó uno
    }

    try {
      const response = await axios.post('http://localhost:10000/api/updateProfile', formData);

      if (response.status === 200) {
        console.log("Perfil actualizado exitosamente:", response.data);
        alert("Perfil actualizado exitosamente!");
      } else {
        console.warn("Error al actualizar el perfil:", response);
        alert("Error al actualizar el perfil");
      }

      navigate(`/profile/${id}`); // Redirige de vuelta al perfil
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
                src={profilePic}
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
                <button type="button" onClick={() => navigate(`/profile/${id}`)} className="btn btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;