import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'; // Asegúrate de importar useLocation
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ClientInfoModal from './ClientInfoModal';
import esLocale from '@fullcalendar/core/locales/es';
import { Button, Modal, Form, Col, Row, Table } from 'react-bootstrap';
import { ChevronLeft, ChevronRight, Plus, GearFill, InfoCircle, Bug, GeoAlt, FileText, Clipboard, PlusCircle, PencilSquare, Trash, Building, BuildingFill, EyeFill } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './InspectionCalendar.css';
import moment from 'moment-timezone';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';

const InspectionCalendar = () => {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]); // Todos los eventos cargados
    const [mesComp, setMesComp] = useState(moment().format('MM/YYYY')); // Estado para mesComp
    const [services, setServices] = useState([]);
    const calendarRef = useRef(null);
    const [currentView, setCurrentView] = useState('timeGridWeek');
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null); // Evento seleccionado
    const [showEventModal, setShowEventModal] = useState(false); // Estado del modal
    const [schedules, setSchedules] = useState([
        {
            date: moment().format('YYYY-MM-DD'),
            startTime: moment().format('HH:mm'),
            endTime: moment().add(1, 'hour').format('HH:mm'),
        },
    ]);    
    const [users, setUsers] = useState([]); // Lista de usuarios
    const [isCollapsed, setIsCollapsed] = useState(true); // Estado de la columna colapsable
    const [selectedUsers, setSelectedUsers] = useState([]); // Lista de usuarios seleccionados
    const [alertMessage, setAlertMessage] = useState('');
    const [scheduleConflictMessage, setScheduleConflictMessage] = useState('');
    const [inspections, setInspections] = useState([]);
    const [showClientModal, setShowClientModal] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
    const [newInspection, setNewInspection] = useState({
        inspection_type: [],
        inspection_sub_type: '',
    });
    const [editEventModalOpen, setEditEventModalOpen] = useState(false);
    const [deleteEventModalOpen, setDeleteEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showRepetitiveOptions, setShowRepetitiveOptions] = useState(false);
    const [repetitiveStartDate, setRepetitiveStartDate] = useState('');
    const [repetitiveEndDate, setRepetitiveEndDate] = useState('');
    const [repetitionOption, setRepetitionOption] = useState('');
    const userTimeZone = moment.tz.guess();
    const navigate = useNavigate();
    const socket = useSocket();

    const location = useLocation(); // Para acceder a los parámetros de la URL

    useEffect(() => {
        const today = moment(); // Obtiene la fecha actual
        const formattedDate = today.format('YYYY-MM-DD'); // Formato completo
        const day = today.format('DD'); // Solo el día
        const month = today.format('MM'); // Solo el mes
    
        console.log(`Fecha actual: ${formattedDate}`);
        console.log(`Día: ${day}`);
        console.log(`Mes: ${month}`);
    }, []);    

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search); // Obtén los parámetros de la URL
        const serviceId = queryParams.get('serviceId'); // Extrae serviceId

        if (serviceId) {
            // Busca el servicio correspondiente
            const selectedServiceData = services.find((service) => service.id === serviceId);

            if (selectedServiceData) {
                setSelectedService(serviceId); // Establece el ID del servicio seleccionado
                setScheduleModalOpen(true); // Abre el modal
            } else {
                console.warn(`Servicio con ID ${serviceId} no encontrado.`);
            }
        }
    }, [location.search, services]); // Ejecuta el efecto cuando cambie la URL o los servicios

    const handleDatesSet = (dateInfo) => {
        const newMesComp = moment(dateInfo.view.currentStart).format('MM/YYYY'); // Formato mm/aaaa
        const viewType = dateInfo.view.type; // Tipo de vista actual
        
        // Verifica si ha cambiado el mes y actualiza el estado
        if (mesComp !== newMesComp) {
            console.log(`🔄 Cambio de mes detectado: ${mesComp} → ${newMesComp}`);
            setMesComp(newMesComp); // Actualiza el estado y dispara `useEffect`
        } else {
            console.log(`📅 Estás viendo el mes de: ${newMesComp}`);
        }
    };    

    useEffect(() => {
        if (showEventModal && selectedEvent) {
            console.log("Evento actualmente seleccionado en el modal:", selectedEvent);
        }
    }, [showEventModal, selectedEvent]);    

    useEffect(() => {
        if (socket) {
            socket.on("newEvent", (newEvent) => {
                console.log("Nuevo evento recibido:", newEvent);

                // Formatea el nuevo evento si es necesario
                const formattedEvent = {
                    ...newEvent,
                    start: newEvent.start,
                    end: newEvent.end,
                    color: newEvent.color || '#007bff',
                };

                setEvents((prevEvents) => [...prevEvents, formattedEvent]);
            });
        }

        // Limpieza al desmontar
        return () => {
            if (socket) {
                socket.off("newEvent");
            }
        };
    }, [socket]);

    useEffect(() => {
        const fetchData = async () => {
            await fetchScheduleAndServices();
            await fetchServices(); // Carga todos los servicios
            await fetchUsers();
        };
        fetchData();
    }, [mesComp]);  // 🔥 Se ejecuta cada vez que `mesComp` cambie    

    // Efecto para filtrar eventos al cambiar los usuarios seleccionados
    useEffect(() => {
        filterEvents();
    }, [selectedUsers]);

    useEffect(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.removeAllEvents();
            calendarApi.addEventSource(events); // Agrega los eventos actuales
        }
    }, [events]); // Dependencia en `events`

    const openScheduleModal = async () => {
        try {
            // Obtener los eventos más recientes de la base de datos
            await fetchScheduleAndServices();
            // Abrir el modal después de actualizar los datos
            setScheduleModalOpen(true);
        } catch (error) {
            console.error("Error fetching updated events before opening modal:", error);
        }
    };    
    

    const filterEvents = (updatedAllEvents = allEvents) => {
        const filteredEvents = selectedUsers.length
            ? updatedAllEvents.filter((event) => selectedUsers.includes(event.responsibleId))
            : updatedAllEvents; // Si no hay usuarios seleccionados, muestra todos
        setEvents(filteredEvents);
    };    

    useEffect(() => {
        if (selectedEvent?.title) {
            console.log(`Servicio seleccionado ${selectedEvent.title}`);
            setInspections([]); // Limpia inspecciones anteriores
            fetchInspections(selectedEvent.title); // Carga inspecciones relacionadas con el servicio
        }
    }, [selectedEvent]);    

    useEffect(() => {
        const validateServiceAndSchedule = () => {
            if (!selectedService || !schedules[0]?.date || !schedules[0]?.startTime || !schedules[0]?.endTime) {
                setScheduleConflictMessage('');
                setAlertMessage('');
                return;
            }        
    
            const selectedServiceData = services.find(service => service.id === selectedService);
            if (!selectedServiceData) {
                setScheduleConflictMessage('');
                setAlertMessage('');
                return;
            }
    
            const newStart = moment(`${schedules[0]?.date}T${schedules[0]?.startTime}`);
            const newEnd = moment(`${schedules[0]?.date}T${schedules[0]?.endTime}`);                     
    
            // Validar conflictos de horario
            const conflictingEvents = allEvents.filter(event => {
                const eventStart = moment(event.start);
                const eventEnd = moment(event.end);
    
                const overlaps = newStart.isBefore(eventEnd) && newEnd.isAfter(eventStart);
    
                return (
                    event.responsibleId === selectedServiceData.responsible &&
                    overlaps
                );
            });
    
            if (conflictingEvents.length > 0) {
                setScheduleConflictMessage(
                    `Conflicto detectado: El responsable tiene ${conflictingEvents.length} servicio(s) ya agendado(s) en este horario. Ajusta el horario antes de guardar.`
                );
            } else {
                setScheduleConflictMessage('');
            }
    
            // Validar servicios puntuales y periódicos
            const currentMonth = moment().format('YYYY-MM'); // Mes actual en formato 'YYYY-MM'
            const scheduledThisMonth = allEvents.filter(event => {
                const eventMonth = moment(event.start).format('YYYY-MM');
                return event.title === selectedService && eventMonth === currentMonth;
            }).length;
    
            if (selectedServiceData.category === 'Puntual') {
                // Validación para servicios Puntuales
                if (scheduledThisMonth > 0) {
                    setAlertMessage(
                        `El servicio ${selectedService} es Puntual y ya está agendado ${scheduledThisMonth} veces. ¿Aun así quieres agendar nuevamente?`
                    );
                } else {
                    setAlertMessage('');
                }
            } else if (selectedServiceData.category === 'Periódico') {
                // Validación para servicios Periódicos
                const quantityPerMonth = selectedServiceData.quantity_per_month || 0;
                if (scheduledThisMonth >= quantityPerMonth) {
                    setAlertMessage(
                        `Este servicio debe agendarse ${quantityPerMonth} veces al mes y ya está agendado ${scheduledThisMonth} veces. ¡No deberías agendar más!`
                    );
                } else {
                    setAlertMessage(
                        `Este servicio debe agendarse ${quantityPerMonth} veces al mes y ya está agendado ${scheduledThisMonth} veces.`
                    );
                }
            } else {
                setAlertMessage('');
            }
        };
    
        validateServiceAndSchedule();
    }, [selectedService, schedules, allEvents, services]);
    
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsers(data); // Guardar usuarios en el estado
            setSelectedUsers(data.map((user) => user.id));
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    };

    const handleDeleteEventClick = (event) => {
        console.log("Evento seleccionado para eliminación:", event);
        setSelectedEvent(event); // Establece el evento a eliminar
        setDeleteEventModalOpen(true); // Abre el modal
    };
    
    const handleDeleteEvent = async () => {
        try {
            if (!selectedEvent) {
                alert('No hay ningún evento seleccionado para eliminar');
                return;
            }
    
            // Realiza la petición DELETE al backend
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule/${selectedEvent.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
    
            if (!response.ok) throw new Error('Error eliminando el evento');
    
            console.log('Evento eliminado en el backend:', selectedEvent);
    
            // Actualiza el estado global eliminando el evento
            setAllEvents((prevEvents) =>
                prevEvents.filter((event) => event.id !== selectedEvent.id)
            );
    
            // Refleja el cambio en FullCalendar directamente
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
                const calendarEvent = calendarApi.getEventById(selectedEvent.id);
                if (calendarEvent) {
                    calendarEvent.remove(); // Elimina el evento directamente del calendario
                    console.log('Evento eliminado del calendario:', selectedEvent.id);
                }
            }
    
            // Cierra los modales relacionados
            setDeleteEventModalOpen(false); // Cierra el modal de confirmación
            setShowEventModal(false); // Cierra el modal de detalles del evento
    
            console.log('Evento eliminado correctamente y calendario actualizado.');
        } catch (error) {
            console.error('Error eliminando el evento:', error);
        }
    };     

    const handleEditEventClick = (event) => {
        console.log("Evento recibido para edición:", event);
    
        setEditingEvent(event);
    
        // Extrae los identificadores
        const serviceId = event.service_id || ""; // ID del servicio
        const eventId = event.id || ""; // ID del evento
    
        // Usa la fecha y horas directamente desde el evento seleccionado
        const eventDate = event.date || (event.start ? moment(event.start).format('YYYY-MM-DD') : "");
        const startTime = event.startTime || (event.start ? moment(event.start).format('HH:mm') : "");
        const endTime = event.endTime || (event.end ? moment(event.end).format('HH:mm') : "");
    
        console.log("Fecha procesada para edición:", eventDate);
        console.log("Hora de inicio procesada para edición:", startTime);
        console.log("Hora de fin procesada para edición:", endTime);
    
        // Asegurar que hay valores válidos antes de actualizar el estado
        if (eventDate && startTime && endTime) {
            setSchedules([
                {
                    date: eventDate,
                    startTime: startTime,
                    endTime: endTime,
                },
            ]);
        } else {
            console.warn("Faltan datos para programar la edición del evento.");
        }
    
        setSelectedService(serviceId);
        setEditEventModalOpen(true);
    };    
    
    const handleSaveEditedEvent = async () => {
        try {
            if (!selectedService || !schedules[0]?.date || !schedules[0]?.startTime || !schedules[0]?.endTime) {
                alert('Todos los campos son obligatorios');
                return;
            }
    
            const updatedEvent = {
                id: editingEvent.id,
                service_id: selectedService,
                date: schedules[0]?.date,
                start_time: schedules[0]?.startTime,
                end_time: schedules[0]?.endTime,
            };            
    
            // Actualiza el evento en el backend
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule/${editingEvent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedEvent),
            });
    
            if (!response.ok) throw new Error('Error actualizando el evento');
            const updatedData = await response.json();
    
            console.log('Evento actualizado en el backend:', updatedData);
    
            // Actualiza el evento en FullCalendar directamente
            const calendarApi = calendarRef.current?.getApi();
            const calendarEvent = calendarApi.getEventById(editingEvent.id);
    
            if (calendarEvent) {
                calendarEvent.setStart(moment(`${schedules[0]?.date}T${schedules[0]?.startTime}`).toISOString());
                calendarEvent.setEnd(moment(`${schedules[0]?.date}T${schedules[0]?.endTime}`).toISOString());                
                calendarEvent.setExtendedProp('service_id', selectedService);
            }
    
            // Actualiza el estado global de eventos
            setAllEvents((prevEvents) =>
                prevEvents.map((event) =>
                    event.id === editingEvent.id
                        ? {
                              ...event,
                              start: moment(`${schedules[0]?.date}T${schedules[0]?.startTime}`).toISOString(),
                              end: moment(`${schedules[0]?.date}T${schedules[0]?.endTime}`).toISOString(),                              
                              service_id: selectedService,
                          }
                        : event
                )
            );
    
            setEditEventModalOpen(false); // Cierra el modal
        } catch (error) {
            console.error('Error al guardar el evento editado:', error);
        }
    };
    
    
    const handleEventDrop = async (info) => {
        const { event } = info;
    
        // Extrae los identificadores relevantes
        const eventId = event.id; // ID del evento
        const serviceId = event.title; // ID del servicio (guardado en el título)
    
        if (!serviceId) {
            console.error('El evento no tiene un ID de servicio válido:', event);
            info.revert(); // Revertir el cambio si falta información
            return;
        }
    
        // Crea el objeto para actualizar
        const updatedEvent = {
            service_id: serviceId, // Utiliza el ID del servicio
            date: moment(event.start).format('YYYY-MM-DD'),
            start_time: moment(event.start).format('HH:mm'),
            end_time: event.end ? moment(event.end).format('HH:mm') : null,
        };
    
        console.log('Datos enviados para la actualización:', updatedEvent);
    
        try {
            // Actualiza el evento en el backend usando el ID del evento
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule/${eventId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedEvent),
            });
    
            if (!response.ok) throw new Error('Error actualizando el evento');
            const updatedData = await response.json();
    
            console.log('Evento actualizado en el backend:', updatedData);
    
            // Actualiza el estado local
            setAllEvents((prevEvents) =>
                prevEvents.map((evt) =>
                    evt.id === eventId
                        ? {
                              ...evt,
                              start: moment(event.start).toISOString(),
                              end: event.end ? moment(event.end).toISOString() : null,
                          }
                        : evt
                )
            );
        } catch (error) {
            console.error('Error al mover el evento:', error);
            info.revert(); // Revertir el cambio si ocurre un error
        }
    };    
    
    
    const handleEventResize = async (info) => {
        const { event } = info;
    
        const updatedEvent = {
            id: event.id,
            date: moment(event.start).format('YYYY-MM-DD'),
            start_time: moment(event.start).format('HH:mm'),
            end_time: event.end ? moment(event.end).format('HH:mm') : null,
        };
    
        try {
            // Actualiza el evento en el backend
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule/${event.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedEvent),
            });
    
            if (!response.ok) throw new Error('Error actualizando el evento');
            const updatedData = await response.json();
    
            console.log('Evento actualizado en el backend:', updatedData);
    
            // Actualiza el estado del evento en el frontend
            setAllEvents((prevEvents) =>
                prevEvents.map((evt) =>
                    evt.id === event.id
                        ? {
                              ...evt,
                              start: moment(event.start).toISOString(),
                              end: event.end ? moment(event.end).toISOString() : null,
                          }
                        : evt
                )
            );
        } catch (error) {
            console.error('Error al redimensionar el evento:', error);
            info.revert(); // Revierte el cambio si falla la actualización
        }
    };    

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };
    
    const fetchServices = async () => {
        try {
            console.log('Fetching all services...');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services`);
            if (!response.ok) throw new Error('Failed to fetch services');
            const data = await response.json();
            console.log('Services received:', data);
    
            // Formatear y ordenar los servicios
            const formattedServices = await Promise.all(
                data.map(async (service) => {
                    let clientName = 'Sin empresa';
                    if (service.client_id) {
                        try {
                            const clientResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${service.client_id}`);
                            if (clientResponse.ok) {
                                const clientData = await clientResponse.json();
                                clientName = clientData.name || 'Sin nombre';
                            }
                        } catch (error) {
                            console.error(`Error fetching client for service ID ${service.id}`, error);
                        }
                    }
                    return {
                        ...service,
                        clientName,
                    };
                })
            );
    
            // Ordenar servicios por fecha (descendente) usando el ID
            const sortedServices = formattedServices.sort((a, b) => {
                const dateA = parseInt(a.id.split('-')[1]); // Extraer 'ddmmaa' del ID
                const dateB = parseInt(b.id.split('-')[1]);
                return dateB - dateA; // Orden descendente
            });
    
            setServices(sortedServices);
            console.log('Sorted services:', sortedServices);
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };
    

    // Función para obtener inspecciones asociadas al servicio seleccionado
    const fetchInspections = async (serviceId) => {
        try {
            console.log(`Obteniendo inspecciones para el servicio: ${serviceId}`);
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/inspections?service_id=${serviceId}`);
            const data = await response.json();
    
            console.log('Inspecciones recibidas del backend:', data);
    
            // Filtrar inspecciones en el frontend (en caso de datos incorrectos)
            const filteredInspections = data.filter(
                (inspection) => inspection.service_id === serviceId
            );
    
            console.log('Inspecciones filtradas:', filteredInspections);
    
            const formattedInspections = filteredInspections.map((inspection) => ({
                ...inspection,
                date: moment(inspection.date).format('DD/MM/YYYY'),
                time: inspection.time ? moment(inspection.time, 'HH:mm:ss').format('HH:mm') : 'No disponible',
                exit_time: inspection.exit_time ? moment(inspection.exit_time, 'HH:mm:ss').format('HH:mm') : '--',
                observations: inspection.observations || 'Sin observaciones',
            }));
    
            setInspections(formattedInspections);
            console.log('Inspecciones formateadas:', formattedInspections);
        } catch (error) {
            console.error('Error fetching inspections:', error);
        }
    };
    

    // Función para guardar inspecciones nuevas
    const handleSaveInspection = async () => {
        try {
            const inspectionData = {
                inspection_type: newInspection.inspection_type,
                inspection_sub_type: newInspection.inspection_type.includes('Desratización')
                    ? newInspection.inspection_sub_type
                    : null,
                service_id: selectedEvent.title,
                date: moment().format('YYYY-MM-DD'),
                time: moment().format('HH:mm:ss'),
            };
            try {
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/inspections`, inspectionData);
        
                if (response.data.success) {
                alert("Inspección guardada con éxito");
                fetchInspections(selectedEvent.title); // Actualiza la tabla
                setShowAddInspectionModal(false); // Cierra el modal
        
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
        } catch (error) {
            console.error('Error saving inspection:', error);
        }
    };    

    // Función para abrir el modal de inspecciones
    const handleShowAddInspectionModal = () => {
        setShowAddInspectionModal(true);
    };

    // Función para cerrar el modal de inspecciones
    const handleCloseAddInspectionModal = () => {
        setShowAddInspectionModal(false);
        setNewInspection({ inspection_type: [], inspection_sub_type: '' });
    };

    const fetchScheduleAndServices = async () => {
        try {
            console.log(`Fetching schedule and services for: ${mesComp}`);
    
            const scheduleResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule?month=${mesComp}`);
            if (!scheduleResponse.ok) throw new Error('Failed to fetch schedule');
            const scheduleData = await scheduleResponse.json();
    
            console.log('Schedule data received:', scheduleData);
    
            const formattedEvents = await Promise.all(
                scheduleData.map(async (schedule) => {
                    try {
                        // 🟢 Buscar información del servicio asociado al evento
                        const serviceResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/services/${schedule.service_id}`);
                        if (!serviceResponse.ok) throw new Error(`Failed to fetch service for ID: ${schedule.service_id}`);
                        const serviceData = await serviceResponse.json();
    
                        // 🟢 Obtener datos del cliente
                        let clientName = 'Sin empresa';
                        let clientData = null;
                        if (serviceData.client_id) {
                            try {
                                const clientResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${serviceData.client_id}`);
                                if (clientResponse.ok) {
                                    clientData = await clientResponse.json();
                                    clientName = clientData.name || 'Sin nombre';
                                }
                            } catch (error) {
                                console.error(`Error fetching client for ID: ${serviceData.client_id}`, error);
                            }
                        }
    
                        // 🟢 Obtener datos del responsable
                        let responsibleName = 'Sin responsable';
                        let responsibleData = null;
                        if (serviceData.responsible) {
                            try {
                                const responsibleResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${serviceData.responsible}`);
                                if (responsibleResponse.ok) {
                                    responsibleData = await responsibleResponse.json();
                                    responsibleName = `${responsibleData.name || 'Sin nombre'} ${responsibleData.lastname || ''}`.trim();
                                }
                            } catch (error) {
                                console.error(`Error fetching responsible for ID: ${serviceData.responsible}`, error);
                            }
                        }
    
                        // 🟢 Formatear fechas y datos del evento
                        const start = moment(`${schedule.date.split('T')[0]}T${schedule.start_time}`).toISOString();
                        const end = schedule.end_time
                            ? moment(`${schedule.date.split('T')[0]}T${schedule.end_time}`).toISOString()
                            : null;
    
                        const formattedEvent = {
                            id: schedule.id,
                            service_id: schedule.service_id,
                            title: `${serviceData.id}`,
                            serviceType: serviceData.service_type || 'Sin tipo',
                            description: serviceData.description || 'Sin descripción',
                            category: serviceData.category || 'Sin categoría',
                            quantyPerMonth: serviceData.quantity_per_month || null,
                            clientName,
                            clientId: serviceData.client_id,
                            responsibleId: serviceData.responsible,
                            responsibleName,
                            address: clientData?.address || 'Sin dirección',
                            phone: clientData?.phone || 'Sin teléfono',
                            color: responsibleData?.color || '#fdd835',
                            backgroundColor: responsibleData?.color,
                            pestToControl: serviceData.pest_to_control,
                            interventionAreas: serviceData.intervention_areas,
                            value: serviceData.value,
                            companion: serviceData.companion,
                            start,
                            end,
                            allDay: false,
                        };
    
                        return formattedEvent;
                    } catch (error) {
                        console.error(`Error processing schedule with service_id: ${schedule.service_id}`, error);
                        return null;
                    }
                })
            );
    
            // 🔥 Filtrar eventos nulos
            const validEvents = formattedEvents.filter(event => event !== null);
    
            // 🚀 Evitar duplicados antes de actualizar el estado
            const uniqueEvents = validEvents.filter((event, index, self) =>
                index === self.findIndex((e) =>
                    e.service_id === event.service_id &&
                    e.start === event.start &&
                    e.end === event.end
                )
            );
    
            setAllEvents(uniqueEvents);
            setEvents(uniqueEvents);
    
            console.log("Eventos final procesados sin duplicados:", uniqueEvents);
        } catch (error) {
            console.error('Error loading schedule and services:', error);
        }
    };    

    const groupByRole = (users) => {
        return users.reduce((groups, user) => {
            const role = user.rol || 'Sin Rol';
            if (!groups[role]) groups[role] = [];
            groups[role].push(user);
            return groups;
        }, {});
    };    

    const handleUserSelection = (userId) => {
        setSelectedUsers((prevSelected) => {
            if (prevSelected.includes(userId)) {
                return prevSelected.filter((id) => id !== userId); // Deseleccionar
            } else {
                return [...prevSelected, userId]; // Seleccionar
            }
        });
    };

    const handleServiceSelect = (serviceId) => {
        setSelectedService(serviceId);
    
        console.log('Service ID seleccionado:', serviceId);
        console.log('Eventos disponibles:', allEvents);
    
        if (serviceId) {
            const selectedServiceData = services.find(service => service.id === serviceId);
    
            if (selectedServiceData) {
                const currentMonth = moment().format('YYYY-MM'); // Mes actual en formato 'YYYY-MM'
                const scheduledThisMonth = allEvents.filter(event => {
                    const eventMonth = moment(event.start).format('YYYY-MM');
                    return event.title === serviceId && eventMonth === currentMonth;
                }).length;
    
                if (selectedServiceData.category === 'Puntual') {
                    // Para servicios Puntuales
                    if (scheduledThisMonth > 0) {
                        setAlertMessage(
                            `El servicio ${serviceId} es Puntual y ya está agendado ${scheduledThisMonth} veces. ¿Aun así quieres agendar nuevamente?`
                        );
                    } else {
                        setAlertMessage('');
                    }
                } else if (selectedServiceData.category === 'Periódico') {
                    // Para servicios Periódicos
                    const quantityPerMonth = selectedServiceData.quantity_per_month || 0;
    
                    if (scheduledThisMonth >= quantityPerMonth) {
                        setAlertMessage(
                            `Este servicio debe agendarse ${quantityPerMonth} veces al mes y ya está agendado ${scheduledThisMonth} veces. ¡No deberías agendar más!`
                        );
                    } else {
                        setAlertMessage(
                            `Este servicio debe agendarse ${quantityPerMonth} veces al mes y ya está agendado ${scheduledThisMonth} veces.`
                        );
                    }
                }
            }
        }
    };       
    
    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]); // Deseleccionar todos
        } else {
            setSelectedUsers(users.map((user) => user.id)); // Seleccionar todos
        }
    };
    
    const renderEventContent = (eventInfo) => {
        const { serviceType, clientName } = eventInfo.event.extendedProps;
        const { start, end } = eventInfo.event;
        const serviceId = eventInfo.event.title;
        const eventId = eventInfo.event.id;

        const startTime = moment(start).format('h:mm A');
        const endTime = moment(end).format('h:mm A');
    
        return (
            <OverlayTrigger
                placement="top"
                overlay={
                    <Tooltip>
                        <div>ID Evento: {eventId}</div>
                        <div>ID Servicio: {serviceId}</div>
                        <div>{serviceType.replace(/[\{\}"]/g, '').replace(/,/g, ', ')}</div>
                        <div>{clientName}</div>
                    </Tooltip>
                }
            >
                <div className="event-container">
                    <div className="event-id">{eventInfo.event.title}</div>
                    <div className="event-time">{`${startTime} – ${endTime}`}</div>
                </div>
            </OverlayTrigger>
        );
    };
    

    const changeView = (view) => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(view);
        setCurrentView(view);
    };

    const handleTodayClick = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.today();
    };
    

    const handleEventClick = (clickInfo) => {
        const { extendedProps, title, start, end } = clickInfo.event;
        const currentMonth = moment().format('YYYY-MM'); // Mes actual en formato 'YYYY-MM'

        // Extraer y formatear fecha, hora de inicio y fin
        const eventDate = moment(start).format('YYYY-MM-DD');
        const startTime = moment(start).format('HH:mm');
        const endTime = moment(end).format('HH:mm');
    
        // Contar eventos en el mes actual si es periódico
        let scheduledThisMonth = 0;
        if (extendedProps.category === 'Periódico') {
            scheduledThisMonth = allEvents.filter(event => {
                const eventMonth = moment(event.start).format('YYYY-MM');
                return event.title === clickInfo.event.title && eventMonth === currentMonth;
            }).length;
        }
    
        const eventData = {
            id: clickInfo.event.id,
            title: title,
            service_id: title,
            serviceType: extendedProps.serviceType,
            description: extendedProps.description || 'Sin descripción',
            responsibleName: extendedProps.responsibleName || 'Sin responsable',
            clientName: extendedProps.clientName || 'Sin empresa',
            clientId: extendedProps.clientId,
            address: extendedProps.address || 'Sin dirección',
            phone: extendedProps.phone || 'Sin teléfono',
            category: extendedProps.category || 'Sin categoría', // Nueva propiedad
            quantyPerMonth: extendedProps.quantyPerMonth || null, // Nueva propiedad
            pestToControl: extendedProps.pestToControl,
            interventionAreas: extendedProps.interventionAreas,
            value: extendedProps.value,
            companion: extendedProps.companion,
            scheduledThisMonth,
            startTime,
            endTime,
            date: eventDate,
        };
        setSelectedEvent(eventData);
        setShowEventModal(true);
    };        

    const handleScheduleModalClose = () => {
        setScheduleModalOpen(false);
        setSelectedService('');
        setSchedules([{
            date: moment().format('YYYY-MM-DD'),
            startTime: moment().format('HH:mm'),
            endTime: moment().add(1, 'hour').format('HH:mm'),
        }]);        
        setAlertMessage('');
    };

    const handleDateSelect = (selectInfo) => {
        const { start, end } = selectInfo;
        setSchedules([
            {
                date: moment(start).format('YYYY-MM-DD'),
                startTime: moment(start).format('HH:mm'),
                endTime: moment(end).format('HH:mm'),
            },
        ]);
        openScheduleModal();
    };    
    
    const handleShowClientModal = (clientId) => {
        setSelectedClientId(clientId);
        setShowClientModal(true);
      };
      
      const handleCloseClientModal = () => {
        setShowClientModal(false);
        setSelectedClientId(null);
      };  

      const handleEditServiceClick = (serviceId) => {
        navigate('/services', { state: { serviceId } });
    };

    const handleScheduleService = async () => {
        try {
            if (!selectedService || schedules.length === 0) {
                alert('Debes seleccionar un servicio y al menos un horario.');
                return;
            }
    
            if (showRepetitiveOptions && (!repetitiveStartDate || !repetitiveEndDate || !repetitionOption)) {
                alert('Por favor completa todas las opciones de agendamiento repetitivo.');
                return;
            }
            
            // Normalizar fechas para evitar problemas de comparación
            const start = moment(repetitiveStartDate).startOf('day');
            const end = moment(repetitiveEndDate).endOf('day');            
    
            let eventsToSchedule = [];
    
            // Procesar cada conjunto de fecha y hora
            schedules.forEach((schedule) => {
                if (showRepetitiveOptions) {
                    // Generar eventos repetitivos dentro del rango dado
                    let start = moment(repetitiveStartDate);
                    let end = moment(repetitiveEndDate);
            
                    while (start.isSameOrBefore(end)) {
                        schedules.forEach((manualSchedule) => { // 🔥 Recorre todos los días seleccionados manualmente
                            switch (repetitionOption) {
                                case 'allWeekdays': // Todos los días hábiles (lunes a sábado)
                                    if (start.day() !== 0) { // Excluye solo el domingo (0)
                                        eventsToSchedule.push({
                                            date: start.clone().format('YYYY-MM-DD'),
                                            start_time: manualSchedule.startTime,
                                            end_time: manualSchedule.endTime,
                                        });
                                    }
                                    break;                    
                                case 'specificDay': // Solo los días específicos seleccionados
                                    if (start.format('dddd') === moment(manualSchedule.date).format('dddd')) {
                                        eventsToSchedule.push({
                                            date: start.clone().format('YYYY-MM-DD'),
                                            start_time: manualSchedule.startTime,
                                            end_time: manualSchedule.endTime,
                                        });
                                    }
                                    break;
                                    case 'firstWeekday': // Primer día específico del mes
                                    let firstScheduled = false; // Asegurar que se agrega la fecha programada manualmente
                                    
                                    while (start.isSameOrBefore(end)) {
                                        let firstDayOfMonth = start.clone().startOf('month'); // Comienza el primer día del mes
                                    
                                        // Busca el primer lunes/martes/miércoles/etc. del mes
                                        while (firstDayOfMonth.format('dddd') !== moment(manualSchedule.date).format('dddd')) {
                                            firstDayOfMonth.add(1, 'day'); // Avanza un día hasta encontrarlo
                                        }
                                    
                                        // 🟢 **Corrección: Guardar la inspección programada en el mes actual**
                                        if (firstDayOfMonth.isSame(moment(manualSchedule.date), 'month') && !firstScheduled) {
                                            eventsToSchedule.push({
                                                date: manualSchedule.date, // Fecha original seleccionada
                                                start_time: manualSchedule.startTime,
                                                end_time: manualSchedule.endTime,
                                            });
                                            firstScheduled = true; // Marcar que la inspección del mes actual ya se guardó
                                        }
                                    
                                        // 🔥 Solo programar en meses futuros
                                        if (!firstDayOfMonth.isSame(moment(manualSchedule.date), 'month')) {
                                            eventsToSchedule.push({
                                                date: firstDayOfMonth.format('YYYY-MM-DD'),
                                                start_time: manualSchedule.startTime,
                                                end_time: manualSchedule.endTime,
                                            });
                                        }
                                    
                                        start.add(1, 'month'); // Avanza al siguiente mes
                                    }
                                    break;                                                                 
                                
                                    case 'biweekly': // Día específico cada 2 semanas
                                    let biweeklyStart = moment(repetitiveStartDate);
                                    let biweeklyEnd = moment(repetitiveEndDate);
                                
                                    console.log(`📅 Inicio de programación: ${biweeklyStart.format('YYYY-MM-DD')}`);
                                    console.log(`📅 Fin de programación: ${biweeklyEnd.format('YYYY-MM-DD')}`);
                                
                                    // 🔹 Asegurar que la fecha inicial esté alineada con la repetición
                                    while (!biweeklyStart.isSame(moment(repetitiveStartDate), 'day') &&
                                           biweeklyStart.isBefore(moment(repetitiveStartDate))) {
                                        biweeklyStart.add(2, 'weeks');
                                    }
                                
                                    while (biweeklyStart.isSameOrBefore(biweeklyEnd)) {
                                        console.log(`\n🔄 Programando eventos para el día: ${biweeklyStart.format('YYYY-MM-DD')}`);
                                
                                        schedules.forEach((manualSchedule, index) => {
                                            let newEvent = {
                                                date: biweeklyStart.format('YYYY-MM-DD'),
                                                start_time: manualSchedule.startTime,
                                                end_time: manualSchedule.endTime,
                                            };
                                
                                            eventsToSchedule.push(newEvent);
                                
                                            console.log(`✅ Evento ${index + 1} agregado -> Fecha: ${newEvent.date}, Horario: ${newEvent.start_time} - ${newEvent.end_time}`);
                                        });
                                
                                        biweeklyStart.add(2, 'weeks'); // Avanza exactamente 2 semanas
                                        console.log(`📌 Avanzando 2 semanas... Nueva fecha: ${biweeklyStart.format('YYYY-MM-DD')}`);
                                    }
                                
                                    console.log(`✅ Programación completada. Total de eventos: ${eventsToSchedule.length}`);
                                    break;
                                                                                   
                                
                                    case 'lastWeekday': // Último día específico del mes
                                    while (start.isSameOrBefore(end)) {
                                        let lastDayOfMonth = start.clone().endOf('month'); // Último día del mes
                                
                                        // Retrocede hasta encontrar el último lunes/martes/miércoles/etc. del mes
                                        while (lastDayOfMonth.format('dddd') !== moment(manualSchedule.date).format('dddd')) {
                                            lastDayOfMonth.subtract(1, 'day'); // Retrocede un día hasta encontrarlo
                                        }
                                
                                        // Agregar evento sin evitar duplicados
                                        eventsToSchedule.push({
                                            date: lastDayOfMonth.format('YYYY-MM-DD'),
                                            start_time: manualSchedule.startTime,
                                            end_time: manualSchedule.endTime,
                                        });
                                
                                        start.add(1, 'month'); // Avanza al siguiente mes
                                    }
                                    break;                                                            
                            }
                        });
                        start.add(1, 'day'); // Avanza al siguiente día
                    }
                } else {
                    // Agregar evento único
                    eventsToSchedule.push({
                        date: schedule.date,
                        start_time: schedule.startTime,
                        end_time: schedule.endTime,
                    });
                }
            });            
    
            // Preparar datos para el backend
            const newEvents = eventsToSchedule.map((event) => ({
                service_id: selectedService,
                date: event.date,
                start_time: event.start_time,
                end_time: event.end_time,
            }));
    
            console.log('Eventos a agendar:', newEvents);
    
            // Enviar todos los eventos al backend
// Filtrar eventos duplicados
const uniqueEvents = newEvents.filter(
    (event, index, self) =>
        index === self.findIndex((e) => e.date === event.date && e.start_time === event.start_time)
);

console.log('Eventos finales a programar:', uniqueEvents);

// Enviar eventos al backend
for (const event of uniqueEvents) {
    try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event),
        });
    } catch (error) {
        console.error(`Error programando el evento en ${event.date}:`, error);
    }
}
    
            alert('Eventos agendados con éxito.');
            handleScheduleModalClose();
            window.location.reload();
        } catch (error) {
            console.error('Error scheduling service:', error);
        }
    };    
    
    return (
        <div className="d-flex">
            {/* Contenedor principal */}
            <div className="calendar-container flex-grow-1">
                <div className="card p-4 shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center">
                    <div>
    <Button variant="light" className="me-2" onClick={() => calendarRef.current.getApi().prev()}>
        <ChevronLeft />
    </Button>
    <Button variant="light" className="me-2" onClick={() => calendarRef.current.getApi().next()}>
        <ChevronRight />
    </Button>
    <Button variant="outline-dark" className="me-2" onClick={handleTodayClick}>
        Hoy
    </Button>
    {/* Mostrar el mes y año actual */}
    <span className="fw-bold ms-3" style={{ fontSize: "1.2rem" }}>
        {mesComp}
    </span>
</div>

                        <div>
                            <Button variant={currentView === 'dayGridMonth' ? 'dark' : 'success'} className="me-2" onClick={() => changeView('dayGridMonth')}>
                                Mes
                            </Button>
                            <Button variant={currentView === 'timeGridWeek' ? 'dark' : 'success'} className="me-2" onClick={() => changeView('timeGridWeek')}>
                                Semana
                            </Button>
                            <Button variant={currentView === 'timeGridDay' ? 'dark' : 'success'} onClick={() => changeView('timeGridDay')}>
                                Día
                            </Button>
                            <Button variant="success" className="ms-2" onClick={openScheduleModal}>
                                <Plus className="me-1" /> Agendar Servicio
                            </Button>
                        </div>
                    </div>
                    <div className="custom-calendar">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={currentView}
                        headerToolbar={false}
                        locale={esLocale}
                        events={events}
                        editable={true}
                        selectable={true}
                        select={handleDateSelect}
                        eventDrop={handleEventDrop}
                        eventResize={handleEventResize}
                        timeZone="local"
                        height="70vh"
                        nowIndicator={true}
                        slotLabelFormat={{ hour: 'numeric', hour12: true, meridiem: 'short' }}
                        eventContent={renderEventContent}
                        eventClick={handleEventClick}
                        dayHeaderContent={({ date }) => {
                            const utcDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
                            return (
                                <div className="day-header">
                                    <div className="day-name">{utcDate.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}</div>
                                    <div className="day-number font-bold">{utcDate.getDate()}</div>
                                </div>
                            );
                        }}                        
                        datesSet={handleDatesSet} // 👈 Ejecuta la función cuando cambian las fechas
                    />
                    </div>
                </div>
            </div>
            {/* Columna fija de usuarios */}
            <div
                className="user-column bg-light shadow-sm px-3"
                style={{
                    width: '240px',
                    height: '87vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                }}
            >
                <div
                    className={`user-item-all d-flex flex-row align-items-center p-2 mb-3 ${
                    selectedUsers.length === users.length ? 'selected' : ''
                    }`}
                    onClick={toggleSelectAll}
                    style={{
                    cursor: 'pointer',
                    borderRadius: '5px',
                    }}
                    >
                    <div className="flex-grow-1 text-center text-dark fw-bold">Todos</div>
                    </div>
                        {Object.entries(groupByRole(users)).map(([role, roleUsers]) => (
                            <div key={role} className="mb-4">
                                <h6 className="text-secondary text-uppercase">{role}</h6>
                                {roleUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`user-item d-flex flex-column align-items-center p-3 ${
                                            selectedUsers.includes(user.id) ? 'selected' : ''
                                        }`}
                                        onClick={() => handleUserSelection(user.id)}
                                        style={{
                                            cursor: 'pointer',
                                            borderRadius: '10px',
                                            transition: 'background-color 0.2s ease',
                                            textAlign: 'center',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Cuadro de color */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '5px',
                                                right: '5px',
                                                width: '15px',
                                                height: '15px',
                                                borderRadius: '3px',
                                                backgroundColor: user.color,
                                            }}
                                        ></div>

                                        <img
                                            src={`${user.image}`}
                                            alt={user.name}
                                            className="rounded-circle"
                                            style={{
                                                width: '90px',
                                                height: '90px',
                                                objectFit: 'cover',
                                                marginBottom: '5px',
                                            }}
                                        />
                                        <div>
                                            <strong style={{ fontSize: '14px', color: '#333' }}>{user.name}</strong>
                                            <br />
                                            <small style={{ fontSize: '12px', color: '#666' }}>{user.rol}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
            </div>


            <Modal show={scheduleModalOpen} onHide={handleScheduleModalClose} backdrop="static" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Agendar Servicio</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {/* Campo de selección de servicio */}
                        <Form.Group controlId="formServiceSelect" className="mb-3">
                            <Form.Label>Servicio</Form.Label>
                            <Form.Select
                                value={selectedService}
                                onChange={(e) => handleServiceSelect(e.target.value)}
                            >
                                <option value="">Selecciona un servicio</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {`${service.id} - ${service.service_type.replace(/[{}"]/g, '').split(',').join(', ') || 'Sin tipo'} - ${service.clientName || 'Sin empresa'}`}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        {scheduleConflictMessage && (
                            <div className="alert alert-danger mt-3">
                                {scheduleConflictMessage}
                            </div>
                        )}

                        {alertMessage && (
                            <div className="alert alert-warning mt-3">
                                {alertMessage}
                            </div>
                        )}
                        {/* Campo de fecha */}
                        {schedules.map((schedule, index) => (
                            <div key={index} className="mb-3 p-3 border rounded">
                                <h6 className="text-secondary">Horario {index + 1}</h6>

                                <Form.Group controlId={`formScheduleDate-${index}`} className="mb-2">
                                    <Form.Label>Fecha</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={schedule.date}
                                        onChange={(e) => {
                                            const newSchedules = [...schedules];
                                            newSchedules[index].date = e.target.value;
                                            setSchedules(newSchedules);
                                        }}
                                    />
                                </Form.Group>

                                <Form.Group controlId={`formScheduleStartTime-${index}`} className="mb-2">
                                    <Form.Label>Hora de Inicio</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={schedule.startTime}
                                        onChange={(e) => {
                                            const newSchedules = [...schedules];
                                            newSchedules[index].startTime = e.target.value;
                                            setSchedules(newSchedules);
                                        }}
                                    />
                                </Form.Group>

                                <Form.Group controlId={`formScheduleEndTime-${index}`} className="mb-2">
                                    <Form.Label>Hora de Fin</Form.Label>
                                    <Form.Control
                                        type="time"
                                        value={schedule.endTime}
                                        onChange={(e) => {
                                            const newSchedules = [...schedules];
                                            newSchedules[index].endTime = e.target.value;
                                            setSchedules(newSchedules);
                                        }}
                                    />
                                </Form.Group>
                            </div>
                        ))}
                    </Form>

                    {services.find(service => service.id === selectedService)?.category === 'Periódico' && (
                    <>
                        <Button
                            variant="outline-success"
                            className="mt-3 w-100"
                            onClick={() => setShowRepetitiveOptions(!showRepetitiveOptions)}
                        >
                            {showRepetitiveOptions ? "Ocultar Opciones Repetitivas" : "Mostrar Opciones Repetitivas"}
                        </Button>

                        {showRepetitiveOptions && (
                            <div className="mt-3">
                                {/* Fecha de inicio */}
                                <Form.Group controlId="formRepetitiveStartDate" className="mb-3">
                                    <Form.Label>Fecha de Inicio</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={repetitiveStartDate}
                                        onChange={(e) => setRepetitiveStartDate(e.target.value)}
                                    />
                                </Form.Group>

                                {/* Fecha de finalización */}
                                <Form.Group controlId="formRepetitiveEndDate" className="mb-3">
                                    <Form.Label>Fecha de Finalización</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={repetitiveEndDate}
                                        onChange={(e) => setRepetitiveEndDate(e.target.value)}
                                    />
                                </Form.Group>

                                {/* Opciones de repetición */}
                                <Form.Group controlId="formRepetitionOption" className="mb-3">
                                    <Form.Label>Repetir</Form.Label>
                                    <Form.Select
    value={repetitionOption}
    onChange={(e) => setRepetitionOption(e.target.value)}
>
    <option value="">Selecciona una opción</option>
    <option value="allWeekdays">Todos los días hábiles</option>
    <option value="specificDay">
    Todos los {schedules.map(s => moment(s.date).format('dddd')).join(', ')}
    </option>
    <option value="firstWeekday">
        Primer {moment(schedules[0]?.date).format('dddd')} del mes
    </option>
    <option value="biweekly">
        {moment(schedules[0]?.date).format('dddd')} cada 2 semanas
    </option>
    <option value="lastWeekday">
        Último {moment(schedules[0]?.date).format('dddd')} del mes
    </option>
</Form.Select>
                                </Form.Group>
                            </div>
                        )}
                    </>
                )}
                </Modal.Body>
                <Modal.Footer>
                <Button
    variant="outline-primary"
    onClick={() => {
        setSchedules([...schedules, {
            date: moment().format('YYYY-MM-DD'),
            startTime: moment().format('HH:mm'),
            endTime: moment().add(1, 'hour').format('HH:mm'),
        }]);
    }}
>
    Seguir Agendando
</Button>
                <Button variant="secondary" onClick={handleScheduleModalClose}>Cancelar</Button>
                <Button variant="success" onClick={handleScheduleService} disabled={!!scheduleConflictMessage}>Guardar</Button>
            </Modal.Footer>
            </Modal>

            <Modal show={showEventModal} onHide={() => setShowEventModal(false)} centered size="lg">
                <Modal.Header closeButton>
                <Modal.Title className="fw-bold d-flex">
                    <span>
                        <GearFill className="me-2" /> Detalles del Servicio
                    </span>
                </Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-light p-4">
                    
                    {selectedEvent && (
                        <div className="d-flex flex-column gap-4">
                            {/* Información General */}
                            <div className="bg-white shadow-sm rounded p-3">
                                <div className='m-0 p-0 d-flex'>
                                   <h5 className="text-secondary mb-3">
                                    <InfoCircle className="me-2" /> Información General
                                    </h5>
                                    <div className='ms-auto text-end'>
                                    <PencilSquare
                                        className="ms-2"
                                        onClick={() => {
                                            console.log("Evento seleccionado para editar:", selectedEvent);
                                            setShowEventModal(false)
                                            handleEditEventClick(selectedEvent);
                                        }}
                                        style={{ fontSize: '1.2rem', color: '#6c757d', cursor: 'pointer', marginLeft: 'auto' }}
                                    />
                                    <Trash
                                        className="ms-2"
                                        onClick={() => {
                                            console.log('Evento seleccionado para eliminar:', selectedEvent);
                                            setShowEventModal(false); // Cierra el modal de detalles
                                            handleDeleteEventClick(selectedEvent); // Abre el modal de confirmación
                                        }}
                                        style={{ fontSize: '1.2rem', color: '#dc3545', cursor: 'pointer' }}
                                    />
                                    </div> 
                                </div>
                                
                                <div className="d-flex flex-column gap-2">
                                    <div className='p-0 m-0 d-flex'>
                                        <p><strong>ID del Servicio:</strong> {selectedEvent.title}</p>
                                        <EyeFill
                                            className='ms-2'
                                            style={{cursor: "pointer"}}
                                            size={22}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Evita otros eventos
                                                handleEditServiceClick(selectedEvent.title);
                                            }}
                                        />
                                    </div>
                                    <p><strong>Tipo de Servicio:</strong> {selectedEvent.serviceType.replace(/[\{\}"]/g, '').split(',').join(', ')}</p>
                                    <div className='p-0 m-0 d-flex'>
                                        <p className="my-1"><strong>Empresa:</strong> {selectedEvent.clientName || "Cliente Desconocido"}</p>
                                        {selectedEvent.clientId && (
                                        <Building
                                            className='ms-2 mt-1'
                                            style={{cursor: "pointer"}}
                                            size={22}
                                            onClick={(e) => {
                                            e.stopPropagation(); // Evita que se activen otros eventos del Card
                                            handleShowClientModal(selectedEvent.clientId);
                                            }}
                                        />
                                        )}
                                    </div>
                                    <p><strong>Responsable:</strong> {selectedEvent.responsibleName}</p>
                                    {selectedEvent.companion && selectedEvent.companion !== "{}" && selectedEvent.companion !== '{""}' && (
                                        <p>
                                            <strong>Acompañante(s):</strong>{' '}
                                            {(() => {
                                                // Convierte la cadena de IDs en un array
                                                const companionIds = selectedEvent.companion
                                                    .replace(/[\{\}"]/g, '') // Limpia los caracteres `{}`, `"`
                                                    .split(',')
                                                    .map((id) => id.trim()); // Divide y recorta espacios

                                                // Mapea los IDs a nombres usando el estado `users`
                                                const companionNames = companionIds.map((id) => {
                                                    const user = users.find((user) => user.id === id); // Encuentra el usuario por ID
                                                    return user ? `${user.name} ${user.lastname || ''}`.trim() : `Desconocido (${id})`;
                                                });

                                                // Devuelve la lista de nombres como texto
                                                return companionNames.join(', ');
                                            })()}
                                        </p>
                                    )}
                                    <p><strong>Categoría:</strong> {selectedEvent.category}</p>
                                    {selectedEvent.category === "Periódico" && (
                                        <p><strong>Cantidad al Mes:</strong> {selectedEvent.quantyPerMonth}</p>
                                    )}
                                    <p><strong>Valor:</strong> ${selectedEvent.value}</p> {/* Agrega el valor si está disponible */}
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="bg-white shadow-sm rounded p-3">
                                <h5 className="text-secondary mb-3">
                                    <FileText className="me-2" /> Descripción
                                </h5>
                                <p className="text-muted">{selectedEvent.description || "No especificada"}</p>
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
                                        const pestMatches = selectedEvent.pestToControl.match(/"([^"]+)"/g);
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
                                        const areasMatches = selectedEvent.interventionAreas.match(/"([^"]+)"/g);
                                        return areasMatches
                                            ? areasMatches.map((item) => item.replace(/"/g, "")).join(", ")
                                            : "No especificado";
                                        })()}
                                    </p>
                                </div>
                            </div>

                            {/* Tabla de Inspecciones */}
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
                    <Button variant="dark" onClick={() => setShowEventModal(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showAddInspectionModal} onHide={handleCloseAddInspectionModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Añadir Inspección</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formInspectionType">
                            <Form.Label>Tipo de Inspección</Form.Label>
                            <div>
                                {selectedEvent?.serviceType
                                    ?.replace(/[\{\}"]/g, '')
                                    .split(',')
                                    .map((type, index) => (
                                        <Form.Check
                                            key={index}
                                            type="checkbox"
                                            label={type.trim()}
                                            value={type.trim()}
                                            checked={newInspection.inspection_type?.includes(type.trim())}
                                            onChange={(e) => {
                                                const { value, checked } = e.target;
                                                setNewInspection((prev) => ({
                                                    ...prev,
                                                    inspection_type: checked
                                                        ? [...(prev.inspection_type || []), value]
                                                        : prev.inspection_type.filter((t) => t !== value),
                                                }));
                                            }}
                                        />
                                    ))}
                            </div>
                        </Form.Group>
                        {Array.isArray(newInspection.inspection_type) &&
                            newInspection.inspection_type.includes('Desratización') && (
                                <Form.Group controlId="formInspectionSubType" className="mt-3">
                                    <Form.Label>Sub tipo</Form.Label>
                                    <Form.Control
                                        as="select"
                                        value={newInspection.inspection_sub_type}
                                        onChange={(e) =>
                                            setNewInspection((prev) => ({
                                                ...prev,
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
                    <Button variant="secondary" onClick={handleCloseAddInspectionModal}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={handleSaveInspection}>
                        Guardar Inspección
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={editEventModalOpen} onHide={() => setEditEventModalOpen(false)} backdrop="static" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Evento</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        {/* Selección de servicio */}
                        <Form.Group controlId="formEditServiceSelect" className="mb-3">
                            <Form.Label>Servicio</Form.Label>
                            <Form.Select
                                value={selectedService}
                                onChange={(e) => handleServiceSelect(e.target.value)}
                            >
                                <option value="">Selecciona un servicio</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {`${service.id} - ${service.service_type.replace(/[{}"]/g, '').split(',').join(', ') || 'Sin tipo'} - ${service.clientName || 'Sin empresa'}`}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>

                        {/* Fecha */}
                        <Form.Group controlId="formEditScheduleDate" className="mb-3">
                            <Form.Label>Fecha</Form.Label>
                            <Form.Control
                            type="date"
                            value={schedules[0].date} // ✅ Accedemos al primer conjunto de horarios
                            onChange={(e) => {
                                const newSchedules = [...schedules];
                                newSchedules[0].date = e.target.value;
                                setSchedules(newSchedules);
                            }}
                        />
                        </Form.Group>

                        {/* Hora de inicio */}
                        <Form.Group controlId="formEditScheduleStartTime" className="mb-3">
                            <Form.Label>Hora de Inicio</Form.Label>
                            <Form.Control
                            type="time"
                            value={schedules[0].startTime} // ✅ Accedemos al primer conjunto de horarios
                            onChange={(e) => {
                                const newSchedules = [...schedules];
                                newSchedules[0].startTime = e.target.value;
                                setSchedules(newSchedules);
                            }}
                        />
                        </Form.Group>

                        {/* Hora de fin */}
                        <Form.Group controlId="formEditScheduleEndTime" className="mb-3">
                            <Form.Label>Hora de Fin</Form.Label>
                            <Form.Control
                            type="time"
                            value={schedules[0].endTime} // ✅ Accedemos al primer conjunto de horarios
                            onChange={(e) => {
                                const newSchedules = [...schedules];
                                newSchedules[0].endTime = e.target.value;
                                setSchedules(newSchedules);
                            }}
                        />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setEditEventModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={handleSaveEditedEvent}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={deleteEventModalOpen} onHide={() => setDeleteEventModalOpen(false)} backdrop="static" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Eliminar Evento</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>¿Estás seguro de que deseas eliminar este evento?</p>
                    <p><strong>ID:</strong> {selectedEvent?.id}</p>
                    <p><strong>Servicio:</strong> {selectedEvent?.serviceType}</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteEventModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleDeleteEvent}>
                        Eliminar
                    </Button>
                </Modal.Footer>
            </Modal>
        
            <ClientInfoModal
                clientId={selectedClientId}
                show={showClientModal}
                onClose={handleCloseClientModal}
            />

        </div>
    );
};

export default InspectionCalendar;
