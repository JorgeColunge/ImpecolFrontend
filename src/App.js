import React, { useState, useEffect } from 'react';
import { SocketProvider } from './SocketContext';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import moment from 'moment-timezone';
import Landing from './Landing';
import Login from './Login';
import Register from './Register';
import UserProfile from './UserProfile';
import EditProfile from './EditProfile';
import EditMyProfile from './EditMyProfile';
import EditMyProfileClient from './EditMyProfileClient';
import SidebarMenu from './SidebarMenu';
import TopBar from './TopBar'; // Importa el componente TopBar
import axios from 'axios';
import UserList from './UserList';
import ClientProfile from './ClientProfile';
import ClientList from './ClientList';
import ProductList from './ProductList';
import ShowProfile from './ShowProfile';
import InspectionCalendar from './InspectionCalendar';
import CalendarClient from './CalendarClient';
import MyServicesCalendar from './myServicesCalendar';
import Inspections from './Inspections';
import ServiceList from './ServiceList';
import Inspection from './Inspection';
import MyServices from './MyServices';
import MyServicesClient from './MyServicesClient';
import Billing from './Billing';
import Rules from './Rules'
import DocumentUploader from './DocumentUploader';
import DocumentAutomation from './DocumentAutomation';
import ViewDocument from './ViewDocument';
import EditGoogleDrive from './EditGoogleDrive';
import EditLocalFile from './EditLocalFile';
import WordEditor from './WordEditor';
import CompanyStations from './CompanyStations';
import UnsavedChangesModal from './UnsavedChangesModal';
import Consumption from './Consumption';
import Actions from './Actions';
import Tutorials from './Tutorials';
import { UnsavedChangesProvider } from './UnsavedChangesContext';
import { syncRequests } from './offlineHandler';
import { saveUsers, getUsers, syncUsers, syncUsersOnStart, saveServices, saveEvents, saveTechnicians, saveInspections, syncPendingInspections, syncProductsOnStart } from './indexedDBHandler';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const storedUserInfo = JSON.parse(localStorage.getItem("user_info"));
  const userId = storedUserInfo?.id_usuario || '';
  const [syncCount, setSyncCount] = useState(parseInt(localStorage.getItem('sync') || '0', 10));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(window.innerWidth > 768);
  const [notifications, setNotifications] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const handleSyncUpdate = (event) => {
      setSyncCount(event.detail);
    };

    window.addEventListener('syncUpdate', handleSyncUpdate);

    return () => {
      window.removeEventListener('syncUpdate', handleSyncUpdate);
    };
  }, []);

  useEffect(() => {
    console.log('🔄 Inicializando contador de sincronización...');
    localStorage.setItem('sync', '0');

    // Emitir evento manual para reflejar el cambio
    const syncEvent = new CustomEvent('syncUpdate', { detail: 0 });
    window.dispatchEvent(syncEvent);
  }, []);

  // Manejar el cambio de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarVisible(window.innerWidth > 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    syncUsersOnStart();
    fetchMyServices();
    fetchAllInspections(services);
    fetchTechnicians();
    syncProductsOnStart();
  }, []);

  // 📌 Cargar servicios desde IndexedDB o API
  const fetchMyServices = async () => {
    try {
      if (navigator.onLine) {
        console.log("🌐 Modo online: obteniendo servicios desde el servidor...");

        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/services`);
        const userServices = response.data.filter(service => {
          const isResponsible = service.responsible === userId;
          const isCompanion = service.companion?.includes(`"${userId}"`);
          return isResponsible || isCompanion;
        });

        console.log("✅ Servicios filtrados para el usuario:", userServices);

        // Obtener nombres de los clientes
        const clientData = {};
        for (const service of userServices) {
          if (service.client_id && !clientData[service.client_id]) {
            try {
              const clientResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/${service.client_id}`);
              clientData[service.client_id] = clientResponse.data.name;
            } catch (error) {
              console.error(`⚠️ Error obteniendo cliente ${service.client_id}:`, error);
            }
          }
        }

        // Guardar en IndexedDB
        await saveServices(userServices, clientData);
        console.log("📥 Servicios y clientes almacenados en IndexedDB.");
        setServices(userServices);
      } else {
        console.log("📴 Modo offline: obtener datos desde IndexedDB...");
      }
    } catch (error) {
      console.error("❌ Error al obtener servicios:", error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      if (navigator.onLine) {
        console.log("🌐 Modo online: obteniendo técnicos desde el servidor...");
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users?role=Technician`);

        console.log("✅ Respuesta de la API de técnicos:", response.data);

        // Guardar técnicos en IndexedDB para modo offline
        await saveTechnicians(response.data);
      } else {
        console.log("📴 Modo offline: obtener técnicos desde IndexedDB...");
      }

    } catch (error) {
      console.error("❌ Error al obtener técnicos:", error);
    }
  };

  const fetchAllInspections = async (services) => {
    try {
      if (navigator.onLine) {
        console.log("🌐 Modo online: obteniendo inspecciones de todos los servicios...");

        const inspectionsByService = {};

        for (const service of services) {
          try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/inspections_service/${service.id}`);
            console.log(`✅ Inspecciones para servicio ${service.id}:`, response.data);

            const formattedInspections = response.data.map((inspection) => ({
              ...inspection,
              date: moment.utc(inspection.date).startOf('day').format("DD/MM/YYYY"),
              time: inspection.time ? moment(inspection.time, "HH:mm:ss").format("HH:mm") : "--",
              exit_time: inspection.exit_time ? moment(inspection.exit_time, "HH:mm:ss").format("HH:mm") : "--",
              observations: inspection.observations || "Sin observaciones",
            }));

            inspectionsByService[service.id] = formattedInspections;
          } catch (error) {
            console.error(`❌ Error obteniendo inspecciones para el servicio ${service.id}:`, error);
            inspectionsByService[service.id] = []; // Si hay error, asegurarse de que exista la clave
          }
        }

        // Guardar en IndexedDB para modo offline
        await saveInspections(inspectionsByService);

      } else {
        console.log("📴 Modo offline: obtener inspecciones desde IndexedDB...");
      }

    } catch (error) {
      console.error("❌ Error cargando inspecciones:", error);
    }
  };

  useEffect(() => {
    const fetchScheduledEvents = async () => {
      try {
        const userServiceIds = services.map(service => service.id).join(",");

        console.log("📌 Lista de service_id del usuario:", userServiceIds);

        if (!userServiceIds) {
          console.log("❌ No hay servicios asignados al usuario. No se solicitarán eventos.");
          return;
        }

        if (navigator.onLine) {
          console.log("🌐 Modo online: obteniendo eventos desde el servidor...");
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/service-service-schedule?serviceIds=${userServiceIds}`);

          console.log("✅ Respuesta de la API de eventos:", response.data);

          // Guardar eventos en IndexedDB para uso offline
          await saveEvents(response.data);

        } else {
          console.log("📴 Modo offline: obteniendo eventos desde IndexedDB...");
        }

      } catch (error) {
        console.error("❌ Error al obtener eventos programados:", error);
      }
    };

    if (services.length > 0) {
      console.log("📢 Se han obtenido servicios, procediendo a solicitar eventos...");
      fetchScheduledEvents();
    } else {
      console.log("⚠️ Aún no hay servicios cargados, esperando actualización...");
    }
  }, [services]); // Se ejecuta cuando los servicios cambian

  const handleSidebarToggle = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  const handleSync = () => {
    console.log('Sincronizando...');
  };

  const handleNotify = () => {
    console.log('Notificación');
  };

  useEffect(() => {
    const fullSync = async () => {
      try {
        console.log('🚀 Sincronización inicial (app arrancó online)…');
        await syncPendingInspections();
        await syncRequests();
        await syncUsers();
        //   ⬆️  cualquier otra tarea que sueles hacer en handleOnline
      } catch (err) {
        console.error('❌ Error en sincronización inicial:', err);
      }
    };

    const handleOnline = async () => {
      console.log('🌐 Conexión restaurada. Sincronizando inspecciones pendientes...');

      try {
        await syncPendingInspections();
        console.log("✅ Inspecciones sincronizadas con éxito.");

        console.log("📡 Sincronizando solicitudes...");
        await syncRequests();
        console.log("✅ Solicitudes sincronizadas.");

        console.log("👤 Sincronizando usuarios...");
        await syncUsers();
        console.log("✅ Usuarios sincronizados.");

      } catch (error) {
        console.error("❌ Error en la sincronización:", error);
      }
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) fullSync();

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications/${userId}`);
        setNotifications(response.data.notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

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
    localStorage.setItem('user_info', JSON.stringify(updatedUserInfo));
  };

  if (loading) return <div className="text-center mt-5">Cargando...</div>;

  const isAuthorized = (allowedRoles) => {
    return isLoggedIn && userInfo && allowedRoles.includes(userInfo.rol);
  };

  return (
    <SocketProvider>
      <UnsavedChangesProvider>
        <Router>
          <div className="App d-flex">
            <UnsavedChangesModal />
            {isLoggedIn && (
              <>
                <SidebarMenu
                  userInfo={userInfo}
                  onLogout={handleLogout}
                  onToggle={handleSidebarToggle}
                  isSidebarVisible={isSidebarVisible}
                />
                <TopBar
                  userName={userInfo?.name || "User"}
                  onSync={handleSync}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  isSidebarOpen={isSidebarOpen}
                  isSidebarVisible={isSidebarVisible}
                  toggleSidebar={() => setIsSidebarVisible((prev) => !prev)}
                  syncCount={syncCount}
                  isOnline={isOnline}
                />
              </>
            )}
            <div
              className={`main-content flex-grow-1 ${isLoggedIn ? '' : 'w-100'}`}
              style={{
                marginTop: '60px',
                marginLeft: isSidebarVisible ? (isSidebarOpen ? '200px' : '60px') : '0px' // Ajusta el margen izquierdo según el estado del Sidebar
              }}
            >
              <Routes>
                <Route path="/" element={isLoggedIn ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
                <Route path="/login" element={isLoggedIn ? <Navigate to="/profile" /> : <Login onLogin={handleLogin} />} />
                <Route path="/app" element={<Landing />} />
                <Route path="/register" element={isLoggedIn ? <Navigate to="/profile" /> : <Register />} />
                <Route path="/profile" element={<UserProfile userInfo={userInfo} />} />
                <Route path="/client-profile" element={isAuthorized(["Cliente"]) ? <ClientProfile userInfo={userInfo} /> : <Navigate to="/login" />} />
                <Route path="/edit-profile/:id" element={<EditProfile userInfo={userInfo} onProfileUpdate={handleProfileUpdate} />} />
                <Route path="/edit-my-profile/:id" element={<EditMyProfile userInfo={userInfo} onProfileUpdate={handleProfileUpdate} />} />
                <Route path="/edit-my-profile-client/:id" element={<EditMyProfileClient userInfo={userInfo} onProfileUpdate={handleProfileUpdate} />} />
                <Route path="/users" element={isAuthorized(["SST", "Administrador", "Superadministrador"]) ? <UserList /> : <Navigate to="/login" />} />
                <Route path="/clients" element={isAuthorized(["Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <ClientList /> : <Navigate to="/login" />} />
                <Route path="/products" element={isAuthorized(["SST", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <ProductList /> : <Navigate to="/login" />} />
                <Route path="/billing" element={isAuthorized(["Administrador", "Superadministrador"]) ? <Billing /> : <Navigate to="/login" />} />
                <Route path="/services" element={isAuthorized(["SST", "Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <ServiceList /> : <Navigate to="/login" />} />
                <Route path="/services-calendar" element={isAuthorized(["SST", "Comercial", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <InspectionCalendar /> : <Navigate to="/login" />} />
                <Route path="/client-calendar" element={isAuthorized(["Cliente"]) ? <CalendarClient /> : <Navigate to="/login" />} />
                <Route path="/myservices-calendar" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <MyServicesCalendar /> : <Navigate to="/login" />} />
                <Route path="/inspections" element={isAuthorized(["SST", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <Inspections /> : <Navigate to="/login" />} />
                <Route path="/inspection/:inspectionId" element={isAuthorized(["SST", "Supervisor Técnico", "Administrador", "Superadministrador", "Operario Hogar", "Operario", "Cliente"]) ? <Inspection /> : <Navigate to="/login" />} />
                <Route path="/show-profile/:id" element={<ShowProfile />} />
                <Route path="/myservices" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <MyServices /> : <Navigate to="/login" />} />
                <Route path="/myservicesclient" element={isAuthorized(["Cliente"]) ? <MyServicesClient /> : <Navigate to="/login" />} />
                <Route path="/upload-document" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <DocumentUploader /> : <Navigate to="/login" />} />
                <Route path="/document-automation" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <DocumentAutomation /> : <Navigate to="/login" />} />
                <Route path="/word-editor" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <WordEditor /> : <Navigate to="/login" />} />
                <Route path="/view-document" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <ViewDocument /> : <Navigate to="/login" />} />
                <Route path="/edit-google-drive" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <EditGoogleDrive /> : <Navigate to="/login" />} />
                <Route path="/edit-local-file" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <EditLocalFile /> : <Navigate to="/login" />} />
                <Route path="/stations/client/:client_id" element={isAuthorized(["Supervisor Técnico", "Administrador", "Superadministrador"]) ? <CompanyStations /> : <Navigate to="/login" />} />
                <Route path="/rules" element={isAuthorized(["Supervisor Técnico", "Administrador", "Superadministrador"]) ? <Rules /> : <Navigate to="/login" />} />
                <Route path="/consumption" element={isAuthorized(["Supervisor Técnico", "Administrador", "Superadministrador"]) ? <Consumption /> : <Navigate to="/login" />} />
                <Route path="/actions" element={isAuthorized(["Supervisor Técnico", "Administrador", "Superadministrador"]) ? <Actions /> : <Navigate to="/login" />} />
                <Route path="/tutoriales" element={isAuthorized(["Operario Hogar", "Operario", "Supervisor Técnico", "Administrador", "Superadministrador"]) ? <Tutorials /> : <Navigate to="/login" />} />
              </Routes>
            </div>
          </div>
        </Router>
      </UnsavedChangesProvider>
    </SocketProvider>
  );
}


export default App;