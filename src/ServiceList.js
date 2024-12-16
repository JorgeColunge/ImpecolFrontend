import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { useNavigate } from 'react-router-dom'; // Asegúrate de tener configurado react-router
import { Calendar, Person, Bag, Building, PencilSquare, Trash, Bug, Diagram3, GearFill, Clipboard, PlusCircle, InfoCircle, FileText, GeoAlt } from 'react-bootstrap-icons';
import { Card, Col, Row, Collapse, Button, Table, Modal, Form, CardFooter, ModalTitle } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './ServiceList.css'

function ServiceList() { 
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const storedUserInfo = JSON.parse(localStorage.getItem("user_info"));
  const userId = storedUserInfo?.id_usuario || '';
  const [selectedUser, setSelectedUser] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [showEditServiceType, setShowEditServiceType] = useState(false); // Nuevo estado para el colapso en edición
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [clientNames, setClientNames] = useState({});
  const [showPestOptions, setShowPestOptions] = useState(false);
  const [showInterventionAreasOptions, setShowInterventionAreasOptions] = useState(false);
  const [newInspection, setNewInspection] = useState({
    inspection_type: [], // Tipos de inspección seleccionados
    inspection_sub_type: "", // Opcional, para subtipos como en Desratización
    service_type: "", // Tipo de servicio del servicio seleccionado
  });
  const [technicians, setTechnicians] = useState([]);
  const [editService, setEditService] = useState({
    service_type: [],
    description: '',
    pest_to_control: '',
    intervention_areas: '',
    responsible: '',
    category: '',
    quantity_per_month: '',
    client_id: '',
    value: '',
    companion: [],
    created_by: userId,
    created_at: moment().format('DD-MM-YYYY'),
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServiceType, setShowServiceType] = useState(false);
  const [showCompanionOptions, setShowCompanionOptions] = useState(false);
  const [searchText, setSearchText] = useState(''); // Estado para la búsqueda
  const [filteredClients, setFilteredClients] = useState([]); // Clientes filtrados para la búsqueda
  const [showSuggestions, setShowSuggestions] = useState(false); // Controla si se muestran las sugerencias
  const [searchServiceText, setSearchServiceText] = useState(''); // Estado para el texto de búsqueda en servicios
  const [newService, setNewService] = useState({
    service_type: [],
    description: '',
    pest_to_control: '',
    intervention_areas: '',
    responsible: '',
    category: '',
    quantity_per_month: '',
    date: '',
    time: '',
    client_id: '',
    value: '',
    companion: [],
    created_by: userId,
    created_at: moment().format('DD-MM-YYYY'), // Establece la fecha actual al abrir el modal
  });
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    title: '',
    message: '',
  });
  const dropdownRef = useRef(null);

  const toggleActions = (id) => {
    setExpandedCardId((prevId) => (prevId === id ? null : id)); // Alterna el estado abierto/cerrado del menú
  };

  const handleClickOutside = (event) => {
    // Si el clic no es dentro del menú desplegable, ciérralo
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setExpandedCardId(null);
    }
  };

  useEffect(() => {
    // Agregar evento de clic al documento cuando hay un menú desplegable abierto
    if (expandedCardId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup al desmontar
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedCardId]);

  const showNotification = (title, message) => {
    setNotification({ show: true, title, message });
    setTimeout(() => {
      setNotification({ show: false, title, message: '' });
    }, 2500); // 2.5 segundos
  };

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

  const [showInterventionAreas, setShowInterventionAreas] = useState(false);

// Estado para controlar si el dropdown está abierto o cerrado
const [showDropdown, setShowDropdown] = useState(false);

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


const handleInterventionAreasChange = (e) => {
  const { value, checked } = e.target;
  setNewService((prevService) => ({
    ...prevService,
    intervention_areas: checked
      ? [...prevService.intervention_areas, value]
      : prevService.intervention_areas.filter((area) => area !== value),
  }));
};
  const navigate = useNavigate();

  const handleInspectionClick = (inspection) => {
    console.log("Clicked inspection:", inspection);
    // Redirigir a la página de Detalles de Inspección con el ID seleccionado
    navigate(`/inspection/${inspection.id}`);
  };

const handleDropdownToggle = (isOpen, event) => {
  // Verificar si el evento es un clic en un checkbox
  if (event && event.target && event.target.tagName === 'INPUT') {
    return; // No cerrar el dropdown si se hace clic en un checkbox
  }
  // Cambiar el estado para abrir/cerrar el dropdown solo si no es un checkbox
  setShowDropdown(isOpen);
};

const handleEditClick = (service) => {
  // Función para transformar datos al formato del formulario
  const parseField = (field) => {
    if (!field) return []; // Si el campo es nulo o no existe
    if (typeof field === "string" && field.startsWith("{")) {
      return field
        .replace(/[\{\}"]/g, "") // Elimina llaves y comillas
        .split(",") // Divide por comas
        .map((item) => item.trim()); // Limpia espacios en blanco
    }
    return Array.isArray(field) ? field : []; // Si ya es un arreglo, úsalo
  };

  // Establece el estado para edición
  setEditService({
    ...service,
    service_type: parseField(service.service_type),
    pest_to_control: parseField(service.pest_to_control),
    intervention_areas: parseField(service.intervention_areas),
    companion: parseField(service.companion),
  });

  // Calcula las opciones visibles de plagas basadas en el tipo de servicio
  const parsedServiceType = parseField(service.service_type);
  setVisiblePestOptions(
    Array.from(new Set(parsedServiceType.flatMap((type) => pestOptions[type.trim()] || [])))
  );

  setShowEditModal(true); // Abre el modal de edición
};


  const handleServiceTypeChange = (e) => {
    const { value, checked } = e.target;
    setNewService((prevService) => {
      const updatedServiceType = checked
        ? [...prevService.service_type, value]
        : prevService.service_type.filter((type) => type !== value);
  
      // Combina las plagas de todos los tipos de servicio seleccionados
      const combinedPestOptions = Array.from(
        new Set(
          updatedServiceType.flatMap((type) => pestOptions[type] || [])
        )
      );
  
      setVisiblePestOptions(combinedPestOptions);
  
      return {
        ...prevService,
        service_type: updatedServiceType,
        pest_to_control: [], // Limpia las plagas seleccionadas al cambiar el tipo de servicio
      };
    });
  };

  const handleSaveChanges = async () => {
    try {
      // Convierte los campos al formato requerido por la base de datos
      const formattedEditService = {
        ...editService,
        service_type: `{${editService.service_type.map((type) => `"${type}"`).join(",")}}`, // Formato {"Tipo1","Tipo2"}
        pest_to_control: `{${editService.pest_to_control.map((pest) => `"${pest}"`).join(",")}}`,
        intervention_areas: `{${editService.intervention_areas.map((area) => `"${area}"`).join(",")}}`,
        companion: `{${editService.companion.map((id) => `"${id}"`).join(",")}}`,
      };
  
      // Enviar la solicitud al servidor
      const response = await axios.put(
        `http://localhost:10000/api/services/${editService.id}`,
        formattedEditService
      );
  
      if (response.data.success) {
        // Actualiza la lista de servicios con los cambios realizados
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.id === editService.id ? { ...formattedEditService } : service
          )
        );
        setShowEditModal(false); // Cierra el modal de edición
        setEditService(null); // Limpia el estado de edición
      }
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };
  
  
  const handleDeleteClick = async (serviceId) => {
    try {
      const response = await axios.delete(`http://localhost:10000/api/services/${serviceId}`);
      if (response.data.success) {
        setServices(services.filter(service => service.id !== serviceId));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };  

  const fetchTechnicians = async () => {
    try {
      const response = await axios.get('http://localhost:10000/api/users?role=Technician');
      setTechnicians(response.data);
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const servicesResponse = await axios.get('http://localhost:10000/api/services');
        const clientsResponse = await axios.get('http://localhost:10000/api/clients');
        const techniciansResponse = await axios.get('http://localhost:10000/api/users?role=Technician');

        setServices(servicesResponse.data);
        setClients(clientsResponse.data);
        setTechnicians(techniciansResponse.data);
        setFilteredServices(servicesResponse.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchServicesAndClients = async () => {
      try {
        const servicesResponse = await axios.get('http://localhost:10000/api/services');
        const clientsResponse = await axios.get('http://localhost:10000/api/clients');
        
        const clientData = {};
        clientsResponse.data.forEach(client => {
          clientData[client.id] = client.name;
        });
  
        setClientNames(clientData);
        setServices(servicesResponse.data);
        setFilteredServices(servicesResponse.data);
        setClients(clientsResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    const fetchTechnicians = async () => {
      try {
        const response = await axios.get('http://localhost:10000/api/users?role=Technician');
        setTechnicians(response.data);
      } catch (error) {
        console.error("Error fetching technicians:", error);
      }
    };
  
    // Llama a las funciones sin duplicación
    fetchServicesAndClients();
    fetchTechnicians();
  }, []); // Asegúrate de que las dependencias sean vacías para ejecutarse solo al montar.
  
  
  useEffect(() => {
    const applyFilters = () => {
      let filtered = services;
  
      if (searchServiceText) {
        filtered = filtered.filter((service) =>
          service.id.toString().includes(searchServiceText) ||
          (clients.find((client) => client.id === service.client_id)?.name || "")
            .toLowerCase()
            .includes(searchServiceText.toLowerCase()) ||
          (technicians.find((tech) => tech.id === service.responsible)?.name || "")
            .toLowerCase()
            .includes(searchServiceText.toLowerCase())
        );
      }
  
      if (selectedClient) {
        filtered = filtered.filter((service) => service.client_id === parseInt(selectedClient));
      }
  
      if (selectedUser) {
        filtered = filtered.filter((service) => service.responsible === selectedUser);
      }
  
      setFilteredServices(filtered);
    };
  
    applyFilters();
  }, [searchServiceText, selectedClient, selectedUser, services, clients, technicians]); // Las dependencias necesarias.

  useEffect(() => {
    let filtered = services;

    // Aplicar filtro por texto de búsqueda
    if (searchServiceText) {
      filtered = filtered.filter(
        (service) =>
          service.id.toLowerCase().includes(searchServiceText.toLowerCase()) || // Buscar por ID completo
          (clients.find((client) => client.id === service.client_id)?.name || "")
            .toLowerCase()
            .includes(searchServiceText.toLowerCase()) || // Buscar por cliente
          (technicians.find((tech) => tech.id === service.responsible)?.name || "")
            .toLowerCase()
            .includes(searchServiceText.toLowerCase()) // Buscar por responsable
      );      
    }

    // Aplicar filtro por cliente seleccionado
    if (selectedClient) {
      filtered = filtered.filter((service) => service.client_id === parseInt(selectedClient));
    }

    // Aplicar filtro por responsable seleccionado
    if (selectedUser) {
      filtered = filtered.filter((service) => service.responsible === selectedUser);
    }

    setFilteredServices(filtered);
  }, [searchServiceText, selectedClient, selectedUser, services, clients, technicians]);

  if (loading) return <div>Cargando servicios...</div>;


  const handleServiceSearchChange = (e) => {
    const input = e.target.value;
    setSearchServiceText(input);
    let filtered = services;
  
    if (input) {
      filtered = filtered.filter(
        (service) =>
          service.description.toLowerCase().includes(input.toLowerCase()) ||
          service.service_type.toLowerCase().includes(input.toLowerCase())
      );
    }
  
    if (selectedUser) {
      filtered = filtered.filter((service) => service.responsible === selectedUser);
    }
  
    setFilteredServices(filtered);
  };  

  const fetchInspections = async (serviceId) => {
    try {
      const response = await axios.get(`http://localhost:10000/api/inspections?service_id=${serviceId}`);
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

  const handleSearchChange = (e) => {
    const input = e.target.value;
    setSearchText(input); // Actualiza el texto de búsqueda
    if (input) {
      // Filtra clientes según el texto ingresado
      const filtered = clients.filter((client) =>
        client.name.toLowerCase().includes(input.toLowerCase())
      );
      setFilteredClients(filtered);
      setShowSuggestions(true); // Muestra sugerencias cuando hay texto
    } else {
      setShowSuggestions(false); // Oculta sugerencias si no hay texto
    }
  };

  const handleServiceClick = (service) => {
    setSelectedService(service); // Establece el servicio seleccionado
    fetchInspections(service.id); // Pasa el `service.id` a la función para filtrar las inspecciones
    setShowDetailsModal(true); // Abre el modal
  };    

  const handleShowModal = () => {
    setNewInspection({
      date: '',
      time: '',
      duration: '',
      observations: '',
      service_type: selectedService?.service_type || '',
      exit_time: '',
    });
    setShowModal(true);
  };

  const handleClientSelect = (client) => {
    setSearchText(client.name); // Establece el nombre en el campo de búsqueda
    setNewService({ ...newService, client_id: client.id }); // Asigna el ID del cliente seleccionado
    setShowSuggestions(false); // Oculta la lista de sugerencias
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewInspection({
      date: '',
      time: '',
      duration: '',
      observations: '',
      service_type: '',
      exit_time: '',
    });
  };

  const handleCloseAddInspectionModal = () => {
    setShowAddInspectionModal(false);
  };

  const handleSaveInspection = async () => {
    if (!Array.isArray(newInspection.inspection_type) || newInspection.inspection_type.length === 0) {
      showNotification("Debe seleccionar al menos un tipo de inspección.");
        return;
    }

    if (
        newInspection.inspection_type.includes("Desratización") &&
        !newInspection.inspection_sub_type
    ) {
      showNotification("Debe seleccionar un Sub tipo para Desratización.");
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
        const response = await axios.post("http://localhost:10000/api/inspections", inspectionData);

        if (response.data.success) {
        showNotification("Error","Inspección guardada con éxito");
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

  const handleShowAddServiceModal = () => {
    setNewService((prevService) => ({
      ...prevService,
      created_by: userId, // Asigna el ID del usuario logueado
      created_at: moment().format('DD-MM-YYYY'), // Establece la fecha actual
    }));
    setShowAddServiceModal(true);
  };

// Filtrar técnicos excluyendo el seleccionado como responsable
const filteredTechniciansForCompanion = technicians.filter(
  (technician) => technician.id !== newService.responsible
);


  const handleCloseAddServiceModal = () => setShowAddServiceModal(false);

  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService({ ...newService, [name]: value });
  };

  const handleSaveNewService = async () => {
    const serviceData = {
      ...newService,
      quantity_per_month: newService.quantity_per_month || null,
      client_id: newService.client_id || null,
      value: newService.value || null,
      responsible: newService.responsible || null, // Asegúrate de incluir responsible
      companion: newService.companion || [],       // Asegúrate de incluir companion
    };
  
    try {
      const response = await axios.post('http://localhost:10000/api/services', serviceData);
      if (response.data.success) {
        setServices([...services, response.data.service]);
        handleCloseAddServiceModal();
        showNotification("Exito","Servicio guardado exitosamente");
      } else {
        console.error("Error: No se pudo guardar el servicio.", response.data.message);
        showNotification("Error","Error: No se pudo guardar el servicio");
      }
    } catch (error) {
      console.error("Error saving new service:", error);
      showNotification("Error","Error: Hubo un problema al guardar el servicio");
    }
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
  

  if (loading) return <div>Cargando servicios...</div>;

  const handleCompanionChange = (e) => {
    const { value, checked } = e.target;
    setNewService((prevService) => ({
      ...prevService,
      companion: checked
        ? [...prevService.companion, value] // Agrega el ID si está seleccionado
        : prevService.companion.filter((companionId) => companionId !== value) // Elimina el ID si se deselecciona
    }));
  };  

  return (
      <div className="container mt-4">
      <Row className="align-items-center mb-4" style={{ minHeight: 0, height: 'auto' }}>
        {/* Campo de búsqueda */}
        <Col xs={12} md={6}>
          <Form.Group controlId="formServiceSearch">
            <Form.Control
              type="text"
              placeholder="Buscar"
              value={searchServiceText}
              onChange={handleServiceSearchChange}
            />
          </Form.Group>
        </Col>

        {/* Filtro por empresa */}
        <Col xs={12} md={2}>
          <Form.Group controlId="formClientFilter">
            <Form.Control
              as="select"
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
            >
              <option value="">Todas las empresas</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>

        {/* Filtro por responsable */}
        <Col xs={12} md={2}>
          <Form.Group controlId="formUserFilter">
            <Form.Control
              as="select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Todos los responsables</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>

        {/* Botón Añadir Servicio */}
        <Col xs={12} md={2} className="text-md-end">
          <Button
            variant="success"
            onClick={handleShowAddServiceModal}
            style={{ height: '38px', width: '100%' }} // Mantiene proporciones
          >
            Añadir Servicio
          </Button>
        </Col>
      </Row>


      <Row style={{ minHeight: 0, height: 'auto' }}>
        <Col md={open ? 5 : 12}>
          <div className="service-list">
            <Row style={{ minHeight: 0, height: 'auto' }}>
              {filteredServices.map(service => (
                <Col md={6} lg={4} xl={4} sm={6} xs={12} key={service.id} className="mb-4">

                  <Card
                    className="mb-3 border"
                    style={{ cursor: "pointer", minHeight: "280px", height: "280px" }}
                    onClick={() => handleServiceClick(service)}
                  >

                    <Card.Body>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="flex-grow-1 text-truncate">
                          <span className="fw-bold">{service.id}</span>
                          <span className="text-muted mx-2">|</span>
                          <span className="text-secondary">{service.service_type.replace(/[{}"]/g, '').split(',').join(', ')}</span>
                        </div>
                      </div>
                      <hr />
                      <div>
                  <Bug className="text-success me-2" />     
                  <span className="text-secondary">
                    {(() => {
                      const pestMatches = service.pest_to_control.match(/"([^"]+)"/g);
                      const pests = pestMatches ? pestMatches.map(item => item.replace(/"/g, '')).join(', ') : "No especificado";
                      return pests.length > 20 ? `${pests.slice(0, 20)}...` : pests;
                    })()}
                  </span>
                      </div>
                      <div className="mt-2">
                  <Diagram3 className="text-warning me-2" /> 
                  <span className="text-secondary">
                    {(() => {
                      const areaMatches = service.intervention_areas.match(/"([^"]+)"/g);
                      const areas = areaMatches ? areaMatches.map(item => item.replace(/"/g, '')).join(', ') : "No especificadas";
                      return areas.length > 20 ? `${areas.slice(0, 20)}...` : areas;
                    })()}
                  </span>
                      </div>
                      <div className="mt-3">
                        <h6 >
                          <Building /> {clientNames[service.client_id] || "Cliente Desconocido"}
                        </h6>
                      </div>
                      <div className="mt-3">
                        <h6>
                          <Person />{" "}
                          {technicians.find((tech) => tech.id === service.responsible)?.name || "No asignado"}
                        </h6>
                      </div>
                    </Card.Body>
                    <Card.Footer
                    className="text-center position-relative"
                    style={{ background: "#f9f9f9", cursor: "pointer" }}
                    onClick={(e) => {
                      e.stopPropagation(); // Evita redirigir al hacer clic en el botón
                      toggleActions(service.id);
                    }}
                    ref={expandedCardId === service.id ? dropdownRef : null} // Solo asigna la referencia al desplegable abierto
                  >
                    <small className="text-success">
                      {expandedCardId === service.id ? "Cerrar Acciones" : "Acciones"}
                    </small>
                    {expandedCardId === service.id && (
                      <div
                        className={`menu-actions ${
                          expandedCardId === service.id ? "expand" : "collapse"
                        }`}
                      >
                        <button
                          className="btn d-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedService(service); // Asegúrate de seleccionar el servicio
                            handleShowModal();
                          }}
                        >
                          <PlusCircle size={18} className="me-2" />
                          Añadir Inspección
                        </button>
                        <button
                          className="btn d-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(service);
                          }}
                        >
                          <PencilSquare size={18} className="me-2" />
                          Editar
                        </button>
                        <button
                          className="btn d-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(service.id);
                          }}
                        >
                          <Trash size={18} className="me-2" />
                          Eliminar
                        </button>
                      </div>
                    )}
                  </Card.Footer>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Col>
      </Row>
  
      {/* Modal para añadir una nueva inspección */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Añadir Inspección</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formInspectionType">
              <Form.Label>Tipo de Inspección</Form.Label>
              <div>
                {selectedService?.service_type
                  ?.replace(/[\{\}"]/g, "")
                  .split(",")
                  .map((type, index) => (
                    <Form.Check
                      key={index}
                      type="checkbox"
                      label={type.trim()}
                      value={type.trim()}
                      checked={newInspection.inspection_type?.includes(type.trim())}
                      onChange={(e) => {
                        const { value, checked } = e.target;
                        setNewInspection((prevInspection) => ({
                          ...prevInspection,
                          inspection_type: checked
                            ? [...(prevInspection.inspection_type || []), value]
                            : prevInspection.inspection_type.filter((t) => t !== value),
                        }));
                      }}
                    />
                  ))}
              </div>
            </Form.Group>
            {Array.isArray(newInspection.inspection_type) &&
              newInspection.inspection_type.includes("Desratización") && (
                <Form.Group controlId="formInspectionSubType" className="mt-3">
                  <Form.Label>Sub tipo</Form.Label>
                  <Form.Control
                    as="select"
                    value={newInspection.inspection_sub_type}
                    onChange={(e) =>
                      setNewInspection((prevInspection) => ({
                        ...prevInspection,
                        inspection_sub_type: e.target.value,
                      }))
                    }
                  >
                    <option value="">Seleccione una opción</option>
                    <option value="Control">Control</option>
                    <option value="Seguimiento">Seguimiento</option>
                  </Form.Control>
                </Form.Group>
              )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSaveInspection}>
            Guardar Inspección
          </Button>
        </Modal.Footer>
      </Modal> {/* Cierre del Modal */}

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
                {serviceOptions.map((option, index) => (
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

            {/* Plaga a Controlar */}
            {visiblePestOptions.length > 0 && (
              <Form.Group className="mt-3">
                <Form.Label style={{ fontWeight: "bold" }}>Plaga a Controlar</Form.Label>
                <div className="d-flex flex-wrap">
                  {visiblePestOptions.map((pest, index) => (
                    <div key={index} className="col-4 mb-2">
                      <Form.Check
                        type="checkbox"
                        label={<span style={{ fontSize: "0.8rem" }}>{pest}</span>}
                        value={pest}
                        checked={newService.pest_to_control.includes(pest)}
                        onChange={handlePestToControlChange}
                      />
                    </div>
                  ))}
                </div>
              </Form.Group>
            )}

            {/* Áreas de Intervención */}
            <Form.Group className="mt-3">
              <Form.Label style={{ fontWeight: "bold" }}>Áreas de Intervención</Form.Label>
              <div className="d-flex flex-wrap">
                {interventionAreaOptions.map((area, index) => (
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

            {/* Responsable */}
            <Form.Group className="mt-3">
              <Form.Label style={{ fontWeight: "bold" }}>Responsable</Form.Label>
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
                <Form.Label style={{ fontWeight: "bold" }}>Cantidad al Mes</Form.Label>
                <Form.Control
                  type="number"
                  name="quantity_per_month"
                  value={newService.quantity_per_month}
                  onChange={handleNewServiceChange}
                />
              </Form.Group>
            )}

            {/* Cliente */}
            <Form.Group className="mt-3">
              <Form.Label style={{ fontWeight: "bold" }}>Cliente</Form.Label>
              <Form.Control
                as="select"
                name="client_id"
                value={newService.client_id}
                onChange={handleNewServiceChange}
              >
                <option value="">Seleccione un cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            {/* Valor */}
            <Form.Group className="mt-3">
              <Form.Label style={{ fontWeight: "bold" }}>Valor</Form.Label>
              <Form.Control
                type="number"
                name="value"
                value={newService.value}
                onChange={handleNewServiceChange}
              />
            </Form.Group>

            {/* Acompañante */}
            <Form.Group className="mt-3">
              <Form.Label style={{ fontWeight: "bold" }}>Acompañante</Form.Label>
              <div className="d-flex flex-wrap">
                {filteredTechniciansForCompanion.map((technician, index) => (
                  <div key={index} className="col-4 mb-2">
                    <Form.Check
                      type="checkbox"
                      label={<span style={{ fontSize: "0.8rem" }}>{technician.name}</span>}
                      value={technician.id}
                      checked={newService.companion.includes(technician.id)}
                      onChange={handleCompanionChange}
                    />
                  </div>
                ))}
              </div>
            </Form.Group>

            {/* Campos Ocultos */}
            <Form.Control type="hidden" name="created_by" value={newService.created_by} />
            <Form.Control type="hidden" name="created_at" value={newService.created_at} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowAddServiceModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={() => handleSaveNewService()}>
            Guardar Servicio
          </Button>
        </Modal.Footer>
      </Modal>


      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title><PencilSquare /> Editar Servicio</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editService && (
            <Form>
              {/* Tipo de Servicio */}
              <Form.Group className="mt-3">
                <Form.Label style={{ fontWeight: "bold" }}>Tipo de Servicio</Form.Label>
                <div className="d-flex flex-wrap">
                  {serviceOptions.map((option, index) => (
                    <div key={index} className="col-4 mb-2">
                      <Form.Check
                        type="checkbox"
                        label={<span style={{ fontSize: "0.8rem" }}>{option}</span>}
                        value={option}
                        checked={editService.service_type.includes(option)} // Validación para checkbox
                        onChange={(e) => {
                          const { value, checked } = e.target;
                          setEditService((prevService) => ({
                            ...prevService,
                            service_type: checked
                              ? [...prevService.service_type, value]
                              : prevService.service_type.filter((type) => type !== value),
                          }));
                        }}
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
                  value={editService.description}
                  onChange={(e) => setEditService({ ...editService, description: e.target.value })}
                />
              </Form.Group>

              {/* Plaga a Controlar */}
              {visiblePestOptions.length > 0 && (
                <Form.Group className="mt-3">
                  <Form.Label style={{ fontWeight: "bold" }}>Plaga a Controlar</Form.Label>
                  <div className="d-flex flex-wrap">
                    {visiblePestOptions.map((pest, index) => (
                      <div key={index} className="col-4 mb-2">
                        <Form.Check
                          type="checkbox"
                          label={<span style={{ fontSize: "0.8rem" }}>{pest}</span>} // Tamaño reducido
                          value={pest}
                          checked={editService.pest_to_control.includes(pest)}
                          onChange={(e) => {
                            const { value, checked } = e.target;
                            setEditService((prevService) => ({
                              ...prevService,
                              pest_to_control: checked
                                ? [...prevService.pest_to_control, value]
                                : prevService.pest_to_control.filter((p) => p !== value),
                            }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Form.Group>
              )}

              {/* Áreas de Intervención */}
              <Form.Group className="mt-3">
                <Form.Label style={{ fontWeight: "bold" }}>Áreas de Intervención</Form.Label>
                <div className="d-flex flex-wrap">
                  {interventionAreaOptions.map((area, index) => (
                    <div key={index} className="col-4 mb-2">
                      <Form.Check
                        type="checkbox"
                        label={<span style={{ fontSize: "0.8rem" }}>{area}</span>} // Tamaño reducido
                        value={area}
                        checked={editService.intervention_areas.includes(area)}
                        onChange={(e) => {
                          const { value, checked } = e.target;
                          setEditService((prevService) => ({
                            ...prevService,
                            intervention_areas: checked
                              ? [...prevService.intervention_areas, value]
                              : prevService.intervention_areas.filter((a) => a !== value),
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Form.Group>

              {/* Responsable */}
              <Form.Group className="mt-3">
                <Form.Label style={{ fontWeight: "bold" }}>Responsable</Form.Label>
                <Form.Control
                  as="select"
                  name="responsible"
                  value={editService.responsible}
                  onChange={(e) => setEditService({ ...editService, responsible: e.target.value })}
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
                  value={editService.category}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditService((prevService) => ({
                      ...prevService,
                      category: value,
                      quantity_per_month: value === "Periódico" ? prevService.quantity_per_month : "",
                    }));
                  }}
                >
                  <option value="">Seleccione una categoría</option>
                  <option value="Puntual">Puntual</option>
                  <option value="Periódico">Periódico</option>
                </Form.Control>
              </Form.Group>

              {/* Cantidad al Mes */}
              {editService.category === "Periódico" && (
                <Form.Group className="mt-3">
                  <Form.Label style={{ fontWeight: "bold" }}>Cantidad al Mes</Form.Label>
                  <Form.Control
                    type="number"
                    value={editService.quantity_per_month || ""}
                    onChange={(e) =>
                      setEditService({ ...editService, quantity_per_month: e.target.value })
                    }
                  />
                </Form.Group>
              )}

              {/* Valor */}
              <Form.Group className="mt-3">
                <Form.Label style={{ fontWeight: "bold" }}>Valor</Form.Label>
                <Form.Control
                  type="number"
                  name="value"
                  value={editService.value}
                  onChange={(e) => setEditService({ ...editService, value: e.target.value })}
                />
              </Form.Group>

              {/* Acompañante */}
              <Form.Group className="mt-3">
                    <Form.Label style={{ fontWeight: "bold" }}>Acompañante</Form.Label>
                    <div className="d-flex flex-wrap">
                      {filteredTechniciansForCompanion.map((technician, index) => (
                        <div key={index} className="col-4 mb-2">
                          <Form.Check
                            type="checkbox"
                            label={<span style={{ fontSize: "0.8rem" }}>{technician.name}</span>}
                            value={technician.id}
                            checked={newService.companion.includes(technician.id)}
                            onChange={handleCompanionChange}
                          />
                        </div>
                      ))}
                    </div>
              </Form.Group>

              {/* Campos Ocultos */}
              <Form.Control
                type="hidden"
                name="created_by"
                value={editService.created_by}
              />
              <Form.Control
                type="hidden"
                name="created_at"
                value={editService.created_at}
              />
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSaveChanges}>
            Guardar Cambios
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
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
              {/* Detalles del servicio */}
              <div className="bg-white shadow-sm rounded p-3">
                <h5 className="text-secondary mb-3">
                  <InfoCircle className="me-2" /> Información General
                </h5>
                <div className="d-flex flex-column gap-2">
                  <p className='my-1'><strong>ID del Servicio:</strong> {selectedService.id}</p>
                  <p className='my-1'>
                    <strong>Tipo de Servicio:</strong>{" "}
                    {selectedService.service_type
                      .replace(/[\{\}"]/g, "")
                      .split(",")
                      .join(", ")}
                  </p>
                  <p className='my-1'><strong>Categoría:</strong> {selectedService.category}</p>
                  <p className='my-1'><strong>Empresa:</strong> {clientNames[selectedService.client_id] || "Cliente Desconocido"}</p>
                  <p className='my-1'><strong>Responsable:</strong> {technicians.find((tech) => tech.id === selectedService.responsible)?.name || "No asignado"}</p>
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

              {/* Plagas y Áreas */}
              <div className="d-flex gap-3">
                {/* Plagas */}
                <div className="flex-fill bg-white shadow-sm rounded p-3 w-50">
                  <h5 className="text-secondary mb-3">
                    <Bug className="me-2" /> Plagas
                  </h5>
                  <p>
                    {(() => {
                      const pestMatches = selectedService.pest_to_control.match(/"([^"]+)"/g);
                      return pestMatches
                        ? pestMatches.map((item) => item.replace(/"/g, "")).join(", ")
                        : "No especificado";
                    })()}
                  </p>
                </div>

                {/* Áreas */}
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
                        <tr key={inspection.id} onClick={() => handleInspectionClick(inspection)}>
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

              {/* Botón para añadir inspección */}
              <div className="text-center">
                <Button variant="outline-success" onClick={handleShowModal}>
                  <PlusCircle className="me-2" />
                  Añadir Inspección
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={() => setShowDetailsModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={notification.show}
        onHide={() => setNotification({ show: false, title:'', message: '' })}
        centered
        backdrop="static"
        keyboard={false}
      >
        <ModalTitle>
        <p className="m-0">{notification.title}</p>
        </ModalTitle>
        <Modal.Body className="text-center">
          <p className="m-0">{notification.message}</p>
        </Modal.Body>
      </Modal>


    </div>
    
  );
}
export default ServiceList;