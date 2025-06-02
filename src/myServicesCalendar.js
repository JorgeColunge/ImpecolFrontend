import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ClientInfoModal from './ClientInfoModal';
import esLocale from '@fullcalendar/core/locales/es';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import { getCachedMonth, setCachedMonth } from './indexedDBHandler';
import { ChevronLeft, ChevronRight, Plus, GearFill, InfoCircle, Bug, GeoAlt, FileText, Clipboard, PlusCircle, PencilSquare, Trash, Building, ViewList, EyeFill } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './InspectionCalendar.css';
import moment from 'moment-timezone';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useNavigate } from 'react-router-dom';
import { useSocket } from './SocketContext';

async function buildMyEvent(schedule, userId) {
    /* 1. servicio */
    const sRes = await fetch(
        `${process.env.REACT_APP_API_URL}/api/services/${schedule.service_id}`
    );
    if (!sRes.ok) throw new Error('service not found');
    const service = await sRes.json();

    /* 2. ¿soy responsable o acompañante? */
    let companions = [];
    try {
        companions = JSON.parse(
            (service.companion ?? '').replace(/{/g, '[').replace(/}/g, ']')
        );
    } catch (_) { }                              // si falla, se queda []
    if (service.responsible !== userId && !companions.includes(userId)) {
        return null;                              // evento que NO me pertenece
    }

    /* 3. cliente (puede no existir) */
    let client = null;
    if (service.client_id) {
        const c = await fetch(
            `${process.env.REACT_APP_API_URL}/api/clients/${service.client_id}`
        );
        client = c.ok ? await c.json() : null;
    }

    /* 4. responsable → nombre + color  */
    let responsible = null;
    if (service.responsible) {
        const r = await fetch(
            `${process.env.REACT_APP_API_URL}/api/users/${service.responsible}`
        );
        responsible = r.ok ? await r.json() : null;
    }

    /* 5. fechas */
    const start = moment(
        `${schedule.date.split('T')[0]}T${schedule.start_time}`
    ).toISOString();
    const end = schedule.end_time
        ? moment(`${schedule.date.split('T')[0]}T${schedule.end_time}`).toISOString()
        : null;

    return {
        id: schedule.id,
        title: service.id,
        serviceType: service.service_type || 'Sin tipo',
        description: service.description || 'Sin descripción',
        category: service.category,
        quantyPerMonth: service.quantity_per_month,
        clientName: client?.name ?? 'Sin empresa',
        clientId: service.client_id,
        responsibleId: service.responsible,
        responsibleName: responsible
            ? `${responsible.name} ${responsible.lastname ?? ''}`.trim()
            : 'Sin responsable',
        address: client?.address ?? 'Sin dirección',
        phone: client?.phone ?? 'Sin teléfono',
        color: responsible?.color ?? '#fdd835',
        pestToControl: service.pest_to_control,
        interventionAreas: service.intervention_areas,
        value: service.value,
        companion: service.companion,
        start,
        end,
        allDay: false,
    };
}

