import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

function SidebarMenu({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout(); // Llama a la función para cerrar sesión
    navigate('/login'); // Redirige a la página de login
  };

  return (
    <div className="bg-light sidebar">
      <h4 className="text-center mt-3">Menú</h4>
      <ul className="nav flex-column mt-4">
        <li className="nav-item">
          <Link to="/profile" className="nav-link">Perfil</Link>
        </li>
        <li className="nav-item">
          <Link to="/settings" className="nav-link">Usuarios</Link>
        </li>
        <li className="nav-item">
          {/* Usa un botón en lugar de un enlace para cerrar sesión */}
          <button className="nav-link btn btn-link" onClick={handleLogout}>Cerrar Sesión</button>
        </li>
      </ul>
    </div>
  );
}

export default SidebarMenu;