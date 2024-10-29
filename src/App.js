import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UserProfile from './UserProfile';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true); // Estado para verificar si la sesión se está cargando

  useEffect(() => {
    // Verifica si hay información de usuario en localStorage al cargar la app
    const storedUserInfo = localStorage.getItem("user_info");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo)); // Establece la información del usuario
      setIsLoggedIn(true); // Marca como logged in si hay información
    }
    setLoading(false); // La carga ha terminado
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUserInfo(userData);
    localStorage.setItem("user_info", JSON.stringify(userData)); // Guarda la información del usuario en localStorage
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    localStorage.removeItem("user_info"); // Borra la información del usuario al cerrar sesión
  };

  // Si está en proceso de carga, muestra un mensaje o spinner
  if (loading) return <div>Cargando...</div>;

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Redirige a /profile si está logueado, sino redirige a /login */}
          <Route path="/" element={isLoggedIn ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          {/* Solo muestra UserProfile si está logueado */}
          <Route 
            path="/profile" 
            element={isLoggedIn ? <UserProfile userInfo={userInfo} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;