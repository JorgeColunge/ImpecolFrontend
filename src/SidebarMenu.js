import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUsers, faSignOutAlt, faBars, faCalendar, faFileAlt, faChartBar } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SidebarMenu.css';

function SidebarMenu({ onLogout, userInfo }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="menu-toggle" onClick={toggleMenu}>
        <FontAwesomeIcon icon={faBars} size="lg" />
      </div>
      <div className="logo-container mt-3 mb-3">
        <img src="/path/to/your-logo.png" alt="Logo" className="logo" />
        {isOpen && (
          <div className="user-info">
            <h5>{userInfo?.name || 'Usuario'}</h5> {/* Muestra el nombre o 'Usuario' si no está disponible */}
            <span>{userInfo?.rol || 'Cargo'}</span> {/* Muestra el rol o 'Cargo' si no está disponible */}
          </div>
        )}
      </div>
      <ul className="nav flex-column icon-list">
        <li className="nav-item">
          <Link to="/profile" className="nav-link" title="Perfil">
            <FontAwesomeIcon icon={faUser} />
            {isOpen && <span>Perfil</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/users" className="nav-link" title="Usuarios">
            <FontAwesomeIcon icon={faUsers} />
            {isOpen && <span>Usuarios</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/calendar" className="nav-link" title="Calendario">
            <FontAwesomeIcon icon={faCalendar} />
            {isOpen && <span>Calendario</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/reports" className="nav-link" title="Informes">
            <FontAwesomeIcon icon={faFileAlt} />
            {isOpen && <span>Informes</span>}
          </Link>
        </li>
        <li className="nav-item">
          <Link to="/statistics" className="nav-link" title="Estadísticas">
            <FontAwesomeIcon icon={faChartBar} />
            {isOpen && <span>Estadísticas</span>}
          </Link>
        </li>
        <li className="nav-item">
          <button className="nav-link btn btn-link" onClick={handleLogout} title="Cerrar Sesión">
            <FontAwesomeIcon icon={faSignOutAlt} />
            {isOpen && <span>Cerrar Sesión</span>}
          </button>
        </li>
      </ul>
    </div>
  );
}

export default SidebarMenu;