import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

function UserProfile({ userInfo }) {
  const [profilePic, setProfilePic] = useState(userInfo?.photo || '/images/default-profile.png');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const formData = new FormData();
      formData.append('image', selectedFile); // Cambia 'profilePic' a 'image'
  
      try {
        const response = await axios.post('http://localhost:10000/api/upload', formData);
        setProfilePic(response.data.profilePicURL);
        alert("Foto actualizada exitosamente!");
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error al cargar la imagen");
      }
    }
  };
  

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
        <div className="mt-3">
          <input type="file" onChange={handleFileChange} className="form-control-file" />
          <button onClick={handleUpload} className="btn btn-primary mt-2">Actualizar foto</button>
        </div>
      </div>

      <div className="mt-5">
        <h2 className="text-center">Información del Usuario</h2>
        <ul className="list-group mt-3">
          <li className="list-group-item"><strong>Nombre:</strong> {userInfo?.name}</li>
          <li className="list-group-item"><strong>Apellido:</strong> {userInfo?.lastname}</li>
          <li className="list-group-item"><strong>Rol:</strong> {userInfo?.rol}</li>
          <li className="list-group-item"><strong>Email:</strong> {userInfo?.email}</li>
          <li className="list-group-item"><strong>Teléfono:</strong> {userInfo?.phone}</li>
        </ul>
      </div>
    </div>
  );
}

export default UserProfile;
