import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUsers, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'; // Añade más iconos según necesites
import 'bootstrap/dist/css/bootstrap.min.css';
import './SidebarMenu.css'; // Asegúrate de tener este archivo para los estilos

function SidebarMenu({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout(); // Llama a la función para cerrar sesión
    navigate('/login'); // Redirige a la página de login
  };

  return (
    <div className="sidebar d-flex flex-column align-items-center">
      <div className="logo-container mt-3 mb-3">
        <img src="/path/to/your-logo.png" alt="Logo" className="logo" />
      </div>
      <ul className="nav flex-column icon-list">
        <li className="nav-item">
          <Link to="/profile" className="nav-link" title="Perfil">
            <FontAwesomeIcon icon={faUser} />
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/settings" className="nav-link" title="Usuarios">
            <FontAwesomeIcon icon={faUsers} />
          </Link>
        </li>
        <li className="nav-item">
          <button className="nav-link btn btn-link" onClick={handleLogout} title="Cerrar Sesión">
            <FontAwesomeIcon icon={faSignOutAlt} />
          </button>
        </li>
      </ul>
    </div>
  );
}

export default SidebarMenu;
