import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUnsavedChanges } from './UnsavedChangesContext';
import { List, Person, People, Calendar3, JournalBookmarkFill, FileText, BarChart, ClipboardCheck, BoxArrowRight, Search, Megaphone, CurrencyDollar, Gear, CalendarDate, CalendarEvent, Eyedropper, PersonFillGear, GraphUp, ChatLeftDots, BoxArrowInUpRight } from 'react-bootstrap-icons';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './SidebarMenu.css';

function SidebarMenu({ onLogout, userInfo, isSidebarVisible, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {
    hasUnsavedChanges,
    setUnsavedRoute,
    setShowUnsavedModal,
  } = useUnsavedChanges();

  const [user, setUser] = useState(null); // Estado para manejar los datos del usuario

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user_info"));
    if (storedUser) {
      setUser(storedUser); // Actualiza el estado con los datos de localStorage
    }
  }, []);

  useEffect(() => {
    if (!userInfo?.id_usuario) return;
  
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:10000/api/users/${userInfo.id_usuario}`);
        setUser(response.data); // Actualiza el estado del usuario
      } catch (error) {
        console.error("Error al obtener los datos del usuario:", error);
      }
    };
  
    fetchUser();
  }, [userInfo?.id_usuario, userInfo]);  

  const handleNavigation = (path) => {
    if (hasUnsavedChanges) {
      setUnsavedRoute(path); // Configura la ruta pendiente
      setShowUnsavedModal(true); // Muestra el modal
      return;
    }
    navigate(path); // Navega directamente si no hay cambios pendientes
    if (isOpen) {
      toggleMenu(); // Colapsa la barra si está abierta
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    onToggle(!isOpen); // Llama a la función pasada como prop
  };
  

  const [profilePic, setProfilePic] = useState('/'); // Imagen predeterminada

  const menuItems = [
    {
      label: "Perfil",
      icon: <Person size={20} />,
      path: "/profile",
      roles: ["Técnico", "Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Usuarios",
      icon: <PersonFillGear size={20} />,
      path: "/users",
      roles: ["Administrador", "Superadministrador"],
    },
    {
      label: "Clientes",
      icon: <People size={20} />,
      path: "/clients",
      roles: ["Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Calendario",
      icon: <Calendar3 size={20} />,
      path: "/services-calendar",
      roles: ["Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Mi Calendario",
      icon: <CalendarEvent size={20} />,
      path: "/myservices-calendar",
      roles: ["Técnico", "Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Servicios",
      icon: <ClipboardCheck size={20} />,
      path: "/services",
      roles: ["Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Mis Servicios",
      icon: <BoxArrowInUpRight size={20} />,
      path: "/myservices",
      roles: ["Técnico", "Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Inspecciones",
      icon: <FileText size={20} />,
      path: "/inspections",
      roles: ["Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Productos",
      icon: <Eyedropper size={20} />,
      path: "/products",
      roles: ["Supervisor Técnico", "Administrador", "Superadministrador"],
    },
    {
      label: "Facturación",
      icon: <CurrencyDollar size={20} />,
      path: "/billing",
      roles: ["Administrador", "Superadministrador"],
    },
    {
      label: "Normas", // Botón agregado
      icon: <JournalBookmarkFill size={20} />, // Puedes usar cualquier icono que desees
      path: "/rules", // Define la ruta correspondiente
      roles: ["Administrador", "Superadministrador"], // Ajusta los roles si es necesario
    },
    {
      label: "Consumo",
      icon: <GraphUp size={20} />,
      path: "/consumption",
      roles: ["Administrador", "Superadministrador"],
    },
    {
      label: "Cerrar Sesión",
      icon: <BoxArrowRight size={20} />,
      action: handleLogout,
      roles: ["Técnico", "Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"],
    },
  ];

  return (
    <div
      className={`sidebar ${isSidebarVisible ? "visible" : "hidden"} ${
        isOpen ? "open" : "collapsed"
      }`}
    >
      <div className="menu-toggle" onClick={toggleMenu}>
        <List size={30} />
      </div>
      <div className="logo-container">
        <div className="logo-mask">
          <img
            src={`${user?.image || "/images/default-profile.png"}`}
            alt="Profile"
            className="logo"
          />
        </div>
        {isOpen && (
          <div className="user-info">
            <h5>{userInfo?.name || "Usuario"}</h5>
            <span>{user?.rol || "Cargo"}</span>
          </div>
        )}
      </div>
      {menuItems
        .filter((item) => item.roles.includes(user?.rol))
        .map((item, index) => (
          <div key={index} className="nav-item">
            {item.action ? (
              <button className="nav-link btn btn-link" onClick={item.action}>
                {item.icon}
                {isOpen && <span>{item.label}</span>}
              </button>
            ) : (
              <button
                className="nav-link btn btn-link"
                onClick={() => handleNavigation(item.path)}
              >
                {item.icon}
                {isOpen && <span>{item.label}</span>}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}
export default SidebarMenu;
