import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, { email, password });
  
      if (response.data.success) {
        const userData = response.data.user;
        localStorage.setItem("user_info", JSON.stringify(userData));
        onLogin(userData);
        // Redirigir según el rol del usuario
        if (userData.rol === "Cliente") {
          navigate('/client-profile');
        } else {
            navigate('/profile');
        }
      } else {
        setError(response.data.message || "Credenciales incorrectas");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Problema de red o error en el servidor");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="row w-100"  style={{marginTop:'50px', marginBottom:'200px'}}>
        <div className="col-md-6 bg-light p-5 rounded-start shadow-lg">
          <div className="text-center mb-4 px-sm-0 px-md-2 mx-md-2 px-lg-5 mx-lg-5">
            <img src="/images/LogoImpecol.png" alt="Logo" className="px-5 img-fluid" />
          </div>
          <form onSubmit={handleSubmit}>
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
                type="password"
                className="form-control"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check">
                <input type="checkbox" className="form-check-input" id="rememberMe" />
                <label className="form-check-label" htmlFor="rememberMe">Recuérdame</label>
              </div>
              <a href="#" className="text-success text-decoration-none">¿Olvidaste tu contraseña?</a>
            </div>
            <button type="submit" className="btn btn-primary w-100 mb-3">Iniciar Sesión</button>
            {error && <p className="text-danger text-center">{error}</p>}
            <a href="/register" className="text-success text-decoration-none">Resgístrate aquí</a>
          </form>
        </div>
        <div className="col-md-6 d-flex align-items-center justify-content-center bg-success rounded-end">
          <div className="text-center text-white">
            <h1>¡Limpieza impecable!</h1>
            <p>Tu aliado en el aseo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