const MyServicesCalendar = () => {
    const [events, setEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [services, setServices] = useState([]);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const calendarRef = useRef(null);
    const [currentView, setCurrentView] = useState('timeGridWeek');
    const [mesComp, setMesComp] = useState(moment().format('MM/YYYY'));
    const [mesCompNom, setMesCompNom] = useState(moment().format('MMMM YYYY').charAt(0).toUpperCase() + moment().format('MMMM YYYY').slice(1)); // Estado para el nombre del mes 
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [scheduleDate, setScheduleDate] = useState(moment().format('YYYY-MM-DD')); // Fecha inicial: Hoy
    const [scheduleStartTime, setScheduleStartTime] = useState(moment().format('HH:mm')); // Hora inicial: Ahora
    const [scheduleEndTime, setScheduleEndTime] = useState(moment().add(1, 'hour').format('HH:mm')); // Hora final: Una hora después
    const [inspections, setInspections] = useState([]);
    const [showAddInspectionModal, setShowAddInspectionModal] = useState(false);
    const [showClientModal, setShowClientModal] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [newInspection, setNewInspection] = useState({
        inspection_type: [],
        inspection_sub_type: '',
    });
    const socket = useSocket();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]); // Estado para almacenar los usuarios

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

    // Obtener información del usuario conectado desde localStorage
    const storedUserInfo = JSON.parse(localStorage.getItem("user_info"));
    const userId = storedUserInfo?.id_usuario || '';
    const userColor = storedUserInfo?.color || '#007bff'; // Color del usuario conectado

    const handleDatesSet = (dateInfo) => {
        const newMesComp = moment(dateInfo.view.currentStart).format('MM/YYYY'); // Formato MM/YYYY
        const newMesCompNom = moment(dateInfo.view.currentStart).format('MMMM YYYY');

        // Capitalizar la primera letra del mes (en español, Moment.js lo da en minúsculas)
        const formattedMesComp = newMesComp.charAt(0).toUpperCase() + newMesComp.slice(1);

        // Verifica si ha cambiado el mes y actualiza el estado
        if (mesComp !== formattedMesComp) {
            console.log(`🔄 Cambio de mes detectado: ${mesComp} → ${newMesComp}`);
            setMesComp(newMesComp);
            setMesCompNom(newMesCompNom.charAt(0).toUpperCase() + newMesCompNom.slice(1));
        } else {
            console.log(`📅 Estás viendo el mes de: ${formattedMesComp}`);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    useEffect(() => {
        let aborted = false;

        fetchScheduleAndServices({
            refresh: true,            // refresca también en segundo plano
            abortFn: () => aborted,
        });

        return () => { aborted = true; };      // cancela si el mes cambia
    }, [mesComp]);                           // sólo depende del mes    

    // dentro del componente, justo donde estaba tu antigua función
    const fetchScheduleAndServices = async ({ refresh = true, abortFn = () => false } = {}) => {
        try {
            setIsLoading(true);

            /* 1️⃣ lee caché */
            const cached = await getCachedMonth(mesComp);
            if (cached && !abortFn()) {
                setAllEvents(cached);
                setEvents(cached);
                setIsLoading(false);               // UI lista de inmediato
            }

            /* 2️⃣ refresco si no hay caché o se pide refresh */
            if (!cached || refresh) {
                const resp = await fetch(
                    `${process.env.REACT_APP_API_URL}/api/service-schedule?month=${mesComp}`
                );
                if (!resp.ok) throw new Error('schedule fetch error');
                const scheduleList = await resp.json();

                /* si no había caché, vaciamos antes de comenzar la carga progresiva */
                if (!cached && !abortFn()) {
                    setAllEvents([]);
                    setEvents([]);
                }

                const monthEvents = [];

                for (const sched of scheduleList) {
                    if (abortFn()) return;           // el usuario cambió de mes → aborta

                    try {
                        const ev = await buildMyEvent(sched, userId);
                        if (!ev) continue;             // no me pertenece

                        /* evita duplicados rápidos */
                        const dup = monthEvents.some(
                            (e) => e.service_id === ev.service_id && e.start === ev.start
                        );
                        if (dup) continue;

                        monthEvents.push(ev);

                        /* pinta inmediatamente → carga progresiva */
                        setAllEvents((prev) => [...prev, ev]);
                        setEvents((prev) => [...prev, ev]);
                    } catch (err) {
                        console.error('buildMyEvent error', err);
                    }
                }

                if (!abortFn()) await setCachedMonth(mesComp, monthEvents);
            }
        } catch (err) {
            console.error('Error loading schedule and services:', err);
        } finally {
            if (!abortFn()) setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedEvent?.title) {
            console.log(`Servicio seleccionado ${selectedEvent.title}`);
            setInspections([]); // Limpia inspecciones anteriores
            fetchInspections(selectedEvent.title); // Carga inspecciones relacionadas con el servicio
        }
    }, [selectedEvent]);

    useEffect(() => {
        fetchUsers(); // Carga los usuarios cuando el componente se monta
    }, []);

    const handleShowClientModal = (clientId) => {
        setSelectedClientId(clientId);
        setShowClientModal(true);
    };

    const handleCloseClientModal = () => {
        setShowClientModal(false);
        setSelectedClientId(null);
    };

    const handleEditServiceClick = (serviceId) => {
        navigate('/myServices', { state: { serviceId } });
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
                date: moment.utc(inspection.date).startOf('day').format("DD/MM/YYYY"),
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

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users`);
            if (!response.ok) throw new Error('Error al cargar usuarios');
            const data = await response.json();
            setUsers(data); // Actualiza el estado con la lista de usuarios
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
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

    const renderEventContent = (eventInfo) => {
        const { serviceType, clientName } = eventInfo.event.extendedProps;
        const { start, end } = eventInfo.event;

        const cleanServiceType = serviceType.replace(/[\{\}"]/g, '').replace(/,/g, ', ');
        const startTime = moment(start).format('h:mm A');
        const endTime = moment(end).format('h:mm A');

        return (
            <OverlayTrigger
                placement="top"
                overlay={
                    <Tooltip>
                        <div>{cleanServiceType}</div>
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
    }

    const handleEventClick = (clickInfo) => {
        const { extendedProps, title, start, end } = clickInfo.event;
        const currentMonth = moment().format('YYYY-MM'); // Mes actual en formato 'YYYY-MM'

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
            address: extendedProps.address || 'Sin dirección',
            phone: extendedProps.phone || 'Sin teléfono',
            category: extendedProps.category || 'Sin categoría', // Nueva propiedad
            quantyPerMonth: extendedProps.quantyPerMonth || null, // Nueva propiedad
            clientId: extendedProps.clientId,
            pestToControl: extendedProps.pestToControl || 'No especificado',
            interventionAreas: extendedProps.interventionAreas || 'No especificado',
            value: extendedProps.value || 'No especificado',
            companion: extendedProps.companion,
            scheduledThisMonth, // Nueva propiedad: veces agendado en el mes
            startTime: moment(start).format('h:mm A'),
            endTime: moment(end).format('h:mm A'),
        };
        setSelectedEvent(eventData);
        setShowEventModal(true);
    };

    const handleTodayClick = () => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.today();
    };

    const changeView = (view) => {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView(view);
        setCurrentView(view);
    };

    const handleScheduleModalClose = () => {
        setScheduleModalOpen(false);
        setSelectedService('');
        setScheduleDate('');
        setScheduleStartTime('');
        setScheduleEndTime('');
    };

    const handleDateSelect = (selectInfo) => {
        const { start, end } = selectInfo;
        setScheduleDate(moment(start).format('YYYY-MM-DD'));
        setScheduleStartTime(moment(start).format('HH:mm'));
        setScheduleEndTime(moment(end).format('HH:mm'));
        setScheduleModalOpen(true); // Abre el modal
    };

    return (
        <div className="d-flex">

            {isLoading && allEvents.length === 0 && (
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
                            <span className="fw-bold ms-3" style={{ fontSize: "1.2rem" }}>
                                {mesCompNom}
                            </span>
                        </div>
                        <div>
                            <Button
                                variant={currentView === 'dayGridMonth' ? 'dark' : 'success'}
                                className="me-2"
                                onClick={() => changeView('dayGridMonth')}
                            >
                                Mes
                            </Button>
                            <Button
                                variant={currentView === 'timeGridWeek' ? 'dark' : 'success'}
                                className="me-2"
                                onClick={() => changeView('timeGridWeek')}
                            >
                                Semana
                            </Button>
                            <Button
                                variant={currentView === 'timeGridDay' ? 'dark' : 'success'}
                                onClick={() => changeView('timeGridDay')}
                            >
                                Día
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
                                <h5 className="text-secondary mb-3">
                                    <InfoCircle className="me-2" /> Información General
                                </h5>
                                <div className="d-flex flex-column gap-2">
                                    <div className='p-0 m-0 d-flex'>
                                        <p><strong>ID del Servicio:</strong> {selectedEvent.title}</p>
                                        <EyeFill
                                            className='ms-2'
                                            style={{ cursor: "pointer" }}
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
                                                style={{ cursor: "pointer" }}
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
                                {/* Áreas */}
                                <div className="flex-fill bg-white shadow-sm rounded p-3 w-100">
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

            <ClientInfoModal
                clientId={selectedClientId}
                show={showClientModal}
                onClose={handleCloseClientModal}
            />
        </div>
    );

};

export default MyServicesCalendar;
