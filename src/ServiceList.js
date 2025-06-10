import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import moment, { duration } from 'moment-timezone';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCachedServices, setCachedServices, } from './indexedDBHandler';
import { Calendar, Person, Bag, Building, PencilSquare, Trash, Bug, Diagram3, GearFill, Clipboard, PlusCircle, InfoCircle, FileText, GeoAlt, Stopwatch, Bullseye, ArrowRepeat, Calendar2Check, FileEarmarkWord, FileEarmarkExcel, FileEarmarkPdf, FileEarmarkImage, FileEarmarkArrowDown, EnvelopePaper, Whatsapp, Radioactive } from 'react-bootstrap-icons';
import { Card, Col, Row, Collapse, Button, Table, Modal, Form, CardFooter, ModalTitle } from 'react-bootstrap';
import ClientInfoModal from './ClientInfoModal';
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
  const [showInterventionAreasOptions, setShowInterventionAreasOptions] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [loadingGoogleDrive, setLoadingGoogleDrive] = useState(false);
  const [convertToPdfModalOpen, setConvertToPdfModalOpen] = useState(false);
  const [selectedDocForPdf, setSelectedDocForPdf] = useState(null);
  const [loadingConvertToPdf, setLoadingConvertToPdf] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [actions, setActions] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [loadingWhatsApp, setLoadingWhatsApp] = useState(false);
  const [loadingCorreo, setLoadingCorreo] = useState(false);
  const [showModalActions, setShowModalActions] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [newInspection, setNewInspection] = useState({
    inspection_type: [], // Tipos de inspección seleccionados
    service_type: "", // Tipo de servicio del servicio seleccionado
  });
  const [technicians, setTechnicians] = useState([]);
  const [editService, setEditService] = useState({
    service_type: [],
    description: '',
    intervention_areas: [],
    responsible: '',
    category: '',
    quantity_per_month: '',
    client_id: '',
    duration: '',
    value: '',
    companion: [],
    created_by: userId,
    created_at: moment().format('DD-MM-YYYY'),
  });
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServiceType, setShowServiceType] = useState(false);
  const [showCompanionOptions, setShowCompanionOptions] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [searchText, setSearchText] = useState(''); // Estado para la búsqueda
  const [filteredClients, setFilteredClients] = useState([]); // Clientes filtrados para la búsqueda
  const [showSuggestions, setShowSuggestions] = useState(false); // Controla si se muestran las sugerencias
  const [searchServiceText, setSearchServiceText] = useState(''); // Estado para el texto de búsqueda en servicios
  const [newService, setNewService] = useState({
    service_type: [],
    description: '',
    intervention_areas: [],
    responsible: '',
    category: '',
    quantity_per_month: '',
    date: '',
    time: '',
    client_id: '',
    duration: '4',
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

  const handleShowClientModal = (clientId) => {
    setSelectedClientId(clientId);
    setShowClientModal(true);
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setSelectedClientId(null);
  };

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
        const companionMultiplier = (newService.companion?.length || 0) + 1;
        calculatedValue *= companionMultiplier;
        console.log(
          `Calculando valor para Hogar: Duración=${duration}, Multiplicador=${companionMultiplier}, Valor Base=${calculatedValue}`
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
  ]);

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

  const fetchInspections = async (serviceId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/inspections?service_id=${serviceId}`);
      const formattedInspections = response.data
        .filter((inspection) => inspection.service_id === serviceId) // Filtra por `service_id`
        .map((inspection) => ({
          ...inspection,
          date: moment.utc(inspection.date).startOf('day').format("DD/MM/YYYY"),
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
        setShowDetailsModal(true);
      }
    }
  }, [serviceIdFromState, services]);

  const [availableServiceOptions, setAvailableServiceOptions] = useState([
    "Empresarial",
    "Hogar",
    "Horizontal",
    "Jardineria",
  ]);

  const [showInterventionAreas, setShowInterventionAreas] = useState(false);

  // Estado para controlar si el dropdown está abierto o cerrado
  const [showDropdown, setShowDropdown] = useState(false);

  // Opciones de Áreas de Intervención ordenadas alfabéticamente
  const interventionAreaOptions = [
    "Oficinas,",
    "Sala de juntas",
    "Baños",
    "Servicio de cafetería",
    "Parqueadero",
    "Gradas",
    "Ascensores",
    "Pasillos",
    "Oficinas",
    "Porterías",
    "Zona de residuos orgánicos",
    "Jardines horizontales",
    "Jardines verticales",
  ];

  const handleInterventionAreasChange = (e) => {
    const { value, checked } = e.target;
    setNewService((prevService) => {
      // Asegurar que prevService.intervention_areas sea un array
      const interventionAreas = Array.isArray(prevService.intervention_areas)
        ? prevService.intervention_areas
        : [];

      return {
        ...prevService,
        intervention_areas: checked
          ? [...interventionAreas, value]
          : interventionAreas.filter((area) => area !== value),
      };
    });
  };

  const navigate = useNavigate();

  const handleSchedule = (serviceId) => {
    navigate(`/services-calendar?serviceId=${serviceId}`); // Navega a la ruta con el id del servicio
  };

  const handleInspectionClick = (inspection) => {
    console.log("Clicked inspection:", inspection);
    // Redirigir a la página de Detalles de Inspección con el ID seleccionado
    navigate(`/inspection/${inspection.id}`);
  };


  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const serviceId = queryParams.get('serviceId');
    const dataParam = queryParams.get("data");

    if (serviceId) {
      const service = services.find((s) => s.id === parseInt(serviceId));
      if (service) {
        setSelectedService(service);
        fetchInspections(service.id);
        setShowDetailsModal(true);
      }
    }

    if (dataParam) {
      try {
        const serviceData = JSON.parse(decodeURIComponent(dataParam));
        setNewService((prevService) => ({
          ...prevService,
          ...serviceData,
          created_by: serviceData.created_by || prevService.created_by,
        }));
        setShowAddServiceModal(true);
      } catch (error) {
        console.error("Error procesando datos de la URL:", error);
      }
    }
  }, [location.search, services]);


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
      duration: service.duration ? parseInt(service.duration, 10) : 4,
      intervention_areas: parseField(service.intervention_areas),
      companion: parseField(service.companion),
    });
    setShowEditModal(true); // Muestra el modal de edición
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

  const handleSaveChanges = async () => {
    if (newService.service_type.includes("Hogar")) {
      const duration = parseInt(editService.duration, 10);
      if (duration < 4 || duration > 8) {
        showNotification("Error", "La duración debe estar entre 4 y 8 horas para servicios de tipo Hogar.");
        return;
      }
    }
    try {
      const formattedEditService = {
        ...editService,
        intervention_areas: `{${(editService.intervention_areas || []).map((a) => `"${a}"`).join(",")}}`,
        service_type: `{${(editService.service_type || []).map((s) => `"${s}"`).join(",")}}`,
        companion: `{${(editService.companion || []).map((c) => `"${c}"`).join(",")}}`,
        customInterventionArea: "",
        duration: editService.duration,
      };


      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/services/${editService.id}`,
        formattedEditService
      );

      if (response.data.success) {
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.id === editService.id
              ? { ...formattedEditService, id: editService.id }
              : service
          )
        );

        handleCloseEditModal();
        setEditService(null);
      }
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };


  const handleDeleteClick = async (serviceId) => {
    try {
      const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/services/${serviceId}`);
      if (response.data.success) {
        setServices(services.filter(service => service.id !== serviceId));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users?rol=Operario,Operario Hogar`);
      setTechnicians(response.data);
    } catch (error) {
      console.error("Error fetching technicians:", error);
    }
  };

  useEffect(() => {
    let aborted = false;            // por si desmonta el componente

    const loadServices = async () => {
      /* 1️⃣  Cache first */
      const cached = await getCachedServices();
      if (cached && !aborted) {
        setServices(cached);
        setFilteredServices(cached);
        setLoading(false);          // ya mostramos algo
      }

      /* 2️⃣  Petición a backend + pinta progresiva */
      try {
        const [srvRes, cliRes, techRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/services`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/clients`),
          axios.get(
            `${process.env.REACT_APP_API_URL}/api/users?rol=Operario,Operario Hogar`
          ),
        ]);

        if (aborted) return;        // cancelado

        const clientsMap = {};
        cliRes.data.forEach((c) => (clientsMap[c.id] = c.name));
        setClients(cliRes.data);
        setTechnicians(techRes.data);
        setClientNames(clientsMap);

        /* ⁂  mostramos uno a uno */
        const freshServices = [];
        for (const srv of srvRes.data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)   // DESC
        )) {
          if (aborted) return;
          freshServices.push(srv);

          setServices(prev => {
            if (prev.some(p => p.id === srv.id)) return prev;
            return [...prev, srv];     // ← lo añades al final
          });

          setFilteredServices(prev => {
            if (prev.some(p => p.id === srv.id)) return prev;
            return [...prev, srv];
          });

          await new Promise(r => setTimeout(r));
        }

        /* 3️⃣  Actualiza caché */
        await setCachedServices(freshServices);
      } catch (err) {
        console.error('fetch services error', err);
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    loadServices();
    return () => {
      aborted = true;
    };
  }, []);


  useEffect(() => {
    const fetchServicesAndClients = async () => {
      try {
        const servicesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/services`);
        const clientsResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients`);

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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users?rol=Operario,Operario Hogar`);
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
    const cli = clients.find(c => c.id === service.client_id);
    setClientData(cli);
    fetchActions();
    fetchDocuments(service.id);
    setShowDetailsModal(true); // Abre el modal
  };

  const fetchActions = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/actions-services`);
      setActions(response.data.actions || []); // Asume que el backend devuelve un array de acciones
    } catch (error) {
      console.error('Error fetching actions:', error);
    }
  };

  const fetchDocuments = async (service) => {
    try {
      console.log("📦 fetchDocuments - Iniciando con service:", service);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-documents`, {
        params: { entity_type: 'services', entity_id: service },
      });
      if (response.data.documents && response.data.documents.length > 0) {
        console.log("📄 Documentos encontrados:", response.data.documents);
      } else {
        console.warn("⚠️ No se encontraron documentos para el servicio:", service);
      }
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
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

    const inspectionData = {
      inspection_type: newInspection.inspection_type,
      service_id: selectedService.id,
      date: moment().format("YYYY-MM-DD"), // Fecha actual
      time: moment().format("HH:mm:ss"), // Hora actual
      createdBy: userId,
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/inspections`, inspectionData);

      if (response.data.success) {
        showNotification("Error", "Inspección guardada con éxito");
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


  const handleCloseAddServiceModal = () => {
    setNewService({
      service_type: [],
      description: '',
      intervention_areas: [],
      customInterventionArea: '',
      responsible: '',
      category: '',
      quantity_per_month: '',
      date: '',
      time: '',
      client_id: '',
      value: '',
      companion: [],
      created_by: userId,
      created_at: moment().format('DD-MM-YYYY'),
    });
    setShowAddServiceModal(false);
  };

  const handleCloseEditModal = () => {
    setEditService({
      service_type: [],
      description: '',
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
    setShowEditModal(false);
  };

  const handleNewServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService({ ...newService, [name]: value });
  };

  const handleSaveNewService = async () => {
    if (newService.service_type.includes("Hogar")) {
      const duration = parseInt(newService.duration, 10);
      if (duration < 4 || duration > 8) {
        showNotification("Error", "La duración debe estar entre 4 y 8 horas para servicios de tipo Hogar.");
        return;
      }
    }

    const serviceData = {
      ...newService,
      quantity_per_month: newService.quantity_per_month || null,
      client_id: newService.client_id || null,
      value: newService.value || null,
      responsible: newService.responsible || null,
      companion: newService.companion || [],
      duration: newService.duration,
    };

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/services`, serviceData);
      if (response.data.success) {
        const createdService = response.data.service;
        setServices([...services, response.data.service]);
        handleCloseAddServiceModal();
        showNotification("Exito", "Servicio guardado exitosamente");
        navigate(`/services-calendar?serviceId=${createdService.id}`);
      } else {
        console.error("Error: No se pudo guardar el servicio.", response.data.message);
        showNotification("Error", "Error: No se pudo guardar el servicio");
      }
    } catch (error) {
      console.error("Error saving new service:", error);
      showNotification("Error", "Error: Hubo un problema al guardar el servicio");
    }
  };

  const handleDocumentClick = (documentUrl) => {
    setSelectedDocument(documentUrl);
    setDocumentModalOpen(true);
  };

  // Abrir el modal
  const handleOpenConvertToPdfModal = () => {
    setConvertToPdfModalOpen(true);
  };

  // Cerrar el modal
  const handleCloseConvertToPdfModal = () => {
    setConvertToPdfModalOpen(false);
    setSelectedDocForPdf(null);
  };

  // Realizar la conversión a PDF
  const handleConvertToPdf = async () => {
    setLoadingConvertToPdf(true); // Mostrar spinner
    try {
      console.log("Enviando solicitud para convertir a PDF...");
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/convert-to-pdf`, {
        generatedDocumentId: selectedDocForPdf.id,
      });

      console.log("Respuesta recibida del backend:", response.data);

      if (response.data.success) {
        console.log("Conversión exitosa. Datos del nuevo documento:", response.data.newDocument);
        setConvertToPdfModalOpen(false);
        console.log("Actualizando lista de documentos...");
        await fetchDocuments();
      } else {
        console.error("Error en la conversión del documento:", response.data.message);
        alert(response.data.message || "Ocurrió un error al convertir el documento.");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      alert("Error de conexión con el servidor al intentar convertir el documento.");
    } finally {
      setLoadingConvertToPdf(false); // Ocultar spinner
    }
  };

  const handleActionClick = async (configurationId) => {
    if (isExecuting) return;
    setIsExecuting(true);

    try {
      const payload = {
        idEntity: selectedService.id,
        id: configurationId,
        uniqueId: Date.now(),
      };

      console.log("📤 Enviando payload a /api/create-document-service:", payload);

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/create-document-service`,
        payload
      );

      console.log("✅ Respuesta del backend:", response);
      console.log("📦 response.data:", response.data);

      if (response.data?.success === true) {
        console.log("🎉 Acción ejecutada correctamente");
        showNotification("Acción ejecutada con éxito.");
        await fetchDocuments(selectedService.id); // asegúrate de pasar el ID
      } else {
        console.warn("⚠️ El backend no devolvió 'success: true'");
        showNotification("Error al ejecutar la acción.");
      }
    } catch (error) {
      console.error("❌ Error al ejecutar la acción:", error);
      if (error.response) {
        console.error("📄 error.response.data:", error.response.data);
        console.error("📄 error.response.status:", error.response.status);
      }
      showNotification("Error al ejecutar la acción.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/PrefirmarArchivos`, { url: selectedDocument.document_url });
      if (response.data.signedUrl) {
        const preSignedUrl = response.data.signedUrl;
        const link = document.createElement('a');
        link.href = preSignedUrl;
        link.download = 'document'; // Cambia el nombre del archivo si es necesario
        link.click();
      } else {
        alert('No se pudo obtener la URL prefirmada.');
      }
    } catch (error) {
      console.error('Error al obtener la URL prefirmada para descargar:', error);
      alert('Hubo un error al procesar la solicitud.');
    }
  };

  const handleEditGoogleDrive = async () => {
    setLoadingGoogleDrive(true); // Mostrar el spinner
    try {
      console.log("Iniciando pre-firmado del documento:", selectedDocument);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/PrefirmarArchivos`, { url: selectedDocument.document_url });
      console.log("Respuesta de pre-firmado:", response.data);

      if (response.data.signedUrl) {
        const preSignedUrl = response.data.signedUrl;
        console.log("URL prefirmada obtenida:", preSignedUrl);

        console.log("Enviando solicitud para editar en Google Drive...");
        const googleDriveResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/edit-googledrive`, { s3Url: preSignedUrl });
        console.log("Respuesta de edición en Google Drive:", googleDriveResponse.data);

        if (googleDriveResponse.data.success && googleDriveResponse.data.fileId) {
          const googleDriveEditUrl = `https://docs.google.com/document/d/${googleDriveResponse.data.fileId}/edit`;
          console.log("URL de edición en Google Drive:", googleDriveEditUrl);

          // Abrir Google Drive en una nueva pestaña
          window.open(googleDriveEditUrl, "_blank", "noopener,noreferrer");

          // Pasar información al nuevo componente
          const documentInfo = {
            id: selectedDocument.id,
            entity_id: selectedDocument.entity_id,
            document_url: selectedDocument.document_url,
            google_drive_url: googleDriveEditUrl,
            google_drive_id: googleDriveResponse.data.fileId,
          };

          console.log("Información del documento que se pasa al componente:", documentInfo);

          navigate("/edit-google-drive", {
            state: {
              documentInfo,
            },
          });
        } else {
          console.error("No se pudo obtener el archivo en Google Drive:", googleDriveResponse.data);
          alert("No se pudo obtener el archivo en Google Drive.");
        }
      } else {
        console.error("No se pudo obtener la URL prefirmada.");
        alert("No se pudo obtener la URL prefirmada.");
      }
    } catch (error) {
      console.error("Error al procesar la solicitud de Google Drive:", error);
      alert("Hubo un error al procesar la solicitud.");
    } finally {
      setLoadingGoogleDrive(false); // Ocultar el spinner
    }
  };


  const handleEditLocal = () => {
    navigate("/edit-local-file", { state: { documentId: selectedDocument.id } });
  };

  const closeDocumentModal = () => {
    setSelectedDocument(null);
    setDocumentModalOpen(false);
  };

  const handleCompanionChange = (e) => {
    const { value, checked } = e.target;
    setNewService((prevService) => ({
      ...prevService,
      companion: checked
        ? [...prevService.companion, value] // Agrega el ID si está seleccionado
        : prevService.companion.filter((companionId) => companionId !== value) // Elimina el ID si se deselecciona
    }));
  };

  const handleEditCompanionChange = (e) => {
    const { value, checked } = e.target;

    setEditService((prevService) => {
      let updatedCompanions = checked
        ? [...prevService.companion, value] // Agregar el ID si está seleccionado
        : prevService.companion.filter((companionId) => companionId !== value); // Eliminar el ID si se deselecciona

      // Filtra valores vacíos o nulos
      updatedCompanions = updatedCompanions.filter((id) => id.trim() !== "");

      return {
        ...prevService,
        companion: updatedCompanions.length > 0 ? updatedCompanions : [], // Mantiene [] si no hay acompañantes
      };
    });
  };

  return (
    <div className="container mt-4">
      {loading && services.length === 0 && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 2050,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="spinner-border text-secondary" role="status" style={{ width: "5rem", height: "5rem" }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

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
                          className={`menu-actions ${expandedCardId === service.id ? "expand" : "collapse"
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
          <Modal.Title><PlusCircle /> Añadir Servicio</Modal.Title>
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
          <Button variant="dark" onClick={() => handleCloseAddServiceModal()}>
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
                  {availableServiceOptions.map((option, index) => (
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

              {/* Áreas de Intervención */}
              {editService.service_type.length > 0 && // Verifica que haya al menos un tipo seleccionado
                !editService.service_type.includes("Hogar") && ( // Asegúrate de que no sea "Hogar"
                  <Form.Group className="mt-3">
                    <Form.Label style={{ fontWeight: "bold" }}>Áreas de Intervención</Form.Label>
                    <div className="d-flex flex-wrap">
                      {editService.service_type
                        .flatMap((type) => serviceAreaMapping[type] || []) // Obtiene las áreas correspondientes
                        .filter((area, index, self) => self.indexOf(area) === index) // Elimina duplicados
                        .map((area, index) => (
                          <div key={index} className="col-4 mb-2">
                            <Form.Check
                              type="checkbox"
                              label={<span style={{ fontSize: "0.8rem" }}>{area}</span>}
                              value={area}
                              checked={editService.intervention_areas.includes(area)}
                              onChange={handleInterventionAreasChange}
                            />
                          </div>
                        ))}
                    </div>
                  </Form.Group>
                )}

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

              <Form.Group className="mt-3">
                <Form.Label style={{ fontWeight: "bold" }}>Duración</Form.Label>
                <Form.Control
                  type="number"
                  name="duration"
                  value={editService.duration} // Evita que el campo quede vacío o NaN
                  min="4"
                  max="8"
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === "") {
                      // Permite borrar el valor y evitar NaN
                      setEditService({ ...editService, duration: "" });
                      return;
                    }
                    const value = Math.max(4, Math.min(8, parseInt(inputValue, 10) || 4)); // Asegura un número válido
                    setEditService({ ...editService, duration: value });
                  }}
                />
              </Form.Group>

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
                        checked={editService.companion.includes(technician.id)}
                        onChange={handleEditCompanionChange}
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
          <Button variant="dark" onClick={() => handleCloseEditModal()}>
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
              <button
                className="btn btn-outline-success d-flex align-items-center w-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSchedule(selectedService.id);
                }}
              >
                <Calendar2Check size={18} className="me-2" />
                Agendar Servicio
              </button>
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
                  <div className='p-0 m-0 d-flex'>
                    <p className="my-1"><strong>Empresa:</strong> {clientNames[selectedService.client_id] || "Cliente Desconocido"}</p>
                    {selectedService.client_id && (
                      <Building
                        className='ms-2 mt-1'
                        style={{ cursor: "pointer" }}
                        size={22}
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que se activen otros eventos del Card
                          handleShowClientModal(selectedService.client_id);
                        }}
                      />
                    )}
                  </div>
                  <p className='my-1'><strong>Responsable:</strong> {technicians.find((tech) => tech.id === selectedService.responsible)?.name || "No asignado"}</p>
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
                  <p><strong>Valor:</strong> {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(selectedService.value)}</p>
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
                  <div className="custom-table-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Fecha</th>
                          <th>Creado por</th>
                          <th>Inicio</th>
                          <th>Finalización</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections
                          .slice() // Clonamos para no mutar el estado original
                          .sort((a, b) => {
                            const dateTimeA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
                            const dateTimeB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
                            return dateTimeB - dateTimeA; // Orden descendente (más recientes primero)
                          })
                          .map((inspection) => (
                            <tr key={inspection.id} onClick={() => handleInspectionClick(inspection)}>
                              <td>{inspection.id}</td>
                              <td>{inspection.date}</td>
                              <td>{technicians.find((tech) => tech.id === inspection.created_by)?.name || "No asignado"}</td>
                              <td>{inspection.time}</td>
                              <td>{inspection.exit_time}</td>
                              <td>{inspection.observations}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No hay inspecciones registradas.</p>
                )}
              </div>

              {/* Botón para añadir inspección */}
              <div className="text-center">
                <Button variant="outline-success mb-3" onClick={handleShowModal}>
                  <PlusCircle className="me-2" />
                  Añadir Inspección
                </Button>
              </div>

              {/* Documentos */}
              <div className="bg-white shadow-sm rounded p-3">
                <h5 className="text-secondary mb-3">
                  <FileEarmarkArrowDown className="me-2" /> Documentos
                </h5>
                {documents.length > 0 ? (
                  <div className="row" style={{ minHeight: 0, height: 'auto' }}>
                    {documents.map((doc, index) => {
                      let Icon;
                      switch (doc.document_type) {
                        case "doc":
                          Icon = <FileEarmarkWord size={40} color="blue" title="Word" />;
                          break;
                        case "xlsx":
                          Icon = <FileEarmarkExcel size={40} color="green" title="Excel" />;
                          break;
                        case "pdf":
                          Icon = <FileEarmarkPdf size={40} color="red" title="PDF" />;
                          break;
                        case "jpg":
                        case "jpeg":
                        case "png":
                          Icon = <FileEarmarkImage size={40} color="orange" title="Imagen" />;
                          break;
                        default:
                          Icon = <FileEarmarkArrowDown size={40} color="gray" title="Archivo" />;
                      }

                      return (
                        <div className="col-6 col-md-3 text-center mb-3" key={index}>
                          <button
                            className="btn p-0"
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                            onClick={() => handleDocumentClick(doc)}
                          >
                            {Icon}
                            <div className="mt-2">
                              <small className="text-muted">{doc.document_name}</small>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted">No se encontraron documentos relacionados con este servicio.</p>
                )}
              </div>

              {/* Acciones */}
              <div className="bg-white shadow-sm rounded p-3 mt-4">
                <h5 className="text-secondary mb-3">
                  <GearFill className="me-2" /> Acciones
                </h5>
                {actions.length > 0 ? (
                  <div className="row" style={{ minHeight: 0, height: 'auto' }}>
                    {actions.map((action, index) => {
                      let IconComponent, color;
                      switch (action.action_type) {
                        case "generate_doc":
                          IconComponent = FileEarmarkWord;
                          color = "blue";
                          break;
                        case "generate_xlsm":
                          IconComponent = FileEarmarkExcel;
                          color = "green";
                          break;
                        case "generate_pdf":
                          IconComponent = FileEarmarkPdf;
                          color = "red";
                          break;
                        case "generate_img":
                          IconComponent = FileEarmarkImage;
                          color = "orange";
                          break;
                        case "send_email":
                          IconComponent = EnvelopePaper;
                          color = "black";
                          break;
                        case "send_whatsapp":
                          IconComponent = Whatsapp;
                          color = "green";
                          break;
                        default:
                          IconComponent = Radioactive;
                          color = "gray";
                          break;
                      }

                      return (
                        <div className="col-6 col-md-3 text-center mb-3" key={index}>
                          <button
                            className="btn p-0"
                            style={{ background: "none", border: "none", cursor: "pointer" }}
                            onClick={() =>
                              action.action_type === "generate_pdf" && action.configuration_id === 0
                                ? handleOpenConvertToPdfModal()
                                : handleActionClick(action.configuration_id)
                            }
                          >
                            <IconComponent size={40} color={color} title={action.action_name} />
                            <div className="mt-2">
                              <small className="text-muted">{action.action_name}</small>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted">No se encontraron acciones configuradas para este servicio.</p>
                )}
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
        onHide={() => setNotification({ show: false, title: '', message: '' })}
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

      <ClientInfoModal
        clientId={selectedClientId}
        show={showClientModal}
        onClose={handleCloseClientModal}
      />


      <Modal show={documentModalOpen} onHide={closeDocumentModal}>
        <Modal.Header closeButton>
          <Modal.Title>Acciones del Documento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDocument?.document_type === "pdf" && (
            <Button
              variant="primary"
              className="mb-3 w-100"
              onClick={async () => {
                try {
                  const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/PrefirmarArchivosPDF`, {
                    url: selectedDocument.document_url,
                  });

                  if (response.data.signedUrl) {
                    setPdfUrl(response.data.signedUrl);
                    setShowModalActions(true);
                  } else {
                    showNotification("No se pudo obtener la URL prefirmada.");
                  }
                } catch (error) {
                  console.error("Error al obtener la URL prefirmada:", error);
                  showNotification("Hubo un error al procesar la solicitud.");
                }
              }}
            >
              Ver
            </Button>
          )}
          <Button variant="secondary" className="mb-3 w-100" onClick={handleDownload}>
            Descargar
          </Button>
          <Button variant="warning" className="mb-3 w-100" onClick={handleEditLocal}>
            Actualizar
          </Button>
          <Button
            variant="success"
            className="mb-3 w-100"
            onClick={async () => {
              try {
                setLoadingWhatsApp(true);

                console.log("Datos del Cliente: ", clientData)

                const payload = {
                  nombre: clientData?.name,
                  telefono: `57${clientData?.phone}`,
                  documento: selectedDocument.document_url,
                  nombreDocumento: selectedDocument?.document_name || "Acta de servicio"
                };

                const sendResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/enviar-botix-acta`, payload);

                if (sendResponse.data.success) {
                  showNotification("Documento enviado por WhatsApp exitosamente.");
                } else {
                  showNotification("Error al enviar el documento por WhatsApp.");
                }

              } catch (error) {
                console.error("Error al enviar documento por WhatsApp:", error);
                showNotification("Hubo un error al enviar el documento.");
              } finally {
                setLoadingWhatsApp(false);
              }
            }}
          >
            {loadingWhatsApp ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}></span>
                Enviando...
              </>
            ) : (
              "Enviar por WhatsApp"
            )}
          </Button>
          <Button
            variant="info"
            className="mb-3 w-100"
            onClick={async () => {
              try {
                setLoadingCorreo(true);
                console.log("Datos del Cliente (Correo): ", clientData);

                const payload = {
                  nombre: clientData?.name,
                  telefono: `57${clientData?.phone}`,
                  correo: clientData?.email,
                  documento: selectedDocument.document_url,
                  nombreDocumento: selectedDocument?.document_name || "Acta de servicio"
                };

                const sendResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/enviar-acta-por-correo`, payload);

                if (sendResponse.data.success) {
                  showNotification("📧 Documento enviado por correo exitosamente.");
                } else {
                  showNotification("❌ Error al enviar el documento por correo.");
                }

              } catch (error) {
                console.error("❌ Error al enviar documento por correo:", error);
                showNotification("Hubo un error al enviar el documento por correo.");
              } finally {
                setLoadingCorreo(false);
              }
            }}
          >
            {loadingCorreo ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" style={{ width: "1rem", height: "1rem" }}></span>
                Enviando...
              </>
            ) : (
              "Enviar por Correo"
            )}
          </Button>
        </Modal.Body>
      </Modal>

      <Modal
        show={convertToPdfModalOpen}
        onHide={handleCloseConvertToPdfModal}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Convertir Documento a PDF</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Selecciona un documento en formato DOC para convertirlo a PDF:</p>
          <ul className="list-group">
            {documents
              .filter((doc) => doc.document_type === "doc")
              .map((doc) => (
                <li
                  key={doc.id}
                  className={`list-group-item ${selectedDocForPdf?.id === doc.id ? "active" : ""
                    }`}
                  onClick={() => setSelectedDocForPdf(doc)}
                  style={{ cursor: "pointer" }}
                >
                  {doc.document_name}
                </li>
              ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleCloseConvertToPdfModal}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleConvertToPdf}
            disabled={!selectedDocForPdf || loadingConvertToPdf} // Deshabilitado si está cargando
          >
            {loadingConvertToPdf ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Convirtiendo...
              </>
            ) : (
              "Convertir a PDF"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showModalActions}
        onHide={() => showModalActions(false)}
        size="xl"
        centered
      >
        <Modal.Body
          style={{
            height: "100vh",
            overflow: "hidden",
            padding: 0, // opcional: elimina padding si no lo necesitas
          }}>
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              title="Vista previa PDF"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            ></iframe>
          )}
        </Modal.Body>
      </Modal>

      {isExecuting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 2050,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div className="spinner-border text-secondary" role="status" style={{ width: "5rem", height: "5rem" }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

    </div>

  );
}
export default ServiceList;