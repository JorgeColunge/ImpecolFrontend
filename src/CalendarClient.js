import React, { useState, useEffect, useRef } from 'react';
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
import { useLocation } from 'react-router-dom'; // Asegúrate de importar useLocation

const CalendarClient = () => {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(false); // Estado para el spinner    
    const [services, setServices] = useState([]);
    const calendarRef = useRef(null);
    const [currentView, setCurrentView] = useState('timeGridWeek');
    const [mesComp, setMesComp] = useState(moment().format('MMMM YYYY')); // Estado para el mes actual    
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null); // Evento seleccionado
    const [showEventModal, setShowEventModal] = useState(false); // Estado del modal
    const [scheduleDate, setScheduleDate] = useState(moment().format('YYYY-MM-DD')); // Fecha inicial: Hoy
    const [scheduleStartTime, setScheduleStartTime] = useState(moment().format('HH:mm')); // Hora inicial: Ahora
    const [scheduleEndTime, setScheduleEndTime] = useState(moment().add(1, 'hour').format('HH:mm')); // Hora final: Una hora después
    const [users, setUsers] = useState([]); // Lista de usuarios
    const [isCollapsed, setIsCollapsed] = useState(true); // Estado de la columna colapsable
    const [selectedUsers, setSelectedUsers] = useState([]); // Lista de usuarios seleccionados
    const [alertMessage, setAlertMessage] = useState('');
    const [scheduleConflictMessage, setScheduleConflictMessage] = useState('');
    const [inspections, setInspections] = useState([]);
    const [showClientModal, setShowClientModal] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
    const storedUserInfo = JSON.parse(localStorage.getItem("user_info"));
    const userId = storedUserInfo?.id_usuario || '';
    const [newInspection, setNewInspection] = useState({
        inspection_type: [],
        inspection_sub_type: '',
    });
    const [editEventModalOpen, setEditEventModalOpen] = useState(false);
    const [deleteEventModalOpen, setDeleteEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const userTimeZone = moment.tz.guess();
    const navigate = useNavigate();
    const socket = useSocket();

    const location = useLocation(); // Para acceder a los parámetros de la URL

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
    }, []);

    // Efecto para filtrar eventos al cambiar los usuarios seleccionados
    useEffect(() => {
        filterEvents();
    }, [selectedUsers, allEvents, userId]); // Agrega `userId` y `allEvents` como dependencias

    useEffect(() => {
        const calendarApi = calendarRef.current?.getApi();
        if (calendarApi) {
            calendarApi.removeAllEvents(); 
            calendarApi.addEventSource(events); // Agrega los eventos actuales
            setMesComp(moment(calendarApi.getDate()).format('MMMM YYYY')); // Actualiza mesComp
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
        const filteredEvents = updatedAllEvents.filter((event) => {
            const isUserSelected = selectedUsers.length ? selectedUsers.includes(event.responsibleId) : false;
            const isClientOwner = event.clientId === userId;
            console.log("id del clinte en filter: ", event.clientId);
    
            // Mostrar eventos del cliente y de usuarios seleccionados simultáneamente
            return isUserSelected || isClientOwner;
        });
    
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
            if (!selectedService || !scheduleDate || !scheduleStartTime || !scheduleEndTime) {
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
    
            const newStart = moment(`${scheduleDate}T${scheduleStartTime}`);
            const newEnd = moment(`${scheduleDate}T${scheduleEndTime}`);
    
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
    }, [selectedService, scheduleDate, scheduleStartTime, scheduleEndTime, allEvents, services]);
    
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsers(data); // Guardar usuarios en el estado
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
    
            console.log('Intentando eliminar el evento:', selectedEvent);
    
            // Elimina el evento en el backend
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule/${selectedEvent.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });
    
            if (!response.ok) throw new Error('Error eliminando el evento en el backend');
    
            console.log('Evento eliminado en el backend:', selectedEvent);
    
            // Elimina directamente del calendario
            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
                const calendarEvent = calendarApi.getEventById(selectedEvent.id);
                if (calendarEvent) {
                    calendarEvent.remove(); // Elimina el evento del calendario
                    console.log('Evento eliminado de FullCalendar:', selectedEvent.id);
                }
            }
    
            // Actualiza el estado global
            setAllEvents((prevEvents) => {
                const updatedEvents = prevEvents.filter((event) => event.id !== selectedEvent.id);
                filterEvents(updatedEvents); // Filtra los eventos visibles
                return updatedEvents;
            });
    
            // Cierra los modales relacionados
            setDeleteEventModalOpen(false);
            setShowEventModal(false);
    
            console.log('Evento eliminado correctamente y calendario actualizado.');

            // Recarga la página después de eliminar el evento
            window.location.reload();
        } catch (error) {
            console.error('Error eliminando el evento:', error);
        }
    };    

    const handleEditEventClick = (event) => {
        console.log("Evento recibido para edición:", event);
    
        setEditingEvent(event);

        // Extrae los identificadores
        const serviceId = event.service_id; // ID del servicio
        const eventId = event.id; // ID del evento
    
        // Usa la fecha directamente desde el evento seleccionado
        const eventDate = event.date || moment(event.start).format('YYYY-MM-DD');
        const startTime = event.startTime || moment(event.start).format('HH:mm');
        const endTime = event.endTime || moment(event.end).format('HH:mm');
    
        console.log("Fecha procesada para edición:", eventDate);
        console.log("Hora de inicio procesada para edición:", startTime);
        console.log("Hora de fin procesada para edición:", endTime);
    
        setScheduleDate(eventDate);
        setScheduleStartTime(startTime);
        setScheduleEndTime(endTime);
        setSelectedService(serviceId);
    
        setEditEventModalOpen(true);
    };
    
    const handleSaveEditedEvent = async () => {
        try {
            if (!selectedService || !scheduleDate || !scheduleStartTime || !scheduleEndTime) {
                alert('Todos los campos son obligatorios');
                return;
            }
    
            const updatedEvent = {
                id: editingEvent.id,
                service_id: selectedService,
                date: scheduleDate,
                start_time: scheduleStartTime,
                end_time: scheduleEndTime,
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
                calendarEvent.setStart(moment(`${scheduleDate}T${scheduleStartTime}`).toISOString());
                calendarEvent.setEnd(moment(`${scheduleDate}T${scheduleEndTime}`).toISOString());
                calendarEvent.setExtendedProp('service_id', selectedService);
            }
    
            // Actualiza el estado global de eventos
            setAllEvents((prevEvents) =>
                prevEvents.map((event) =>
                    event.id === editingEvent.id
                        ? {
                              ...event,
                              start: moment(`${scheduleDate}T${scheduleStartTime}`).toISOString(),
                              end: moment(`${scheduleDate}T${scheduleEndTime}`).toISOString(),
                              service_id: selectedService,
                          }
                        : event
                )
            );
            
            setEditEventModalOpen(false); // Cierra el modal

            // Recarga la página después de editar evento
            window.location.reload();
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

            // Recarga la página después de eliminar el evento
            window.location.reload();
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
            setLoading(true); // Activar el spinner antes de cargar datos
            console.log(`Fetching schedule and services for: ${mesComp}`);    
            
            // Paso 1: Obtén los eventos de la agenda de servicios
            const scheduleResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule`);
            if (!scheduleResponse.ok) throw new Error('Failed to fetch schedule');
            const scheduleData = await scheduleResponse.json();
    
            console.log('Schedule data received:', scheduleData);
    
            // Paso 2: Crea un array para almacenar los eventos formateados
            const formattedEvents = await Promise.all(
                scheduleData.map(async (schedule) => {
                    try {
                        // Paso 3: Consulta la información del servicio
                        const serviceResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/services/${schedule.service_id}`);
                        if (!serviceResponse.ok) throw new Error(`Failed to fetch service for ID: ${schedule.service_id}`);
                        const serviceData = await serviceResponse.json();
    
                        console.log(`Service data for ID ${schedule.service_id}:`, serviceData);
    
                        // Paso 4: Consulta el nombre de la empresa usando el client_id
                        let clientName = 'Sin empresa';
                        let clientData;
                        if (serviceData.client_id) {
                            try {
                                const clientResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/clients/${serviceData.client_id}`);
                                if (clientResponse.ok) {
                                    clientData = await clientResponse.json();
                                    clientName = clientData.name || 'Sin nombre';
                                    console.log(`Client data for ID ${serviceData.client_id}:`, clientData);
                                } else {
                                    console.warn(`Failed to fetch client for ID: ${serviceData.client_id}`);
                                }
                            } catch (error) {
                                console.error(`Error fetching client for ID: ${serviceData.client_id}`, error);
                            }
                        }
    
                        // Paso 5: Consulta la información del responsable usando el responsible_id
                        let responsibleName = 'Sin responsable';
                        let responsibleData;
                        if (serviceData.responsible) {
                            try {
                                const responsibleResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${serviceData.responsible}`);
                                if (responsibleResponse.ok) {
                                    responsibleData = await responsibleResponse.json();
                                    responsibleName = `${responsibleData.name || 'Sin nombre'} ${responsibleData.lastname || ''}`.trim();
                                    console.log(`Responsible data for ID ${serviceData.responsible}:`, responsibleData);
                                } else {
                                    console.warn(`Failed to fetch responsible for ID: ${serviceData.responsible}`);
                                }
                            } catch (error) {
                                console.error(`Error fetching responsible for ID: ${serviceData.responsible}`, error);
                            }
                        }
    
                        // Paso 6: Crea el evento formateado
                        const start = moment(`${schedule.date.split('T')[0]}T${schedule.start_time}`).toISOString();
                        const end = schedule.end_time
                            ? moment(`${schedule.date.split('T')[0]}T${schedule.end_time}`).toISOString()
                            : null;

                            
                            console.log("userId: ", userId);
                            console.log("Client_id: ", serviceData.client_id )
    
                            const formattedEvent = {
                                id: schedule.id,
                                title: serviceData.client_id === userId ? `${serviceData.id}` : 'Ocupado',
                                serviceType: serviceData.service_type || 'Sin tipo',
                                description: serviceData.description || 'Sin descripción',
                                category: serviceData.category || 'Sin categoría', // Nueva propiedad
                                quantyPerMonth: serviceData.quantity_per_month || null, // Nueva propiedad
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
                            

                        console.log(`Color del responsable: `, responsibleData.color)
    
                        console.log('Formatted event:', formattedEvent);
                        return formattedEvent;
    
                    } catch (error) {
                        console.error(`Error processing schedule with service_id: ${schedule.service_id}`, error);
                        return null; // Retorna nulo si falla algo
                    }
                })
            );
    
            // Filtra los eventos nulos en caso de errores
            const validEvents = formattedEvents.filter(event => event !== null);
    
            // Paso 7: Actualiza el estado con los eventos válidos
            setAllEvents(validEvents);
            setEvents(validEvents);
            console.log('Events set in state:', validEvents);
            setLoading(false); // Desactivar el spinner después de la carga
    
        } catch (error) {
            console.error('Error loading schedule and services:', error);
        }finally {
            setLoading(false); // Desactivar el spinner incluso si hay un error
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
        const { serviceType, clientName, clientId } = eventInfo.event.extendedProps;
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
                    {clientId === userId ? (
                        // Mostrar detalles solo si el cliente coincide
                        <>
                            <div>ID Evento: {eventId}</div>
                            <div>ID Servicio: {serviceId}</div>
                            <div>{serviceType.replace(/[\{\}"]/g, '').replace(/,/g, ', ')}</div>
                            <div>{clientName}</div>
                            <div>{`${startTime} – ${endTime}`}</div>
                        </>
                    ) : (
                        // Mensaje genérico si no pertenece al cliente
                        <div>Espacio Ocupado</div>
                    )}
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

        // Verifica si el evento pertenece al usuario actual
        if (extendedProps.clientId === userId) {
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
     }
    };        

    const handleScheduleModalClose = () => {
        setScheduleModalOpen(false);
        setSelectedService('');
        setScheduleDate('');
        setScheduleStartTime('');
        setScheduleEndTime('');
        setAlertMessage('');
    };

    const handleDateSelect = (selectInfo) => {
        const { start, end } = selectInfo;
        setScheduleDate(moment(start).format('YYYY-MM-DD'));
        setScheduleStartTime(moment(start).format('HH:mm'));
        setScheduleEndTime(moment(end).format('HH:mm'));
        openScheduleModal(); // Abre el modal
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
        navigate('/myservicesclient', { state: { serviceId } });
    };

    const handleScheduleService = async () => {
        try {
            if (!selectedService || !scheduleDate || !scheduleStartTime || !scheduleEndTime) {
                alert('Todos los campos son obligatorios');
                return;
            }
    
            const selectedServiceData = services.find(service => service.id === selectedService);

            // Validar que la fecha y hora seleccionadas estén al menos 24 horas en el futuro
            const now = moment();
            const selectedStart = moment(`${scheduleDate}T${scheduleStartTime}`);

            if (selectedStart.diff(now, 'hours') < 24) {
                alert('No puedes agendar servicios con menos de 24 horas de anticipación.');
                return;
            }
    
            // Crear el objeto del nuevo horario
            const newSchedule = {
                service_id: selectedService,
                date: scheduleDate,
                start_time: scheduleStartTime,
                end_time: scheduleEndTime,
            };
    
            // Enviar el nuevo horario al backend
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-schedule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSchedule),
            });
    
            if (!response.ok) {
                throw new Error('Failed to schedule service');
            }
    
            const createdSchedule = await response.json();
            console.log('New schedule created:', createdSchedule);
    
            // Obtener datos del responsable
            let responsibleColor = '#fdd835'; // Color predeterminado
            let responsibleName
            if (selectedServiceData.responsible) {
                try {
                    const responsibleResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${selectedServiceData.responsible}`);
                    if (responsibleResponse.ok) {
                        const responsibleData = await responsibleResponse.json();
                        responsibleColor = responsibleData.color || '#fdd835';
                        responsibleName = `${responsibleData.name || 'Sin nombre'} ${responsibleData.lastname || ''}`.trim();
                    } else {
                        console.warn(`Failed to fetch responsible for ID: ${selectedServiceData.responsible}`);
                    }
                } catch (error) {
                    console.error(`Error fetching responsible for ID: ${selectedServiceData.responsible}`, error);
                }
            }

            console.log('Selected Service Data:', selectedServiceData);
    
            // Formatear el evento para incluir el color
            const formattedEvent = {
                id: createdSchedule.data.id,
                title: `${selectedServiceData.id}`,
                serviceType: selectedServiceData.service_type || 'Sin tipo',
                clientName: selectedServiceData.clientName || 'Sin empresa',
                clientId: userId,
                description: selectedServiceData.description || 'Sin descripción',
                color: responsibleColor, // Agregar el color del responsable
                backgroundColor: responsibleColor,
                category: selectedServiceData.category || 'Sin categoría', // Asegurarse de que la categoría esté presente
                quantyPerMonth: selectedServiceData.quantity_per_month || null, // Cantidad por mes si es periódico
                pestToControl: selectedServiceData.pest_to_control,
                interventionAreas: selectedServiceData.intervention_areas,
                value: selectedServiceData.value,
                companion: selectedServiceData.companion,
                start: moment(`${scheduleDate}T${scheduleStartTime}`).toISOString(),
                end: moment(`${scheduleDate}T${scheduleEndTime}`).toISOString(),
                allDay: false,
                responsibleId: selectedServiceData.responsible, // Asegúrate de incluir el responsable
                responsibleName,
            };
    
            // Actualiza el estado de forma segura
            setAllEvents((prevAllEvents) => {
                const updatedAllEvents = [...prevAllEvents, formattedEvent];
                console.log('Updated All Events:', updatedAllEvents);
                filterEvents(updatedAllEvents);
                return updatedAllEvents;
            });
    
            // Cerrar el modal y limpiar los campos
            handleScheduleModalClose();
        } catch (error) {
            console.error('Error scheduling service:', error);
        }
    };     
    
    const handleDatesSet = (dateInfo) => {
        console.log("Rango de fechas actualizado:", dateInfo.start, dateInfo.end);
    
        // Actualiza el mes en el estado cuando cambien las fechas del calendario
        setMesComp(moment(dateInfo.start).format('MMMM YYYY'));
    };    

    return (
        <div className="d-flex">
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            )}
    
            {/* Contenedor principal */}
            <div className="calendar-container flex-grow-1">
                <div className="card p-4 shadow-sm">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <div>
                        <Button 
                        variant="light" 
                        className="me-2" 
                        onClick={async () => {
                            setLoading(true); // Activar el spinner antes de cambiar el mes
                            const calendarApi = calendarRef.current.getApi();
                            calendarApi.prev();
                            setMesComp(moment(calendarApi.getDate()).format('MMMM YYYY'));
                            await fetchScheduleAndServices(); // Cargar nuevos eventos
                            setLoading(false); // Desactivar el spinner después de la carga
                        }}
                    >
                        <ChevronLeft />
                    </Button>

                    <Button 
                        variant="light" 
                        className="me-2" 
                        onClick={() => {
                            const calendarApi = calendarRef.current.getApi();
                            calendarApi.next();
                            setMesComp(moment(calendarApi.getDate()).format('MMMM YYYY')); // Actualiza mesComp
                        }}
                    >
                        <ChevronRight />
                    </Button>

                    <Button 
                        variant="light" 
                        className="me-2" 
                        onClick={() => {
                            const calendarApi = calendarRef.current.getApi();
                            calendarApi.next();
                            setMesComp(moment(calendarApi.getDate()).format('MMMM YYYY'));
                        }}
                    >
                        <ChevronRight />
                    </Button>
                        <Button variant="outline-dark" className="me-2" onClick={handleTodayClick}>
                            Hoy
                        </Button>
                        <span className="fw-bold fs-5 text-secondary ms-2">{mesComp}</span>
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
                            eventDrop={(info) => {
                                // Validar si el evento pertenece al cliente
                                if (info.event.extendedProps.clientId !== userId) {
                                    info.revert(); // Revertir el movimiento
                                    console.warn("No tienes permiso para mover este evento.");
                                } else {
                                    // Lógica para guardar el evento si el cliente es válido
                                    handleEventDrop(info);
                                }
                            }}
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
                                {services
                                    .filter((service) => service.client_id === userId) // Filtra los servicios
                                    .map((service) => (
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
                        <Form.Group controlId="formScheduleDate" className="mb-3">
                            <Form.Label>Fecha</Form.Label>
                            <Form.Control
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </Form.Group>

                        {/* Campo de hora de inicio */}
                        <Form.Group controlId="formScheduleStartTime" className="mb-3">
                            <Form.Label>Hora de Inicio</Form.Label>
                            <Form.Control
                                type="time"
                                value={scheduleStartTime}
                                onChange={(e) => setScheduleStartTime(e.target.value)}
                            />
                        </Form.Group>

                        {/* Campo de hora de finalización */}
                        <Form.Group controlId="formScheduleEndTime" className="mb-3">
                            <Form.Label>Hora de Fin</Form.Label>
                            <Form.Control
                                type="time"
                                value={scheduleEndTime}
                                onChange={(e) => setScheduleEndTime(e.target.value)}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
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
                                {services
                                    .filter((service) => service.client_id === userId) // Filtra los servicios
                                    .map((service) => (
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
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </Form.Group>

                        {/* Hora de inicio */}
                        <Form.Group controlId="formEditScheduleStartTime" className="mb-3">
                            <Form.Label>Hora de Inicio</Form.Label>
                            <Form.Control
                                type="time"
                                value={scheduleStartTime}
                                onChange={(e) => setScheduleStartTime(e.target.value)}
                            />
                        </Form.Group>

                        {/* Hora de fin */}
                        <Form.Group controlId="formEditScheduleEndTime" className="mb-3">
                            <Form.Label>Hora de Fin</Form.Label>
                            <Form.Control
                                type="time"
                                value={scheduleEndTime}
                                onChange={(e) => setScheduleEndTime(e.target.value)}
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
                    <p><strong>Servicio:</strong> {selectedEvent?.title}</p>
                    <p><strong>Tipo de servicio:</strong> {selectedEvent?.serviceType.replace(/[\{\}"]/g, '').replace(/,/g, ', ')}</p>
                    <p><strong>Fecha:</strong> {selectedEvent?.date} de {selectedEvent?.startTime} a {selectedEvent?.endTime}</p>
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

export default CalendarClient;
