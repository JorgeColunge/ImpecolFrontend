import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { Card, Col, Row, Button, Table, Modal, Form, ModalTitle } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Calendar, Person, Bag, Building, PencilSquare, Trash, Bug, Diagram3, GearFill, Clipboard, PlusCircle, InfoCircle, FileText, GeoAlt, PersonFill, Calendar2Check, SendPlus, Stopwatch, Bullseye, ArrowRepeat } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import ClientInfoModal from './ClientInfoModal'; // Ajusta la ruta según la ubicación del componente
import './ServiceList.css'
import { useSocket } from './SocketContext';

function MyServicesClient() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [clientNames, setClientNames] = useState({});
  const storedUserInfo = JSON.parse(localStorage.getItem("user_info"));
  const userId = storedUserInfo?.id_usuario || '';
  const [technicians, setTechnicians] = useState([]);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [newInspection, setNewInspection] = useState({
    inspection_type: [],
    inspection_sub_type: "",
    date: "",
    time: "",
    duration: "",
    observations: "",
    service_type: "",
    exit_time: "",
  });
  const [notification, setNotification] = useState({
    show: false,
    title: '',
    message: '',
  });
  const [newService, setNewService] = useState({
      service_type: [],
      description: '',
      pest_to_control: '',
      intervention_areas: [],
      responsible: '',
      category: '',
      quantity_per_month: '',
      date: '',
      time: '',
      client_id: userId,
      value: '',
      companion: [],
      created_by: userId,
      created_at: moment().format('DD-MM-YYYY'), // Establece la fecha actual al abrir el modal
    });
  const dropdownRef = useRef(null);
  const socket = useSocket();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const handleShowAddServiceModal = () => setShowAddServiceModal(true);
  const handleCloseAddServiceModal = () => setShowAddServiceModal(false);
  const serviceOptions = [
    "Desinsectación",
    "Desratización",
    "Desinfección",
    "Roceria",
    "Limpieza y aseo de archivos",
    "Lavado shut basura",
    "Encarpado",
    "Lavado de tanque",
    "Inspección",
    "Diagnostico"
  ];
  // Opciones de Áreas de Intervención ordenadas alfabéticamente
