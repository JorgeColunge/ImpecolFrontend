// TopBar.js
import React, { useEffect } from 'react';
import { Navbar, Nav, Button, Dropdown, Badge } from 'react-bootstrap';
import { FaSyncAlt, FaBell, FaBars } from 'react-icons/fa';
import axios from 'axios';
import './TopBar.css';
import { useSocket } from './SocketContext';
import { useNavigate } from 'react-router-dom';
import { Arrow90degRight, ArrowLeftSquareFill, ArrowRightSquareFill } from 'react-bootstrap-icons';

function TopBar({ userName, onSync, notifications, setNotifications, isSidebarOpen, isSidebarVisible, toggleSidebar, syncCount }) {
  const userInitial = userName ? userName.charAt(0).toUpperCase() : '';
  const socket = useSocket();
  const navigate = useNavigate();

  // Maneja el clic en una notificación para actualizar su estado y redirigir si corresponde
const handleNotificationClick = async (notificationId, route) => {
  try {
    // Actualiza el estado de la notificación a "read" en el backend
    await axios.put(`http://localhost:10000/api/notifications/${notificationId}/read`, {
    });
    
    // Actualiza el estado local para marcar la notificación como "read"
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, state: 'read' } : notification
      )
    );

    // Si la notificación tiene una ruta, redirige
    if (route) {
      navigate(route);
    }
  } catch (error) {
    console.error('Error updating notification state or navigating:', error);
  }
};

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      console.log('Nueva notificación recibida:', data);

      // Normalizar la notificación
      const normalizedNotification = {
        id: data.notification.id,
        user_id: data.user_id,
        notification: typeof data.notification.notification === 'string'
          ? data.notification.notification
          : data.notification.notification.message || 'Nueva notificación',
        route: data.notification.route || null,
        state: data.notification.state || null,
      };

      // Agregar la notificación normalizada al estado
      setNotifications((prevNotifications) => [normalizedNotification, ...prevNotifications]);
    };

    socket.on('notification', handleNewNotification);

    // Limpieza al desmontar el componente
    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, setNotifications]);   

  // Contar las notificaciones no leídas (estado pending o send)
  const unreadCount = notifications.filter(
    (notification) => notification.state === 'pending' || notification.state === 'send'
  ).length;

  return (
    <Navbar
      bg="light"
      expand="lg"
      className="top-bar shadow-sm px-3"
      style={{
        marginLeft: isSidebarVisible ? (isSidebarOpen ? '240px' : '60px') : '0px',
        width: isSidebarVisible
          ? isSidebarOpen
            ? 'calc(100% - 240px)'
            : 'calc(100% - 60px)'
          : '100%',
      }}
    >

      {/* Contenedor del logo */}
      <div className="d-flex align-items-center">
        <Button
          variant="link"
          className="arrows me-2"
          onClick={toggleSidebar} // Controla la visibilidad del SidebarMenu
        >
        <img
          src="/images/Logo FumiPlagax.png"
          alt="Logo"
          className="d-inline-block align-top topbar-logo"
        />
        </Button>
        <img
          src="/images/Logo FumiPlagax.png"
          alt="Logo"
          className=" align-top topbar-logo"
        />
        <span className='mx-2'>Fumiplagax Services</span>
      </div>

      {/* Contenedor de los íconos */}
      <div className="ml-auto  align-items-center" 
      style={{
        display: isSidebarOpen && window.innerWidth < 600 ? 'none' : 'flex',
      }}>
        {/* Botón de sincronización */}
        <div className="icon-container d-flex align-items-center">
          <Button variant="link" onClick={onSync} className="sync-icon">
            <FaSyncAlt size={20} />
            {syncCount > 0 && (
              <Badge pill variant="danger" className="notification-count">
                {syncCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Dropdown de notificaciones */}
        <div className="icon-container d-flex align-items-center">
          <Dropdown align="end">
            <Dropdown.Toggle
              as={Button}
              variant="link"
              className="notify-icon"
              style={{ position: 'relative', color: 'black' }} // Estilo relativo para posicionar el Badge
            >
              <FaBell size={20} style={{ color: 'black' }} />
              {unreadCount > 0 && (
                <Badge
                  pill
                  variant="danger"
                  className="notification-count"
                  style={{
                    position: 'absolute',
                    top: '0px',
                    right: '18px',
                    backgroundColor: 'red',
                    color: 'white',
                    fontSize: '10px',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                  }}
                >
                  {unreadCount}
                </Badge>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="notification-dropdown-menu custom-scrollbar">
            {notifications
              .filter(
                (notification) =>
                  notification.state === 'pending' || notification.state === 'send'
              ) // Mostrar solo notificaciones con estado pending o send
              .map((notification, index) => (
                <Dropdown.Item
                  key={index}
                  className={`notification-item ${notification.state === 'send' ? '' : 'font-weight-bold'}`}
                  onClick={() => handleNotificationClick(notification.id, notification.route)}
                >
                  <div className="notification-text">
                    {typeof notification.notification === 'string'
                      ? notification.notification
                      : JSON.stringify(notification.notification.message || 'Notificación sin mensaje')}
                  </div>
                </Dropdown.Item>
              ))}
            {unreadCount === 0 && (
              <Dropdown.Item className="text-muted">No hay notificaciones</Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>

        {/* Iniciales del usuario */}
        <div className="icon-container d-flex align-items-center">
          <div className="user-initial-circle bg-success text-white d-flex align-items-center justify-content-center">
            {userInitial}
          </div>
        </div>
      </div>
</Navbar>
  );
}

export default TopBar;