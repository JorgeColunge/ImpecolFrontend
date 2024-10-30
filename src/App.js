import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UserProfile from './UserProfile';
import EditProfile from './EditProfile'; // Importar el componente de edición
import SidebarMenu from './SidebarMenu'; // Importa el componente del menú lateral

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

  const handleProfileUpdate = (updatedUserInfo) => {
    setUserInfo(updatedUserInfo);
    localStorage.setItem("user_info", JSON.stringify(updatedUserInfo));
  };

  // Si está en proceso de carga, muestra un mensaje o spinner
  if (loading) return <div>Cargando...</div>;

  return (
    <Router>
      <div className="App d-flex">
        <SidebarMenu onLogout={handleLogout} /> {/* Pasar handleLogout a SidebarMenu */}
        <div className="main-content flex-grow-1">
          <Routes>
            {/* Redirige a /profile si está logueado, sino redirige a /login */}
            <Route path="/" element={isLoggedIn ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
            <Route path="/login" element={isLoggedIn ? <Navigate to="/profile" /> : <Login onLogin={handleLogin} />} /> {/* Redirige a profile si está logueado */}
            <Route path="/register" element={isLoggedIn ? <Navigate to="/profile" /> : <Register />} /> {/* Redirige a profile si está logueado */}
            {/* Solo muestra UserProfile si está logueado */}
            <Route 
              path="/profile" 
              element={isLoggedIn ? <UserProfile userInfo={userInfo} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            {/* Ruta para editar perfil */}
            <Route 
              path="/edit-profile" 
              element={isLoggedIn ? <EditProfile userInfo={userInfo} onProfileUpdate={handleProfileUpdate} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;