const interventionAreaOptions = [
    "Área caja",
    "Área de lavado",
    "Baños",
    "Bodega",
    "Cajas eléctricas",
    "Cocina",
    "Comedor",
    "Cubierta",
    "Cuartos de residuos",
    "Entretechos",
    "Equipos",
    "Exteriores",
    "Lokers",
    "Muebles",
    "Necera",
    "Oficinas",
    "Producción",
    "Servicio al cliente",
    "Shot de basuras"
  ];
  // Estado para las opciones visibles de "Plaga a Controlar"
      const [visiblePestOptions, setVisiblePestOptions] = useState([]);
  // Opciones de plagas para cada tipo de servicio
  const pestOptions = {
    "Desinsectación": ["Moscas", "Zancudos", "Cucarachas", "Hormigas", "Pulgas", "Gorgojos", "Escarabajos"],
    "Desratización": ["Rata de alcantarilla", "Rata de techo", "Rata de campo"],
    "Desinfección": ["Virus", "Hongos", "Bacterias"],
    // Los siguientes tipos no mostrarán opciones de plagas
    "Roceria": [],
    "Limpieza y aseo de archivos": [],
    "Lavado shut basura": [],
    "Encarpado": [],
    "Lavado de tanque": [],
    "Inspección": [],
    "Diagnostico": []
    };

    const [availableServiceOptions, setAvailableServiceOptions] = useState([
          "Empresarial",
          "Hogar",
          "Horizontal",
          "Jardineria",
        ]);

        const serviceAreaMapping = {
          Horizontal: [
            "Gradas",
            "Ascensores",
            "Pasillos",
            "Oficinas",
            "Baños",
            "Porterías",
            "Zona de residuos orgánicos",
            "Parqueadero",
          ],
          Empresarial: [
            "Oficinas",
            "Sala de juntas",
            "Baños",
            "Servicio de cafetería",
            "Parqueadero",
          ],
          Jardineria: ["Jardines horizontales", "Jardines verticales"],
        };

  const handleShowRequestModal = () => setShowRequestModal(true);
  const handleCloseRequestModal = () => setShowRequestModal(false);
  const handleContinueRequest = () => {
    handleCloseRequestModal(); // Cierra el modal de solicitud
    handleShowAddServiceModal(); // Abre el modal para añadir servicio
  };


  const toggleActions = (uniqueKey) => {
    setExpandedCardId((prevKey) => (prevKey === uniqueKey ? null : uniqueKey)); // Alterna el estado abierto/cerrado del menú
  };
  
  const handleClickOutside = (event) => {
    // Si el clic no es dentro del menú desplegable, ciérralo
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setExpandedCardId(null);
    }
  };

  // Dentro de tu componente MyServices
  const location = useLocation();
  const serviceIdFromState = location.state?.serviceId;

  // Si el estado contiene un serviceId, selecciona automáticamente ese servicio y abre el modal.
  useEffect(() => {
      if (serviceIdFromState) {
          const service = services.find(s => s.id === serviceIdFromState);
          if (service) {
              setSelectedService(service);
              fetchInspections(service.id);
              setShowServiceModal(true);
          }
      }
  }, [serviceIdFromState, services]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const serviceId = queryParams.get('serviceId');
    if (serviceId) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setSelectedService(service);
        fetchInspections(service.id);
        setShowServiceModal(true);
      }
    }
  }, [location.search, services]);

  useEffect(() => {
    const calculateValue = () => {
      const duration = parseInt(newService.duration, 10);
  
      // Validar que la duración esté dentro del rango permitido
      if (duration < 4 || duration > 8) {
        setNewService((prevService) => ({
          ...prevService,
          value: 0, // Si está fuera del rango, resetea el valor
        }));
        return;
      }
  
      let calculatedValue = 0;
  
      // Cálculo para tipo "Hogar"
      if (newService.service_type.includes("Hogar")) {
        if (duration === 4) {
          calculatedValue = 65000;
        } else if (duration === 8) {
          calculatedValue = 125000;
        } else {
          // Calcular para duraciones entre 5 y 7
          calculatedValue = 65000 + (duration - 4) * 15000;
        }
  
        // Multiplicar por el número de acompañantes (+1 para incluir al responsable principal)
        const companionCount = parseInt(newService.numCompanions || newService.companion?.length || 0, 10) + 1; // +1 incluye al responsable
        calculatedValue *= companionCount;
  
        console.log(
          `Calculando valor para Hogar: Duración=${duration}, Multiplicador=${companionCount}, Valor Base=${calculatedValue}`
        );
      }
  
      // Ajuste adicional para categoría "Periódico"
      if (newService.category === "Periódico") {
        const quantityPerMonth = parseInt(newService.quantity_per_month, 10) || 1;
        calculatedValue *= quantityPerMonth; // Multiplicar por la cantidad al mes
      }
  
      // Actualizar el estado con el valor calculado
      setNewService((prevService) => ({
        ...prevService,
        value: calculatedValue,
      }));
    };
  
    calculateValue();
  }, [
    newService.service_type,
    newService.duration,
    newService.category,
    newService.quantity_per_month,
    newService.companion, // Recalcular cuando cambie el número de acompañantes
    newService.numCompanions, // Recalcular si cambia el número de acompañantes manual
  ]);  
  
  useEffect(() => {
    // Agregar evento de clic al documento cuando hay un menú desplegable abierto
    if (expandedCardId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  
    // Cleanup al desmontar
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedCardId]);

  useEffect(() => {
    if (socket) {
      socket.on("newEvent", async (newEvent) => {
        console.log("Nuevo evento recibido:", newEvent);
  
        try {
          // Consultar los detalles del servicio
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/services/${newEvent.id}`);
          const newService = response.data;
  
          // Verifica si el servicio ya existe en el estado
          setServices((prevServices) => {
            const serviceExists = prevServices.some(service => service.id === newService.id);
            return serviceExists ? prevServices : [...prevServices, newService];
          });
  
          // Opcional: Mostrar notificación
          showNotification("Nuevo Servicio", `Se ha añadido un nuevo servicio: ${newService.id}`);
        } catch (error) {
          console.error("Error al obtener detalles del servicio:", error);
        }
      });
    }
  
    // Limpieza al desmontar
    return () => {
      if (socket) {
        socket.off("newEvent");
      }
    };
  }, [socket]);  

  const handleShowClientModal = (clientId) => {
    setSelectedClientId(clientId);
    setShowClientModal(true);
  };
  
  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClientId(null);
  };  

  const handleServiceTypeChange = (e) => {
    const { value, checked } = e.target;
  
    setNewService((prevService) => {
      const updatedServiceType = checked
        ? [...prevService.service_type, value]
        : prevService.service_type.filter((type) => type !== value);
  
      // Actualiza las opciones disponibles según las selecciones realizadas
      const updateAvailableOptions = (selected) => {
        let newOptions = ["Empresarial", "Hogar", "Horizontal", "Jardineria"];
  
        if (selected.includes("Empresarial")) {
          newOptions = newOptions.filter((opt) => opt !== "Horizontal" && opt !== "Hogar");
        }
        if (selected.includes("Horizontal")) {
          newOptions = newOptions.filter((opt) => opt !== "Empresarial" && opt !== "Hogar");
        }
        if (selected.includes("Hogar")) {
          newOptions = newOptions.filter((opt) => opt !== "Empresarial" && opt !== "Horizontal");
        }
  
        return newOptions;
      };
  
      // Actualiza las áreas válidas para los tipos seleccionados
      const validAreas = updatedServiceType
        .flatMap((type) => serviceAreaMapping[type] || [])
        .filter((area, index, self) => self.indexOf(area) === index);
  
      // Limpia las áreas de intervención no válidas
      const updatedInterventionAreas = prevService.intervention_areas.filter((area) =>
        validAreas.includes(area)
      );
  
      // Actualiza las opciones disponibles en el estado
      setAvailableServiceOptions(updateAvailableOptions(updatedServiceType));
  
      return {
        ...prevService,
        service_type: updatedServiceType,
        intervention_areas: updatedInterventionAreas,
      };
    });
  };

  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService({ ...newService, [name]: value });
  };

  const handlePestToControlChange = (e) => {
    const { value, checked } = e.target;
    setNewService((prevService) => ({
      ...prevService,
      pest_to_control: checked
        ? [...prevService.pest_to_control, value]
        : prevService.pest_to_control.filter((pest) => pest !== value),
    }));
  };

  const handleInterventionAreasChange = (e) => {
    const { value, checked } = e.target;
    setNewService((prevService) => ({
      ...prevService,
      intervention_areas: checked
        ? [...prevService.intervention_areas, value]
        : prevService.intervention_areas.filter((area) => area !== value),
    }));
  };

  const handleSaveNewService = async () => {
    console.log("Iniciando proceso para guardar servicio...");
  
    // Determinar si el servicio es de tipo "Hogar"
    const isHogar = newService.service_type.includes("Hogar");
  
    // Si el cliente no seleccionó un responsable, asigna uno aleatorio
    let assignedTechnician = newService.responsible;
    if (!assignedTechnician) {
      const randomTechnician = technicians[Math.floor(Math.random() * technicians.length)];
      if (randomTechnician) {
        assignedTechnician = randomTechnician.id;
        console.log("Responsable asignado automáticamente:", randomTechnician);
      } else {
        console.error("No se encontró ningún técnico disponible para asignar.");
      }
    } else {
      console.log("Responsable seleccionado por el cliente:", assignedTechnician);
    }
  
    // Generar acompañantes aleatorios si no están especificados
    let companions = newService.companion;
    if (!companions || companions.length === 0) {
      const numCompanions = parseInt(newService.numCompanions || 0, 10); // Asume que el cliente ingresa la cantidad
      if (numCompanions > 0) {
        const availableTechnicians = technicians.filter(tech => tech.id !== assignedTechnician); // Excluir al responsable
        companions = Array.from({ length: numCompanions }, () => {
          const randomIndex = Math.floor(Math.random() * availableTechnicians.length);
          const [selectedTechnician] = availableTechnicians.splice(randomIndex, 1); // Remover técnico seleccionado
          return selectedTechnician?.id; // Retorna su ID
        }).filter(Boolean); // Eliminar valores nulos/undefined
        console.log("Acompañantes asignados automáticamente:", companions);
      }
    }
  
    // Preparar los datos del servicio para enviar al backend
    const serviceData = {
      ...newService,
      responsible: assignedTechnician, // Responsable asignado
      companion: companions, // Acompañantes asignados
      quantity_per_month: newService.quantity_per_month || null,
      client_id: newService.client_id || null,
      value: newService.value || null,
    };
  
    try {
      if (isHogar) {
        console.log("El servicio es de tipo Hogar. Creando directamente...");
        // Validar la duración para servicios de tipo "Hogar"
        const duration = parseInt(newService.duration, 10);
        if (duration < 4 || duration > 8) {
          console.error("Duración inválida para el servicio Hogar:", duration);
          showNotification("Error", "La duración debe estar entre 4 y 8 horas para servicios de tipo Hogar.");
          return;
        }
  
        // Enviar solicitud directamente a la ruta /api/services
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/services`, serviceData);
        if (response.data.success) {
          const createdService = response.data.service;
          setServices([...services, response.data.service]);
          handleCloseAddServiceModal();
          showNotification("Éxito", "Servicio de tipo Hogar guardado exitosamente.");
          // Redirigir al calendario con el ID del servicio
          navigate(`/client-calendar?serviceId=${createdService.id}`);
        } else {
          console.error("Error: No se pudo guardar el servicio de tipo Hogar.", response.data.message);
          showNotification("Error", "No se pudo guardar el servicio de tipo Hogar.");
        }
      } else {
        console.log("El servicio no es de tipo Hogar. Enviando solicitud...");
        // Enviar solicitud a la ruta /api/request-services para otros tipos de servicios
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/request-services`, serviceData);
        if (response.data.success) {
          handleCloseAddServiceModal();
          showNotification("Éxito", "Solicitud de servicio enviada exitosamente.");
        } else {
          console.error("Error: No se pudo enviar la solicitud del servicio.", response.data.message);
          showNotification("Error", "No se pudo enviar la solicitud del servicio.");
        }
      }
    } catch (error) {
      console.error("Error al procesar el servicio en el backend:", error);
      showNotification("Error", "Hubo un problema al procesar el servicio.");
    }
  };
  
  const handleRequestSchedule = async (serviceId, clientId) => {
    try {
      // Configuración de los datos para enviar en la solicitud
      const serviceData = { serviceId, clientId };

      // Enviar la solicitud POST al backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/request-schedule`,
        serviceData
      );

      // Manejar la respuesta exitosa
      console.log("Solicitud de agendamiento enviada:", response.data);

      // Opcional: Redirigir o mostrar una notificación
      showNotification("Exito", "Solicitud de agendamiento enviada exitosamente.");
      handleCloseServiceModal();
    } catch (error) {
      // Manejar errores
      console.error("Error al enviar la solicitud de agendamiento:", error);
      showNotification("Error", "Hubo un error al enviar la solicitud. Por favor, inténtalo nuevamente.");
    }
  };

  useEffect(() => {
    const fetchMyServices = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/services`);
  
        // Filtrar servicios donde el usuario es cliente o está en companions
        const userServices = response.data.filter(service => {
          const isResponsible = service.client_id === userId;
  
          // Verificar si el usuario está en el campo companion
          const isCompanion = service.companion?.includes(`"${userId}"`); // Ajusta según el formato de companion
            
          return isResponsible || isCompanion;
        });
  
        console.log("Servicios filtrados para el usuario:", userServices);
  
        // Obtener nombres de los clientes
        const clientData = {};
        for (const service of userServices) {
          if (service.client_id && !clientData[service.client_id]) {
            try {
              const clientResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/${service.client_id}`);
              clientData[service.client_id] = clientResponse.data.name;
            } catch (error) {
              console.error(`Error fetching client ${service.client_id}:`, error);
            }
          }
        }
        setClientNames(clientData); // Guarda los nombres de los clientes
        setServices(userServices);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching services:", error);
        setLoading(false);
      }
    };
    fetchMyServices();
  }, [userId]);  

  useEffect(() => {
    const fetchScheduledEvents = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/service-schedule`);
        setScheduledEvents(response.data);
      } catch (error) {
        console.error("Error fetching scheduled events:", error);
      }
    };
    fetchScheduledEvents();
  }, []);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users?rol=Operario Hogar`);
        setTechnicians(response.data);
        console.log("Técnicos:", response.data);
      } catch (error) {
        console.error("Error fetching technicians:", error);
      }
    };
    fetchTechnicians();
  }, []);

  const today = moment().startOf('day');
  const nextWeek = moment().add(7, 'days').endOf('day');

  const filteredScheduledServices = services
  .flatMap(service => {
    const serviceEvents = scheduledEvents.filter(event => event.service_id === service.id);

    return serviceEvents.map(event => ({
      ...service,
      scheduledDate: event.date
    }));
  });

