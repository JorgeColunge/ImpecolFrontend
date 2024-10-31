import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import UserProfile from './UserProfile';
import EditProfile from './EditProfile';
import SidebarMenu from './SidebarMenu';
import UserList from './UserList';
import ClientList from './ClientList';
import 'bootstrap/dist/css/bootstrap.min.css';
import ShowProfile from './ShowProfile'; // Importa el componente ShowProfile

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserInfo = localStorage.getItem("user_info");
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUserInfo(userData);
    localStorage.setItem("user_info", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    localStorage.removeItem("user_info");
  };

  const handleProfileUpdate = (updatedUserInfo) => {
    setUserInfo(updatedUserInfo);
    localStorage.setItem("user_info", JSON.stringify(updatedUserInfo));
  };

  if (loading) return <div className="text-center mt-5">Cargando...</div>;

  return (
    <Router>
      <div className="App d-flex">
        <SidebarMenu onLogout={handleLogout} />
        <div className="main-content flex-grow-1">
          <Routes>
            <Route path="/" element={isLoggedIn ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
            <Route path="/login" element={isLoggedIn ? <Navigate to="/profile" /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={isLoggedIn ? <Navigate to="/profile" /> : <Register />} />
            <Route path="/profile" element={isLoggedIn ? <UserProfile userInfo={userInfo} /> : <Navigate to="/login" />} />
            <Route path="/edit-profile/:id" element={isLoggedIn ? <EditProfile userInfo={userInfo} onProfileUpdate={handleProfileUpdate} /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isLoggedIn ? <UserList /> : <Navigate to="/login" />} />
            <Route path="/clients" element={isLoggedIn ? <ClientList /> : <Navigate to="/login" />} />
            <Route path="/show-profile/:id" element={<ShowProfile />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
