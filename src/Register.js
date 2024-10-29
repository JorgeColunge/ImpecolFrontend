import React, { useState } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css'; // Opcional: para agregar estilos personalizados

function Register() {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [rol, setRol] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [image, setImage] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:10000/api/register', { id, name, lastname, rol, email, phone, password});
      if (response.data.success) {
        setMessage("Usuario registrado exitosamente");
      } else {
        setMessage(response.data.message);
      }
    } catch (err) {
      setMessage("Error al registrar usuario");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="row w-100">
        <div className="col-md-6 bg-light p-5 rounded-start shadow-lg">
          <div className="text-center mb-4">
            <img src="/images/Logo Vertical.png" alt="Logo" width="150" /> {/* Ajusta el tamaño si es necesario */}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Número de documento"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Nombres"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Apellidos"
                value={lastname}
                onChange={(e) => setLastname(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Cargo"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="number"
                className="form-control"
                placeholder="Número de celular"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 mb-3">Registrarse</button>
            {message && <p className="text-success text-center">{message}</p>}
          </form>
          <div className="text-center">
            <p className="mt-3">
              ¿Ya tienes una cuenta? <a href="/login" className="text-decoration-none">Iniciar sesión aquí</a>
            </p>
          </div>
        </div>
        <div className="col-md-6 d-none d-md-flex align-items-center justify-content-center bg-primary rounded-end">
          <div className="text-center text-white">
            <h1>Únete a nuestra comunidad!</h1>
            <p>Descubre un mundo de oportunidades.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;