// Agrupamos por fechas sin filtrar
const groupedServicesByDate = filteredScheduledServices.reduce((acc, service) => {
  const dateKey = moment(service.scheduledDate).format('YYYY-MM-DD');
  if (!acc[dateKey]) acc[dateKey] = [];
  acc[dateKey].push(service);
  return acc;
}, {});

  const formatDate = (date) => {
    const eventDate = moment(date);
    if (eventDate.isSame(today, 'day')) return 'Hoy';
    if (eventDate.isSame(moment().add(1, 'days'), 'day')) return 'Mañana';
    return eventDate.format('DD-MM-YYYY');
  };

  const fetchInspections = async (serviceId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/inspections?service_id=${serviceId}`);
      const formattedInspections = response.data
        .filter((inspection) => inspection.service_id === serviceId) // Filtra por `service_id`
        .map((inspection) => ({
          ...inspection,
          date: moment(inspection.date).format("DD/MM/YYYY"), // Formato legible para la fecha
          time: inspection.time ? moment(inspection.time, "HH:mm:ss").format("HH:mm") : "--",
          exit_time: inspection.exit_time ? moment(inspection.exit_time, "HH:mm:ss").format("HH:mm") : "--",
          observations: inspection.observations || "Sin observaciones",
        }))
        .sort((a, b) => b.datetime - a.datetime); // Ordena por fecha y hora
      setInspections(formattedInspections);
    } catch (error) {
      console.error("Error fetching inspections:", error);
    }
  }; 

  const handleServiceClick = (service) => {
    setSelectedService(service);
    fetchInspections(service.id);
    setShowServiceModal(true);
  };

  const handleCloseServiceModal = () => {
    setShowServiceModal(false);
    setSelectedService(null);
    setInspections([]);
  };

  const handleShowAddInspectionModal = () => {
    setNewInspection({
      date: '',
      time: '',
      duration: '',
      observations: '',
      service_type: selectedService?.service_type || '',
      exit_time: '',
    });
    setShowAddInspectionModal(true);
  };

  const handleCloseAddInspectionModal = () => {
    setShowAddInspectionModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInspection({ ...newInspection, [name]: value });
  };

  const showNotification = (title, message) => {
    setNotification({ show: true, title, message });
    setTimeout(() => {
      setNotification({ show: false, title, message: '' });
    }, 2500); // 2.5 segundos
  };

  const navigate = useNavigate();

  const handleSchedule = (serviceId) => {
    navigate(`/client-calendar?serviceId=${serviceId}`); // Navega a la ruta con el id del servicio
  };

    const handleSaveInspection = async () => {
    if (!Array.isArray(newInspection.inspection_type) || newInspection.inspection_type.length === 0) {
        showNotification("Error","Debe seleccionar al menos un tipo para la Inspección.");
        return;
    }

    if (
        newInspection.inspection_type.includes("Desratización") &&
        !newInspection.inspection_sub_type
    ) {
        showNotification("Error","Debe seleccionar un Sub tipo para Desratización.");
        return;
    }

    const inspectionData = {
        inspection_type: newInspection.inspection_type,
        inspection_sub_type: newInspection.inspection_type.includes("Desratización")
        ? newInspection.inspection_sub_type
        : null, // Enviar null si no aplica
        service_id: selectedService.id,
        date: moment().format("YYYY-MM-DD"), // Fecha actual
        time: moment().format("HH:mm:ss"), // Hora actual
    };

    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/inspections`, inspectionData);

        if (response.data.success) {
        showNotification("Exito","Inspección guardada exitosamente");
        fetchInspections(selectedService.id);
        handleCloseAddInspectionModal();

        // Redirigir al componente de inspección con el ID
        navigate(`/inspection/${response.data.inspection.id}`);
        } else {
        console.error(
            "Error: No se pudo guardar la inspección correctamente.",
            response.data.message
        );
        }
    } catch (error) {
        console.error("Error saving inspection:", error);
    }
    }; 

    // Filtrar técnicos excluyendo el seleccionado como responsable
  const filteredTechniciansForCompanion = technicians.filter(
    (technician) => technician.id !== newService.responsible
  );

  const handleCompanionChange = (e) => {
    const { value, checked } = e.target;
    setNewService((prevService) => ({
      ...prevService,
      companion: checked
        ? [...prevService.companion, value] // Agrega el ID si está seleccionado
        : prevService.companion.filter((companionId) => companionId !== value) // Elimina el ID si se deselecciona
    }));
  }; 

  const parseServiceType = (serviceType) => {
    if (!serviceType) return [];
    return serviceType
      .replace(/[\{\}]/g, '') // Elimina las llaves { y }
      .split(',') // Divide por comas
      .map(type => type.trim()); // Elimina espacios en blanco
  };

  const parseField = (field) => {
    if (!field) return "No especificado";
    try {
      const parsed = JSON.parse(field.replace(/'/g, '"')); // Reemplazar comillas simples por dobles para JSON válido
      if (Array.isArray(parsed)) {
        return parsed.join(", "); // Agregar un espacio después de la coma
      } else if (typeof parsed === "string") {
        return parsed;
      } else {
        return Object.values(parsed).join(", "); // Agregar un espacio después de la coma
      }
    } catch (error) {
      return field.replace(/[\{\}"]/g, "").split(",").join(", "); // Agregar un espacio después de la coma
    }
  };
  
  

  if (loading) return <div>Cargando servicios...</div>;

  return (
    <div className="container mt-2">
      <Row>
        <Col md={12}>
          <div className="text-end mb-3">
            <Button variant="success" onClick={handleShowRequestModal}>
                Solicitar Servicio
            </Button>
          </div>
          <Row style={{ minHeight: 0, height: 'auto' }}>
            {services.map((service, index) => (
              <Col md={6} lg={4} xl={4} sm={6} xs={12} key={`${service.id}-${index}`} className="mb-4">
                <Card
                  className="mb-3 border"
                  style={{ cursor: "pointer", minHeight: "280px", height: "280px" }}
                  onClick={() => handleServiceClick(service)}
                >
                  <Card.Body>
                    {/* Encabezado: ID y Tipo de Servicio */}
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="flex-grow-1 text-truncate">
                        <span className="fw-bold">{service.id}</span>
                        <span className="text-muted mx-2">|</span>
                        <span className="text-secondary">
                          {service.service_type.replace(/[{}"]/g, "").split(",").join(", ")}
                        </span>
                      </div>
                    </div>
                    <hr />
  
                    <div className="mt-2">
                          <Stopwatch className="text-primary me-2" /> 
                          <span className="text-secondary">
                            {service.duration} Horas
                          </span>
                        </div>

                        <div className="mt-2">
                          {service.category === "Puntual" ? (
                            <Bullseye className="text-danger me-2" />
                          ) : (
                            <ArrowRepeat className="text-success me-2" />
                          )}
                          <span className="text-secondary">
                            {service.category}
                          </span>
                        </div>
  
                    {/* Cliente */}
                    <div className="mt-3">
                      <h6>
                        <Building className="me-2" />
                        {clientNames[service.client_id] || "Cliente Desconocido"}
                      </h6>
                    </div>
  
                    {/* Responsable */}
                    <div className="mt-3">
                      <h6>
                        <Person />{" "}
                        {technicians.find((tech) => tech.id === service.responsible)?.name || "No asignado"}
                      </h6>
                    </div>
                  </Card.Body>
  
                  {/* Pie de Tarjeta: Acciones */}
                  <Card.Footer
                    className="text-center position-relative"
                    style={{ background: "#f9f9f9", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita redirigir al hacer clic en el botón
                      toggleActions(`${service.id}-${index}`); // Usa la combinación id-index como clave
                    }}
                    ref={expandedCardId === `${service.id}-${index}` ? dropdownRef : null} // Compara con la clave única
                  >
                    <small className="text-success">
                      {expandedCardId === `${service.id}-${index}` ? "Cerrar Acciones" : "Acciones"}
                    </small>
                    {expandedCardId === `${service.id}-${index}` && (
                      <div
                        className={`menu-actions ${
                          expandedCardId === `${service.id}-${index}` ? "expand" : "collapse"
                        }`}
                      >
                      </div>
                    )}
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Modal para mostrar los detalles del servicio */}
            <Modal
              show={showServiceModal}
              onHide={handleCloseServiceModal}
              size="lg"
              centered
            >
              <Modal.Header closeButton>
                <Modal.Title className="fw-bold">
                  <GearFill className="me-2" /> Detalles del Servicio
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="bg-light p-4">
                {selectedService && (
                  <div className="d-flex flex-column gap-4">
                    {/* Agendamiento */}
                    <div className="bg-white shadow-sm rounded p-3">
                      <h5 className="text-secondary mb-3">
                        <Calendar className="me-2" /> Agendamiento
                      </h5>
                      <div className="d-flex gap-2 my-4">
                        <button
                          className="btn btn-outline-success d-flex align-items-center w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSchedule(selectedService.id);
                          }}
                        >
                          <Calendar2Check size={18} className="me-2" />
                          Agenda Tu Servicio
                        </button>
                        <button
                          className="btn btn-outline-success d-flex align-items-center w-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestSchedule(selectedService.id, selectedService.client_id);
                          }}
                        >
                          <SendPlus size={18} className=" me-2"/>
                          Solicita Tu Agendamiento
                        </button>
                      </div>
                    </div>

                    {/* Detalles del servicio */}
                    <div className="bg-white shadow-sm rounded p-3">
                      <h5 className="text-secondary mb-3">
                        <InfoCircle className="me-2" /> Información General
                      </h5>
                      <div className="d-flex flex-column gap-2">
                        <p className="my-1"><strong>ID del Servicio:</strong> {selectedService.id}</p>
                        <p className="my-1">
                          <strong>Tipo de Servicio:</strong>{" "}
                          {selectedService.service_type.replace(/[\{\}"]/g, "").split(",").join(", ")}
                        </p>
                        <p className="my-1"><strong>Categoría:</strong> {selectedService.category}</p>
                        <div className='p-0 m-0 d-flex'>
                          <p className="my-1"><strong>Empresa:</strong> {clientNames[selectedService.client_id] || "Cliente Desconocido"}</p>
                          {selectedService.client_id && (
                            <Building
                              className='ms-2 mt-1'
                              style={{cursor: "pointer"}}
                              size={22}
                              onClick={(e) => {
                                e.stopPropagation(); // Evita que se activen otros eventos del Card
                                handleShowClientModal(selectedService.client_id);
                              }}
                            />
                          )}
                        </div>
                        <p className="my-1"><strong>Responsable:</strong> {technicians.find((tech) => tech.id === selectedService.responsible)?.name || "No asignado"}</p>
                        {selectedService.companion && selectedService.companion !== "{}" && selectedService.companion !== '{""}' && (
                          <p>
                              <strong>Acompañante(s):</strong>{' '}
                              {(() => {
                                  // Convierte la cadena de IDs en un array
                                  const companionIds = selectedService.companion
                                      .replace(/[\{\}"]/g, '') // Limpia los caracteres `{}`, `"`
                                      .split(',')
                                      .map((id) => id.trim()); // Divide y recorta espacios
                                  // Mapea los IDs a nombres usando el estado `users`
                                  const companionNames = companionIds.map((id) => {
                                      const tech = technicians.find((tech) => tech.id === id); // Encuentra el usuario por ID
                                      return tech ? `${tech.name} ${tech.lastname || ''}`.trim() : `Desconocido (${id})`;
                                  });
                                  // Devuelve la lista de nombres como texto
                                  return companionNames.join(', ');
                              })()}
                          </p>
                        )}
                        {selectedService.category === "Periódico" && (
                          <p><strong>Cantidad al Mes:</strong> {selectedService.quantity_per_month}</p>
                        )}
                        <p><strong>Valor:</strong> ${selectedService.value}</p>
                      </div>
                    </div>
      
                    {/* Descripción */}
                    <div className="bg-white shadow-sm rounded p-3">
                      <h5 className="text-secondary mb-3">
                        <FileText className="me-2" /> Descripción
                      </h5>
                      <p className="text-muted">{selectedService.description || "No especificada"}</p>
                    </div>
      
                    {/* Áreas */}
                    {selectedService.intervention_areas && (() => {
                    const areasMatches = selectedService.intervention_areas.match(/"([^"]+)"/g);
                    return areasMatches && areasMatches.length > 0;
                    })() && (
                    <div className="d-flex gap-3">
                      <div className="flex-fill bg-white shadow-sm rounded p-3 w-50">
                        <h5 className="text-secondary mb-3">
                          <GeoAlt className="me-2" /> Áreas de Intervención
                        </h5>
                        <p>
                          {(() => {
                            const areaMatches = selectedService.intervention_areas.match(/"([^"]+)"/g);
                            return areaMatches
                              ? areaMatches.map((item) => item.replace(/"/g, "")).join(", ")
                              : "No especificadas";
                          })()}
                        </p>
                      </div>
                    </div>
                    )}
      
                    {/* Tabla de inspecciones */}
                    <div className="bg-white shadow-sm rounded p-3">
                      <h5 className="text-secondary mb-3">
                        <Clipboard className="me-2" /> Inspecciones
                      </h5>
                      {inspections.length > 0 ? (
                        <div className="custom-table-container">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Fecha</th>
                              <th>Inicio</th>
                              <th>Finalización</th>
                              <th>Observaciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inspections.map((inspection) => (
                              <tr key={inspection.id} onClick={() => navigate(`/inspection/${inspection.id}`)}>
                                <td>{inspection.id}</td>
                                <td>{inspection.date}</td>
                                <td>{inspection.time}</td>
                                <td>{inspection.exit_time}</td>
                                <td>{inspection.observations}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>                  
                      ) : (
                        <p>No hay inspecciones registradas para este servicio.</p>
                      )}
                    </div>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="dark" onClick={handleCloseServiceModal}>
                  Cerrar
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={showRequestModal} onHide={handleCloseRequestModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Solicitar Servicio</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                <p>
                    ¡Bienvenido a nuestro proceso de solicitud de servicios! 
                    Este se lleva a cabo en 2 pasos simples: 
                    <br /><br />
                    <strong>1. Información básica:</strong> Completa un breve formulario con los detalles iniciales del servicio que necesitas. Nuestro equipo revisará y validará la información proporcionada. 
                    <br />
                    <strong>2. Confirmación y agendamiento:</strong> Una vez aprobada tu solicitud, recibirás una notificación para elegir la fecha y hora del servicio. Si prefieres, nuestro equipo puede encargarse de agendarlo por ti.
                    <br /><br />
                    ¡Estamos aquí para ayudarte a hacer todo más fácil y rápido!
                </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseRequestModal}>
                    Cancelar
                    </Button>
                    <Button variant="success" onClick={handleContinueRequest}>
                    Continuar
                    </Button>
                </Modal.Footer>
                </Modal>

                <Modal show={showAddServiceModal} onHide={() => setShowAddServiceModal(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title><PlusCircle/> Añadir Servicio</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          <Form>
                            {/* Tipo de Servicio */}
                            <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Tipo de Servicio</Form.Label>
                              <div className="d-flex flex-wrap">
                              {availableServiceOptions.map((option, index) => (
                            <div key={index} className="col-4 mb-2">
                              <Form.Check
                                type="checkbox"
                                label={<span style={{ fontSize: "0.8rem" }}>{option}</span>}
                                value={option}
                                checked={newService.service_type.includes(option)}
                                onChange={(e) => handleServiceTypeChange(e)}
                              />
                            </div>
                          ))}
              
                              </div>
                            </Form.Group>
              
                            {/* Descripción */}
                            <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Descripción</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={newService.description}
                                onChange={handleNewServiceChange}
                              />
                            </Form.Group>
              
                          {/* Áreas de Intervención */}
                          {newService.service_type.length > 0 && // Verifica que haya al menos un tipo seleccionado
                            !newService.service_type.includes("Hogar") && ( // Asegúrate de que no sea "Hogar"
                              <Form.Group className="mt-3">
                                <Form.Label style={{ fontWeight: "bold" }}>Áreas de Intervención</Form.Label>
                                <div className="d-flex flex-wrap">
                                  {newService.service_type
                                    .flatMap((type) => serviceAreaMapping[type] || []) // Obtiene las áreas correspondientes
                                    .filter((area, index, self) => self.indexOf(area) === index) // Elimina duplicados
                                    .map((area, index) => (
                                      <div key={index} className="col-4 mb-2">
                                        <Form.Check
                                          type="checkbox"
                                          label={<span style={{ fontSize: "0.8rem" }}>{area}</span>}
                                          value={area}
                                          checked={newService.intervention_areas.includes(area)}
                                          onChange={handleInterventionAreasChange}
                                        />
                                      </div>
                                    ))}
                                </div>
                              </Form.Group>
                            )}
              
                            {/* Responsable */}
                            <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Responsable (Opcional)</Form.Label>
                              <Form.Control
                                as="select"
                                name="responsible"
                                value={newService.responsible}
                                onChange={handleNewServiceChange}
                              >
                                <option value="">Seleccione un técnico</option>
                                {technicians.map((technician) => (
                                  <option key={technician.id} value={technician.id}>
                                    {technician.name}
                                  </option>
                                ))}
                              </Form.Control>
                            </Form.Group>
              
                            {/* Categoría */}
                            <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Categoría</Form.Label>
                              <Form.Control
                                as="select"
                                name="category"
                                value={newService.category}
                                onChange={(e) => {
                                  handleNewServiceChange(e);
                                  setNewService({ ...newService, category: e.target.value });
                                }}
                              >
                                <option value="">Seleccione una categoría</option>
                                <option value="Puntual">Puntual</option>
                                <option value="Periódico">Periódico</option>
                              </Form.Control>
                            </Form.Group>
              
                            {/* Cantidad al Mes */}
                            {newService.category === "Periódico" && (
                              <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Días por Semana</Form.Label>
                              <Form.Control
                                as="select"
                                name="days_per_week"
                                value={newService.days_per_week || ''}
                                onChange={(e) => {
                                  const daysPerWeek = parseInt(e.target.value, 10);
                                  setNewService((prevService) => ({
                                    ...prevService,
                                    days_per_week: daysPerWeek, // Guarda la selección de días por semana
                                    quantity_per_month: daysPerWeek * 4, // Calcula automáticamente la cantidad al mes
                                  }));
                                }}
                              >
                                <option value="">Seleccione días por semana</option>
                                <option value="1">1 vez a la semana</option>
                                <option value="2">2 veces a la semana</option>
                                <option value="3">3 veces a la semana</option>
                                <option value="4">4 veces a la semana</option>
                                <option value="5">5 veces a la semana</option>
                                <option value="6">6 veces a la semana</option>
                              </Form.Control>
                            </Form.Group>                            
                            )}
              
                            <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Duración</Form.Label>
                              <Form.Control
                                type="number"
                                name="duration"
                                value={newService.duration}
                                min="4" // Mínimo permitido
                                max="8" // Máximo permitido
                                onChange={(e) => {
                                  const value = Math.max(4, Math.min(8, parseInt(e.target.value, 10))); // Restringir entre 4 y 8
                                  setNewService({ ...newService, duration: value });
                                }}
                              />
                            </Form.Group>
              
                            {/* Valor */}
                            <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Valor</Form.Label>
                              <Form.Control
                                type="number"
                                name="value"
                                value={newService.value}
                                onChange={handleNewServiceChange}
                                disabled
                              />
                            </Form.Group>
              
                            {/* Acompañante */}
                            <Form.Group className="mt-3">
                              <Form.Label style={{ fontWeight: "bold" }}>Cantidad de Acompañantes (Opcional)</Form.Label>
                              <Form.Control
                                type="number"
                                name="numCompanions"
                                value={newService.numCompanions || ''}
                                min="0"
                                onChange={(e) => setNewService({ ...newService, numCompanions: e.target.value })}
                              />
                            </Form.Group>
              
                            {/* Campos Ocultos */}
                            <Form.Control type="hidden" name="client_id" value={newService.client_id} />
                            <Form.Control type="hidden" name="created_by" value={newService.created_by} />
                            <Form.Control type="hidden" name="created_at" value={newService.created_at} />
                          </Form>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="dark" onClick={() => setShowAddServiceModal(false)}>
                            Cancelar
                          </Button>
                          <Button variant="success" onClick={() => handleSaveNewService()}>
                            Solicitar Servicio
                          </Button>
                        </Modal.Footer>
                      </Modal>
    </div>
  );  
}

export default MyServicesClient;