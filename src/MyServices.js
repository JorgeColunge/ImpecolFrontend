import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { getServices, saveServices, saveEvents, getEvents, saveTechnicians, getTechnicians, saveInspections, getInspections, syncPendingInspections, savePendingInspection } from "./indexedDBHandler";
import { Card, Col, Row, Button, Table, Modal, Form, ModalTitle } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Calendar, Person, Bag, Building, PencilSquare, Trash, Bug, Diagram3, GearFill, Clipboard, PlusCircle, InfoCircle, FileText, GeoAlt, PersonFill, Stopwatch, Bullseye, ArrowRepeat } from 'react-bootstrap-icons';
import { useNavigate, useLocation } from 'react-router-dom';
import ClientInfoModal from './ClientInfoModal'; // Ajusta la ruta según la ubicación del componente
import './ServiceList.css'
import { useSocket } from './SocketContext';

function MyServices() {
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
  const dropdownRef = useRef(null);
  const socket = useSocket();

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
        setShowServiceModal(true);
      }
    }
  }, [serviceIdFromState, services]);

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
          // Consultar los detalles del evento si no están completos en `newEvent`
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/service-schedule/${newEvent.id}`);
          const detailedEvent = response.data;

          // Formatea el evento y actualiza el estado
          setScheduledEvents((prevEvents) => [
            ...prevEvents,
            {
              ...detailedEvent,
              start: detailedEvent.start,
              end: detailedEvent.end,
              color: detailedEvent.color || '#007bff',
            },
          ]);

          // Opcional: Mostrar notificación o alerta
          showNotification("Nuevo Evento", "Se ha añadido un nuevo evento al calendario.");
        } catch (error) {
          console.error("Error al obtener detalles del evento:", error);
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

  useEffect(() => {
    if (socket) {
      socket.on("inspection_synced", ({ oldId, newId }) => {
        console.log(`🔄 La inspección ${oldId} ha sido actualizada a ${newId}`);

        setInspections((prevInspections) => {
          // Crear una copia del estado de inspecciones
          const updatedInspections = { ...prevInspections };

          // Buscar en qué servicio está la inspección con oldId
          for (const serviceId in updatedInspections) {
            const inspectionsList = updatedInspections[serviceId];

            // Buscar la inspección que tiene el oldId
            const index = inspectionsList.findIndex((inspection) => inspection.id === oldId);

            if (index !== -1) {
              // Si encontramos la inspección, actualizamos su ID
              updatedInspections[serviceId][index] = {
                ...inspectionsList[index],
                id: newId, // Reemplazar ID viejo con el nuevo
              };

              console.log(`✅ Inspección ${oldId} actualizada a ${newId} en el frontend.`);
              break; // No necesitamos seguir buscando
            }
          }

          return updatedInspections; // Devolvemos la versión actualizada
        });
      });

      return () => {
        socket.off("inspection_synced");
      };
    }
  }, [socket]);

  useEffect(() => {
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
                clientData[service.client_id] = clientResponse.data.name; // Asegurar que solo se almacene el nombre como string
              } catch (error) {
                console.error(`⚠️ Error obteniendo cliente ${service.client_id}:`, error);
              }
            }
          }

          // Guardar en IndexedDB
          await saveServices(userServices, clientData);
          console.log("📥 Servicios y clientes almacenados en IndexedDB.");

          // Actualizar el estado con los datos
          setClientNames(clientData);
          setServices(userServices);
          fetchAllInspections(userServices);
        } else {
          console.log("📴 Modo offline: obteniendo datos desde IndexedDB...");

          const { services, clients } = await getServices();

          console.log("📂 Servicios obtenidos desde IndexedDB:", services);
          console.log("📂 Clientes obtenidos desde IndexedDB:", clients);

          if (!services || services.length === 0) {
            console.error("❌ No se encontraron servicios en IndexedDB.");
          }

          setClientNames(clients);
          setServices(services);
          fetchAllInspections(services);
        }
      } catch (error) {
        console.error("❌ Error al obtener servicios:", error);

        if (error instanceof TypeError && error.message.includes("Failed to convert value to 'Response'")) {
          console.error("⚠️ Error del Service Worker detectado: posible fallo de red o solicitud interceptada.");
        }

        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMyServices();
  }, [userId]);

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

          setScheduledEvents(response.data);
        } else {
          console.log("📴 Modo offline: obteniendo eventos desde IndexedDB...");
          const offlineEvents = await getEvents();
          setScheduledEvents(offlineEvents);
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

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        if (navigator.onLine) {
          console.log("🌐 Modo online: obteniendo técnicos desde el servidor...");
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users?role=Technician`);

          console.log("✅ Respuesta de la API de técnicos:", response.data);

          // Guardar técnicos en IndexedDB para modo offline
          await saveTechnicians(response.data);

          setTechnicians(response.data);
        } else {
          console.log("📴 Modo offline: obteniendo técnicos desde IndexedDB...");
          const offlineTechnicians = await getTechnicians();
          setTechnicians(offlineTechnicians);
        }

      } catch (error) {
        console.error("❌ Error al obtener técnicos:", error);
      }
    };

    fetchTechnicians();
  }, []);

  useEffect(() => {
    const syncOnReconnect = () => {
      console.log("🌐 Conexión restaurada, sincronizando inspecciones...");
      syncPendingInspections();
    };

    window.addEventListener("online", syncOnReconnect);

    return () => {
      window.removeEventListener("online", syncOnReconnect);
    };
  }, []);


  const today = moment().utc().startOf('day');
  const nextWeek = moment().utc().add(7, 'days').endOf('day');

  const filteredScheduledServices = services
    .flatMap(service => {
      const serviceEvents = scheduledEvents
        .filter(event => event.service_id === service.id)
        .filter(event => {
          const eventDate = moment.utc(event.date).startOf('day');

          console.log({
            event_id: event.id,
            raw_date: event.date,
            parsed_local: eventDate.format(),
            today: today.format(),
            nextWeek: nextWeek.format(),
            isBetween: eventDate.isBetween(today, nextWeek, null, '[]')
          });

          return eventDate.isBetween(today, nextWeek, null, '[]');
        });

      return serviceEvents.map(event => ({
        ...service,
        scheduledDate: event.date
      }));
    })
    .sort((a, b) => moment(a.scheduledDate) - moment(b.scheduledDate));

  const groupedServicesByDate = filteredScheduledServices.reduce((acc, service) => {
    const dateKey = moment.utc(service.scheduledDate).format('YYYY-MM-DD');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(service);
    return acc;
  }, {});

  const formatDate = (dateStr) => {
    const eventDate = moment.utc(dateStr).startOf('day');
    const today = moment().utc().startOf('day');
    const tomorrow = moment().utc().add(1, 'days').startOf('day');

    if (eventDate.isSame(today, 'day')) return 'Hoy';
    if (eventDate.isSame(tomorrow, 'day')) return 'Mañana';
    return eventDate.format('DD-MM-YYYY');
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

        // Actualizar estado en el frontend
        setInspections(inspectionsByService);

      } else {
        console.log("📴 Modo offline: obteniendo inspecciones desde IndexedDB...");

        const offlineInspections = await getInspections();

        console.log("✅ Inspecciones recuperadas desde IndexedDB:", offlineInspections);

        setInspections(offlineInspections); // 🔥 Ahora está en formato `{ service_id: [inspections] }`
      }

    } catch (error) {
      console.error("❌ Error cargando inspecciones:", error);
    }
  };

  const fetchInspections = async (serviceId) => {
    try {
      if (navigator.onLine) {
        console.log(`🌐 Modo online: obteniendo inspecciones desde el servidor para el servicio ${serviceId}...`);
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/inspections_service/${serviceId}`);
        console.log("✅ Respuesta de la API de inspecciones:", response.data);

        // Formatear inspecciones antes de guardar
        const formattedInspections = response.data.map((inspection) => ({
          ...inspection,
          date: moment(inspection.date).format("DD/MM/YYYY"),
          time: inspection.time ? moment(inspection.time, "HH:mm:ss").format("HH:mm") : "--",
          exit_time: inspection.exit_time ? moment(inspection.exit_time, "HH:mm:ss").format("HH:mm") : "--",
          observations: inspection.observations || "Sin observaciones",
          findings: inspection.findings ? JSON.parse(inspection.findings) : [],
        }));

        console.log("📋 Inspecciones formateadas antes de guardar:", formattedInspections);

        // Guardar en IndexedDB
        await saveInspections(formattedInspections);

        setInspections(formattedInspections);
      } else {
        console.log(`📴 Modo offline: obteniendo inspecciones desde IndexedDB para el servicio ${serviceId}...`);
        const offlineInspections = await getInspections(serviceId);
        setInspections(offlineInspections);
      }

    } catch (error) {
      console.error("❌ Error fetching inspections:", error);
    }
  };

  const handleServiceClick = (service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const handleCloseServiceModal = () => {
    setShowServiceModal(false);
    setSelectedService(null);
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

  const handleSaveInspection = async () => {
    console.log("📌 Iniciando guardado de inspección...");

    if (!Array.isArray(newInspection.inspection_type) || newInspection.inspection_type.length === 0) {
      showNotification("Error", "Debe seleccionar al menos un tipo de Inspección.");
      return;
    }

    if (
      newInspection.inspection_type.includes("Desratización") &&
      !newInspection.inspection_sub_type
    ) {
      showNotification("Error", "Debe seleccionar un Sub tipo para Desratización.");
      return;
    }

    const inspectionData = {
      inspection_type: newInspection.inspection_type,
      inspection_sub_type: newInspection.inspection_type.includes("Desratización")
        ? newInspection.inspection_sub_type
        : null,
      service_id: selectedService.id,
      date: moment().format("YYYY-MM-DD"),
      time: moment().format("HH:mm:ss"),
      observations: newInspection.observations || "Sin observaciones",
      status: "pending",  // Indica que está pendiente de sincronización
      createdBy: userId,
    };

    console.log("📋 Inspección generada:", inspectionData);

    if (!navigator.onLine) {
      console.log("📴 Modo offline detectado. Guardando inspección en IndexedDB...");

      try {
        const idLocal = await savePendingInspection(inspectionData);

        if (idLocal) {
          showNotification("Guardado", "Inspección almacenada para sincronización.");
          handleCloseAddInspectionModal();

          // 🔄 Redirigir usando el ID local
          navigate(`/inspection/${idLocal}`);
        }

      } catch (error) {
        console.error("❌ Error al guardar inspección en IndexedDB:", error);
      }

    } else {
      try {
        console.log("🌐 Enviando inspección al servidor...");
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/inspections`, inspectionData);

        if (response.data.success) {
          console.log(`✅ Inspección guardada correctamente con ID ${response.data.inspection.id}`);
          showNotification("Éxito", "Inspección guardada exitosamente.");
          fetchInspections(selectedService.id);
          handleCloseAddInspectionModal();
          navigate(`/inspection/${response.data.inspection.id}`);
        } else {
          console.error("❌ Error al guardar inspección:", response.data.message);
        }
      } catch (error) {
        console.error("❌ Error al guardar inspección:", error);
      }
    }
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
          {Object.keys(groupedServicesByDate).map(dateKey => (
            <div key={dateKey} className="mb-1">
              <h4 className='pb-2'>{formatDate(dateKey)}</h4>
              <Row style={{ minHeight: 0, height: 'auto' }}>
                {groupedServicesByDate[dateKey].map((service, index) => (
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
                            className={`menu-actions ${expandedCardId === `${service.id}-${index}` ? "expand" : "collapse"
                              }`}
                          >
                            <button
                              className="btn d-block"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedService(service); // Asegúrate de seleccionar el servicio
                                handleShowAddInspectionModal();
                              }}
                            >
                              <PlusCircle size={18} className="me-2" />
                              Añadir Inspección
                            </button>
                          </div>
                        )}
                      </Card.Footer>

                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
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
                        style={{ cursor: "pointer" }}
                        size={22}
                        onClick={(e) => {
                          e.stopPropagation(); // Evita que se activen otros eventos del Card
                          handleShowClientModal(selectedService.client_id);
                        }}
                      />
                    )}
                  </div>
                  <p className="my-1"><strong>Responsable:</strong> {technicians.find((tech) => tech.id === selectedService.responsible)?.name || "No asignado"}</p>
                  {selectedService.category === "Periódico" && (
                    <p><strong>Cantidad al Mes:</strong> {selectedService.quantity_per_month}</p>
                  )}
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
                {inspections[selectedService.id] && inspections[selectedService.id].length > 0 ? (
                  <div className="custom-table-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Fecha</th>
                          <th>Creada por</th>
                          <th>Inicio</th>
                          <th>Finalización</th>
                          <th>Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspections[selectedService.id]
                          .slice() // Clonamos el array para evitar modificar el estado original
                          .sort((a, b) => {
                            // Convertimos la fecha y la hora en un objeto Date para cada inspección
                            const dateTimeA = new Date(`${a.date.split('/').reverse().join('-')}T${a.time}`);
                            const dateTimeB = new Date(`${b.date.split('/').reverse().join('-')}T${b.time}`);
                            return dateTimeB - dateTimeA; // Orden descendente (más recientes primero)
                          })
                          .map((inspection) => (
                            <tr key={inspection.id} onClick={() => navigate(`/inspection/${inspection.id}`)}>
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
                  <p>No hay inspecciones registradas para este servicio.</p>
                )}
              </div>

              {/* Botón para añadir inspección */}
              <div className="text-center">
                <Button variant="outline-success" onClick={handleShowAddInspectionModal}>
                  <PlusCircle className="me-2" />
                  Añadir Inspección
                </Button>
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

      {/* Modal para añadir una nueva inspección */}
      <Modal show={showAddInspectionModal} onHide={handleCloseAddInspectionModal}>
        <Modal.Header closeButton>
          <Modal.Title>Añadir Inspección</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Selección de Tipo de Inspección */}
            <Form.Group controlId="formInspectionType" className="mt-3">
              <Form.Label>Tipo de Inspección</Form.Label>
              <div>
                {parseServiceType(selectedService?.service_type || "").map((type, idx) => (
                  <Form.Check
                    key={idx}
                    type="checkbox"
                    label={type.replace(/"/g, "")} // Elimina comillas en el texto
                    value={type.replace(/"/g, "")} // Elimina comillas en el valor
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

            {/* Sub tipo de inspección */}
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
          <Button variant="dark" onClick={handleCloseAddInspectionModal}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSaveInspection}>
            Guardar Inspección
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

    </div>
  );
}

export default MyServices;