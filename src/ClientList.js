import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, InputGroup, FormControl, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './ClientList.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { BuildingFill, GeoAltFill, PhoneFill, TelephoneFill, X, XCircle } from 'react-bootstrap-icons';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-red.png', // URL del icono
  iconSize: [25, 41], // Tamaño del icono
  iconAnchor: [12, 41], // Punto de anclaje
  popupAnchor: [1, -34], // Punto de apertura del popup
  shadowUrl: 'https://leafletjs.com/examples/custom-icons/leaf-shadow.png', // Sombra del icono
  shadowSize: [41, 41],
});


function ClientList() {
  const [clients, setClients] = useState([]);
  const [showAddMapModal, setShowAddMapModal] = useState(false); // ✅ Correcto
  const [newMap, setNewMap] = useState({ description: "", image: null });
  const [filteredClients, setFilteredClients] = useState([]); // Para almacenar los clientes filtrados
  const [searchText, setSearchText] = useState(''); // Estado para el texto de búsqueda
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stations, setStations] = useState([]); // Estado único para todas las estaciones
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationCallback, setConfirmationCallback] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "call" o "whatsapp"
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [airStations, setAirStations] = useState([]);
  const [rodentStations, setRodentStations] = useState([]);
  const [showImageModal, setShowImageModal] = useState(false); // Controla la visualización del modal
  const [selectedImage, setSelectedImage] = useState(null); // Almacena la URL de la imagen seleccionada
  const [maps, setMaps] = useState([]);
  const [categories, setCategories] = useState([]); // Nuevo estado para las categorías
  const [newClient, setNewClient] = useState({
    name: '',
    address: '',
    department: 'Nariño', // Valor predeterminado
    city: 'Pasto', // Valor predeterminado
    phone: '',
    email: '',
    representative: '',
    document_type: 'NIT', // Valor predeterminado
    document_number: '',
    contact_name: '',
    contact_phone: '',
    rut: '',
    category: ''
  });

  const [showAddAirStationModal, setShowAddAirStationModal] = useState(false);
  const [newStation, setNewStation] = useState({
    description: '',
    type: 'Control', // Tipo predeterminado
    category: '', // Nueva propiedad para categoría
    client_id: null, // Se llenará automáticamente con el cliente seleccionado
    latitude: '', // Nueva propiedad
    longitude: '', // Nueva propiedad
    altitude: '', // Nueva propiedad (opcional)
  }); 

  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientsAndCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients`);
        setClients(response.data);
        setFilteredClients(response.data); // Inicialmente muestra todos los clientes
        setLoading(false);
        const categoriesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rules/categories`); // Ruta para categorías
      setCategories(categoriesResponse.data); // Guardar las categorías en el estado        
      } catch (error) {
        console.error("Error fetching clients:", error);
        setLoading(false);
      }
    };
    fetchClientsAndCategories();
  }, []);

  // Función para manejar el cambio en el campo de búsqueda
  const handleSearch = (e) => {
    const text = e.target.value.toLowerCase();
    setSearchText(text);
    
    const filtered = clients.filter(client => 
      client.name.toLowerCase().includes(text) ||
      client.document_number.toLowerCase().includes(text) ||
      client.contact_name.toLowerCase().includes(text)
    );
    setFilteredClients(filtered);
  };

  const [rutFile, setRutFile] = useState(null);
  const handleRutFileChange = (e) => {
    setRutFile(e.target.files[0]);
  }; 

  const handleShowModal = (client = null) => {
    setEditingClient(client);
    if (client) {
      setNewClient(client); // Si editamos, llenamos los datos del cliente seleccionado
    } else {
      setNewClient({
        name: '',
        address: '',
        department: 'Nariño', // Valor predeterminado
        city: 'Pasto', // Valor predeterminado
        phone: '',
        email: '',
        representative: '',
        document_type: 'NIT', // Valor predeterminado
        document_number: '',
        contact_name: '',
        contact_phone: '',
        rut: '',
        category:'',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingClient(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({ ...newClient, [name]: value });
  };
 

  const getSignedUrl = async (url) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/PrefirmarArchivos`, { url });
      return response.data.signedUrl; // Devuelve la URL prefirmada
    } catch (error) {
      console.error("Error al obtener la URL prefirmada:", error);
      throw new Error("No se pudo obtener la URL prefirmada.");
    }
  };

  const handleSaveNewStation = async () => {
    // Validación manual
    const { description, type, category, latitude, longitude } = newStation;
  
    if (!description || !category) {
      handleShowNotification("Por favor completa todos los campos obligatorios."); // Mostrar mensaje al usuario
      return; // Detener la ejecución si los campos están vacíos
    }
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/stations`, {
        description,
        type,
        category,
        client_id: selectedClient.id, // Asociar con el cliente seleccionado
        latitude, // Enviar latitud
        longitude, // Enviar longitud
        altitude: newStation.altitude || null, // Altitud opcional
      });
  
      const addedStation = response.data.station;
  
      // Actualizar la lista de estaciones en tiempo real
      setStations((prevStations) => [...prevStations, addedStation]);
  
      // Reiniciar el formulario y cerrar el modal
      setNewStation({
        description: '',
        type: 'Control',
        category: '',
        latitude: '',
        longitude: '',
        altitude: '',
      });
      handleShowNotification('Estación agregada exitosamente');
      setShowAddStationModal(false);
    } catch (error) {
      console.error('Error al guardar la estación:', error);
      handleShowNotification('Hubo un error al guardar la estación');
    }
  };
  
  
  const handleDeleteStation = async (stationId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/stations/${stationId}`);
      
      // Actualiza el estado eliminando la estación
      setStations((prevStations) => prevStations.filter((station) => station.id !== stationId));
      
      handleShowNotification("Estación eliminada exitosamente.");
    } catch (error) {
      console.error("Error al eliminar estación:", error);
      handleShowNotification("Hubo un error al eliminar la estación.");
    }
  };
  

  const handleShowActionModal = (type) => {
    setActionType(type);
    setShowActionModal(true);
  };
  
  const handleCloseActionModal = () => {
    setShowActionModal(false);
    setActionType("");
    setSelectedNumber(null);
  };

  const handleShowNotification = (message) => {
    setNotificationMessage(message);
    setShowNotificationModal(true);
  };
  
  const handleCloseNotification = () => {
    setShowNotificationModal(false);
  };
  
  const handleShowConfirmation = (callback) => {
    setConfirmationCallback(() => callback);
    setShowConfirmationModal(true);
  };
  
  const handleCloseConfirmation = () => {
    setShowConfirmationModal(false);
    setConfirmationCallback(null);
  };

  const fetchStationsByClient = async (clientId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stations/client/${clientId}`);
      const stations = response.data;
  
      setStations(stations); // Guarda todas las estaciones en un solo estado
    } catch (error) {
      console.error("Error fetching stations by client:", error);
      setStations([]); // Reinicia el estado si hay un error
    }
  }; 

  
  const fetchMapsByClient = async (clientId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/maps/${clientId}`);
      const { maps } = response.data; // Ajusta la estructura según el backend
      console.log("mapas encontrados: ", maps);
      setMaps(maps);
    } catch (error) {
      console.error("Error fetching maps by client:", error);
      setMaps([]);
    }
  };  

  const uploadRutFile = async () => {
    if (!rutFile) return null; // Si no hay archivo, no hacer nada
  
    const formData = new FormData();
    formData.append('rut', rutFile);
  
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clients/upload-rut`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.fileUrl; // Devuelve la URL del archivo
    } catch (error) {
      console.error("Error al subir el archivo RUT:", error);
      throw new Error("Error al subir el archivo RUT");
    }
  };  

  const handleAddOrEditClient = async () => {
    try {
      let rutFileUrl = null;
  
      // Subir el archivo RUT si se seleccionó
      if (rutFile) {
        const formData = new FormData();
        formData.append('rut', rutFile);
  
        const uploadResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/clients/upload-rut`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
  
        // Obtener la URL del archivo RUT subido
        rutFileUrl = uploadResponse.data.fileUrl;
      }
  
      if (editingClient) {
        // Actualizar cliente existente
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/clients/${editingClient.id}`,
          { ...newClient, rut: rutFileUrl || newClient.rut } // Usar la URL nueva si está disponible
        );
  
        // Actualiza la lista de clientes en el estado
        const updatedClient = response.data.client;
        setClients(clients.map(client => (client.id === editingClient.id ? updatedClient : client)));
        setFilteredClients(filteredClients.map(client => (client.id === editingClient.id ? updatedClient : client)));
  
        handleShowNotification("Cliente actualizado exitosamente");
      } else {
        // Crear nuevo cliente
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clients`, {
          ...newClient,
          rut: rutFileUrl, // Agregar la URL del archivo RUT
          category: newClient.category, // Asegúrate de incluir la categoría seleccionada
        });
  
        // Agregar el nuevo cliente a la lista
        const newClientData = response.data.client;
        setClients([...clients, newClientData]);
        setFilteredClients([...filteredClients, newClientData]);
  
        handleShowNotification("Cliente agregado exitosamente");
      }
  
      // Cerrar el modal y reiniciar el formulario
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
      handleShowNotification("Hubo un error al guardar el cliente.");
    }
  };  

  const deleteClient = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/clients/${id}`);
      setClients(clients.filter(client => client.id !== id));
      setFilteredClients(filteredClients.filter(client => client.id !== id)); // Asegura actualizar el listado filtrado
      handleShowNotification("Cliente eliminado exitosamente.");
    } catch (error) {
      console.error("Error al eliminar cliente:", error);
      handleShowNotification("Hubo un error al eliminar el cliente.");
    }
  };  

  const handleShowAddStationModal = () => {
    const newDescription = stations.length + 1; // Generar el número incremental
    // Intentar obtener la geolocalización del dispositivo
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, altitude } = position.coords;
        setNewStation({
          description: newDescription.toString(), // Establecer la descripción como texto
          type: 'Control',
          category: '',
          client_id: selectedClient.id, // Asociar cliente
          latitude: latitude || '',
          longitude: longitude || '',
          altitude: altitude || '', // Altitud opcional
        });
      },
      (error) => {
        console.error("Error obteniendo la geolocalización:", error);
        alert("No se pudo obtener la ubicación del dispositivo.");
      }
    );
  
    setShowAddStationModal(true);
  };  

  // Función para manejar la visualización del modal de detalles
  const handleShowDetails = (client) => {
    setSelectedClient({ ...client, maps: client.maps || [] });
    fetchStationsByClient(client.id);
    fetchMapsByClient(client.id);
    setShowDetailsModal(true);    
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedClient(null);
  };

  if (loading) return <div>Cargando clientes...</div>;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const maxSize = 10 * 1024 * 1024; // Tamaño máximo permitido (10 MB)
  
    if (file.size > maxSize) {
      alert("El archivo es demasiado grande. El tamaño máximo permitido es de 10 MB.");
      return;
    }
  
    setRutFile(file); // Solo establece el archivo si pasa la validación
  };  
  const handleShowAddMapModal = () => setShowAddMapModal(true);
  const handleCloseAddMapModal = () => setShowAddMapModal(false);
  
  const handleNewMapChange = (e) => {
    const { name, value } = e.target;
    setNewMap({ ...newMap, [name]: value });
  };  
  
  const handleSaveNewMap = async () => {
    if (!newMap.description || !newMap.imageFile) {
      alert("Por favor completa todos los campos y carga una imagen.");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('description', newMap.description);
      formData.append('image', newMap.imageFile); // Archivo de imagen
      formData.append('client_id', selectedClient.id); // ID del cliente
  
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/maps`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      // Actualizar la lista de mapas en tiempo real
      const savedMap = response.data.map;
      setMaps((prevMaps) => [...prevMaps, savedMap]); // Agrega el nuevo mapa a la lista
      setSelectedClient((prevClient) => ({
        ...prevClient,
        maps: [...(prevClient.maps || []), savedMap], // Actualiza los mapas del cliente seleccionado
      }));
  
      // Limpiar el formulario y cerrar el modal
      setNewMap({ description: "", image: null, imageFile: null });
      setShowAddMapModal(false);
      alert("Mapa guardado exitosamente");
    } catch (error) {
      console.error("Error al guardar el mapa:", error);
      alert("Hubo un error al guardar el mapa.");
    }
  };  

  const handleShowImageModal = (image) => {
    setSelectedImage(image); // Establece la imagen seleccionada
    setShowImageModal(true); // Muestra el modal
  };
  
  const handleCloseImageModal = () => {
    setSelectedImage(null); // Limpia la imagen seleccionada
    setShowImageModal(false); // Cierra el modal
  };  

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <InputGroup className="w-100 me-3">
        <FormControl 
        placeholder="Buscar" 
        aria-label="Buscar" 
        value={searchText}
        onChange={handleSearch} // Evento para manejar la búsqueda
      />
        </InputGroup>
        <Button className='w-25' variant="success" onClick={() => handleShowModal()}>
          Agregar Cliente
        </Button>
      </div>
  
      <div className="card-container">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="client-card"
            onClick={() => handleShowDetails(client)} // Abre el modal al hacer clic en la tarjeta
            style={{ cursor: 'pointer' }}
          >
            <h5>{client.name}</h5>
            <p className='mt-2'> <TelephoneFill/> {client.phone}</p>
            <p className='mb-1'> <BuildingFill/> {client.address}, {client.department}, {client.city}</p>
            <div
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // Evita que se abra el modal al hacer clic en el mapa
                window.open(
                  `https://www.google.com/maps?q=${encodeURIComponent(client.address)},${client.city},${client.department}&ll=${client.latitude},${client.longitude}`,
                  '_blank'
                ); // Abre Google Maps en una nueva pestaña
              }}
              style={{ cursor: 'pointer', zIndex: '1'}}
            >
              {client.latitude && client.longitude ? (
                <div className="map-container">
                  <MapContainer
                    center={[client.latitude, client.longitude]}
                    zoom={17}
                    style={{ height: '150px', width: '100%' }}
                    zoomControl={false}
                    dragging={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    attributionControl={false}
                    interactive={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={[client.latitude, client.longitude]}
                      icon={L.divIcon({
                        className: 'custom-marker',
                        html: `<div style="color: red; font-size: 24px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16">
                                  <path d="M12 11c0 1.105-1.511 2-3.5 2S5 12.105 5 11c0-.638.41-1.164 1-1.44V5.5c0-.276.224-.5.5-.5h3a.5.5 0 0 1 .5.5v4.06c.59.276 1 .802 1 1.44z"/>
                                  <path fill-rule="evenodd" d="M8 16s6-5.686 6-10A6 6 0 1 0 2 6c0 4.314 6 10 6 10z"/>
                                </svg>
                              </div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 24],
                      })}
                    >
                      <Popup>
                        {client.name} - {client.address}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <p>No hay ubicación disponible</p>
              )}
            </div>
          </div>
        ))}
      </div>
  
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingClient ? "Editar Cliente" : "Agregar Cliente"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formClientName" className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newClient.name || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formClientAddress" className="mb-3">
              <Form.Label>Dirección</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={newClient.address || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formClientDepartment" className="mb-3">
              <Form.Label>Departamento</Form.Label>
              <Form.Select
                name="department"
                value={newClient.department || "Nariño"} // Valor inicial
                onChange={(e) =>
                  setNewClient({ ...newClient, department: e.target.value })
                }
                required
              >
                {[
                  "Amazonas",
                  "Antioquia",
                  "Arauca",
                  "Atlántico",
                  "Bolívar",
                  "Boyacá",
                  "Caldas",
                  "Caquetá",
                  "Casanare",
                  "Cauca",
                  "Cesar",
                  "Chocó",
                  "Córdoba",
                  "Cundinamarca",
                  "Guainía",
                  "Guaviare",
                  "Huila",
                  "La Guajira",
                  "Magdalena",
                  "Meta",
                  "Nariño",
                  "Norte de Santander",
                  "Putumayo",
                  "Quindío",
                  "Risaralda",
                  "San Andrés y Providencia",
                  "Santander",
                  "Sucre",
                  "Tolima",
                  "Valle del Cauca",
                  "Vaupés",
                  "Vichada",
                ].map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="formClientCity" className="mb-3">
              <Form.Label>Ciudad</Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={newClient.city || "Pasto"} // Valor inicial
                onChange={(e) =>
                  setNewClient({ ...newClient, city: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group controlId="formClientPhone" className="mb-3">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="number"
                name="phone"
                value={newClient.phone || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formClientEmail" className="mb-3">
              <Form.Label>Correo</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={newClient.email || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="formClientDocumentType" className="mb-3">
              <Form.Label>Tipo de Documento</Form.Label>
              <Form.Select
                name="document_type"
                value={newClient.document_type || "NIT"} // Valor inicial
                onChange={(e) =>
                  setNewClient({ ...newClient, document_type: e.target.value })
                }
                required
              >
                <option value="Cédula">Cédula</option>
                <option value="NIT">NIT</option>
              </Form.Select>
            </Form.Group>
            <Form.Group controlId="formClientDocumentNumber" className="mb-3">
              <Form.Label>Número de Documento</Form.Label>
              <Form.Control
                type="number"
                name="document_number"
                value={newClient.document_number || ""}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
              {/* Nueva casilla para categoría */}
          <Form.Group controlId="formClientCategory" className="mb-3">
            <Form.Label>Categoría</Form.Label>
            <Form.Control
              as="select"
              value={newClient.category}
              onChange={(e) => setNewClient({ ...newClient, category: e.target.value })}
            >
              <option value="">Seleccione una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
                    <Form.Group controlId="formClientContactName" className="mb-3">
                      <Form.Label>Nombre de Contacto</Form.Label>
                      <Form.Control
                        type="text"
                        name="contact_name"
                        value={newClient.contact_name || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    <Form.Group controlId="formClientContactPhone" className="mb-3">
                      <Form.Label>Teléfono de Contacto</Form.Label>
                      <Form.Control
                        type="text"
                        name="contact_phone"
                        value={newClient.contact_phone || ""}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                    <Form.Group controlId="formClientRUT" className="mb-3">
          <Form.Label>RUT</Form.Label>
          <Form.Control
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setRutFile(e.target.files[0])}
          />
        </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleAddOrEditClient}
            disabled={
              !newClient.name ||
              !newClient.address ||
              !newClient.department ||
              !newClient.city ||
              !newClient.phone ||
              !newClient.email ||
              !newClient.document_type ||
              !newClient.document_number
            }
          >
            {editingClient ? "Guardar Cambios" : "Registrar Cliente"}
          </Button>
        </Modal.Footer>
      </Modal>


      {/* Modal para mostrar detalles del cliente */}
      <Modal show={showDetailsModal} onHide={handleCloseDetailsModal} size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <BuildingFill className="me-2" /> Detalles del Cliente
          </Modal.Title>
        </Modal.Header>
      <Modal.Body style={{height:'65vh'}}>
        {selectedClient ? (
          <div className="row">
            {/* Parte superior izquierda: Información de la Empresa */}
            <div className="col-md-6 mb-4">
              <div className="bg-white shadow-sm rounded px-3 pt-3 pb-0" style={{height:'100%'}}>
                <h5 className="text-secondary mb-3">
                  <GeoAltFill className="me-2" /> Información de la Empresa
                </h5>
                <p><strong>Dirección:</strong> {selectedClient.address || "No disponible"}</p>
                <p><strong>Teléfono Empresa:</strong> {selectedClient.phone || "No disponible"}</p>
                <p><strong>Tipo de Documento:</strong> {selectedClient.document_type || "No disponible"}</p>
                <p><strong>Número de Documento:</strong> {selectedClient.document_number || "No disponible"}</p>
                <p>
                  <strong>RUT:</strong>{" "}
                  {selectedClient?.rut ? (
                    <a
                      href={`${selectedClient.rut}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver RUT
                    </a>
                  ) : (
                    "No disponible"
                  )}
                </p>
              </div>
            </div>

            {/* Parte superior derecha: Información del Contacto */}
            <div className="col-md-6 mb-4">
              <div className="bg-white shadow-sm rounded px-3 pt-3 pb-0" style={{height:'100%'}}>
                <h5 className="text-secondary mb-3">
                  <i className="fas fa-user me-2"></i> Información del Contacto
                </h5>
                <p><strong>Nombre:</strong> {selectedClient.contact_name || "No disponible"}</p>
                <p><strong>Teléfono:</strong> {selectedClient.contact_phone || "No disponible"}</p>
                <p><strong>Correo:</strong> {selectedClient.email || "No disponible"}</p>
              </div>
            </div>

            {/* Nuevo contenedor unificado de Estaciones */}
            <div className="col-md-12 mb-4">
              <div className="bg-white shadow-sm rounded p-3 station-container">
                <h5 className="text-secondary mb-3">
                  <BuildingFill className="me-2" /> Estaciones
                </h5>
                <div className="table-container">
                {stations.length > 0 ? (
              <table className="table table-bordered table-hover text-center">
                <thead className="table-light">
                  <tr>
                    <th style={{width:'20%'}}>Descripción</th>
                    <th style={{width:'20%'}}>Tipo</th>
                    <th style={{width:'20%'}}>Categoría</th>
                    <th style={{width:'35%'}}>QR</th>
                    <th style={{width:'5%'}}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
              {stations.map((station, index) => (
                <tr key={station.id}>
                  <td>{station.description}</td>
                  <td>{station.type || "No disponible"}</td>
                  <td>{station.category || "No disponible"}</td> {/* Nueva columna */}
                  <td>
                    {station.qr_code ? (
                      <img
                        src={`${station.qr_code}`}
                        alt={`QR de estación ${station.description}`}
                        style={{ width: "50%", marginLeft: '25%', marginRight: '25%' }}
                      />
                    ) : (
                      "No disponible"
                    )}
                  </td>
                  <td style={{ textAlign: 'center', position: 'relative' }}>
                    {/* Ícono de eliminación al final de la fila */}
                    <XCircle
                      style={{
                        cursor: 'pointer',
                        color: 'red',
                        fontSize: '1.2rem',
                      }}
                      onClick={(e) => {
                        e.stopPropagation(); // Evita eventos innecesarios
                        handleDeleteStation(station.id); // Llama a la función para eliminar
                      }}
                      title="Eliminar estación"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
              </table>
            ) : (
              <p className="text-center">No hay estaciones registradas.</p>
            )}
                </div>
                <div className="d-flex justify-content-end mt-3">
                <Button
              variant="outline-success"
              className="px-3 py-1"
              onClick={() => {
                setNewStation({
                  description: '',
                  type: 'Control',
                  client_id: selectedClient.id, // Asociar cliente
                });
                setNewStation((prevState) => ({
                  ...prevState,
                  description: stations.length + 1, // Número incremental automático
                }));
                handleShowAddStationModal();
              }}
            >
              <i className="fas fa-plus"></i> Agregar Estación
            </Button>

                </div>
              </div>
            </div>

                    
              </div>
            ) : (
              <p>Cargando datos del cliente...</p>
            )}
      </Modal.Body>
      <Modal.Footer>
        <div className="w-100">
          {/* Botones de acción */}
          <div className="action-buttons d-flex flex-wrap flex-md-nowrap justify-content-around mb-4">
            <Button
              className="btn-outline-primary w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() => window.open(`tel:${selectedClient?.phone || ""}`)}
            >
              <i className="fas fa-phone"></i>
              <span style={{ marginLeft: "8px" }}>Llamar</span>
            </Button>
            <Button
              className="btn-outline-success w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() =>
                window.open(
                  `https://wa.me/${selectedClient?.phone?.replace(/\D/g, "")}`,
                  "_blank"
                )
              }
            >
              <i className="fab fa-whatsapp"></i>
              <span style={{ marginLeft: "8px" }}>WhatsApp</span>
            </Button>
            <Button
              className="btn-outline-dark w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() => window.open(`mailto:${selectedClient?.email || ""}`)}
            >
              <i className="fas fa-envelope"></i>
              <span style={{ marginLeft: "8px" }}>Correo</span>
            </Button>
            <Button
              className="btn-outline-danger w-100 w-md-auto mx-2 mb-2 mb-md-0"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${encodeURIComponent(
                    `${selectedClient?.address || ""}, ${selectedClient?.city || ""}, ${selectedClient?.department || ""}`
                  )}`,
                  "_blank"
                )
              }
            >
              <i className="fas fa-map-marker-alt"></i>
              <span style={{ marginLeft: "8px" }}>Ubicación</span>
            </Button>
          </div>

          {/* Botones inferiores */}
          <div className="d-flex justify-content-between">
            <Button
              className="me-2 w-100"
              variant="success"
              onClick={() => {
                handleShowModal(selectedClient);
                handleCloseDetailsModal();
              }}
            >
              Editar
            </Button>
            <Button
              className="me-2 w-100"
              variant="danger"
              onClick={() => {
                handleShowConfirmation(() => deleteClient(selectedClient.id));
                handleCloseDetailsModal();
              }}
            >
              Eliminar
            </Button>
            <Button
              className="w-100"
              variant="secondary"
              onClick={handleCloseDetailsModal}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>

    {/* Modal de confirmación para llamar o enviar WhatsApp */}
    <Modal show={showActionModal} onHide={handleCloseActionModal}>
      <Modal.Header closeButton>
        <Modal.Title>Selecciona una opción</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>¿Quieres realizar esta acción para el teléfono de la empresa o del contacto?</p>
        <div className="d-flex justify-content-around">
          <Button
            variant="primary"
            onClick={() => {
              if (actionType === "call") {
                window.open(`tel:${selectedClient?.phone || ""}`);
              } else if (actionType === "whatsapp") {
                window.open(`https://wa.me/${selectedClient?.phone?.replace(/\D/g, "")}`, "_blank");
              }
              handleCloseActionModal();
            }}
          >
            Teléfono Empresa
          </Button>
          <Button
            variant="success"
            onClick={() => {
              if (actionType === "call") {
                window.open(`tel:${selectedClient?.contact_phone || ""}`);
              } else if (actionType === "whatsapp") {
                window.open(`https://wa.me/${selectedClient?.contact_phone?.replace(/\D/g, "")}`, "_blank");
              }
              handleCloseActionModal();
            }}
            disabled={!selectedClient?.contact_phone}
          >
            Teléfono Contacto
          </Button>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseActionModal}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>

      {/* Modal de confirmación */}
      <Modal show={showConfirmationModal} onHide={handleCloseConfirmation}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas realizar esta acción?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseConfirmation}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmationCallback) confirmationCallback();
              handleCloseConfirmation();
            }}
          >
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de notificación */}
      <Modal show={showNotificationModal} onHide={handleCloseNotification}>
        <Modal.Header closeButton>
          <Modal.Title>Notificación</Modal.Title>
        </Modal.Header>
        <Modal.Body>{notificationMessage}</Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={handleCloseNotification}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAddStationModal} onHide={() => setShowAddStationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Estación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
          <Form.Group controlId="formStationDescription" className="mb-3">
        <Form.Label>Descripción</Form.Label>
        <Form.Control
          type="text"
          name="description"
          onChange={(e) => setNewStation({ ...newStation, description: e.target.value })}
          required
          style={{ borderColor: newStation.descriptionError ? 'red' : '' }}
        />
      </Form.Group>

      <Form.Group controlId="formStationType" className="mb-3">
        <Form.Label>Tipo</Form.Label>
        <Form.Select
          name="type"
          value={newStation.type}
          onChange={(e) =>
            setNewStation({ ...newStation, type: e.target.value })
          }
        >
          <option value="Control">Control</option>
          <option value="Localización">Localización</option>
          <option value="Jardineria">Jardineria</option>
        </Form.Select>
        </Form.Group>
        <Form.Group controlId="formStationCategory" className="mb-3">
        <Form.Label>Categoría</Form.Label>
        <Form.Select
          name="category"
          value={newStation.category}
          required
          onChange={(e) =>
            setNewStation({ ...newStation, category: e.target.value })
          }
        >
          <option value="">Seleccione una categoría</option>
          <option value="Hogar">Hogar</option>
          <option value="Empresarial">Empresarial</option>
          <option value="Horizontal">Horizontal</option>
          <option value="Jardineria">Jardineria</option>
        </Form.Select>
      </Form.Group>
      <Form.Group controlId="formStationLatitude" className="mb-3">
      <Form.Label>Latitud</Form.Label>
      <Form.Control
        type="text"
        name="latitude"
        value={newStation.latitude}
        onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })}
        required
      />
    </Form.Group>
    <Form.Group controlId="formStationLongitude" className="mb-3">
      <Form.Label>Longitud</Form.Label>
      <Form.Control
        type="text"
        name="longitude"
        value={newStation.longitude}
        onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })}
        required
      />
    </Form.Group>
    <Form.Group controlId="formStationAltitude" className="mb-3">
      <Form.Label>Altitud (Opcional)</Form.Label>
      <Form.Control
        type="text"
        name="altitude"
        value={newStation.altitude}
        onChange={(e) => setNewStation({ ...newStation, altitude: e.target.value })}
      />
    </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowAddStationModal(false)}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleSaveNewStation}>
          Guardar
        </Button>
      </Modal.Footer>
    </Modal>

      <Modal show={showAddMapModal} onHide={handleCloseAddMapModal}>
        <Modal.Header closeButton>
          <Modal.Title>Agregar Mapa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Campo de descripción */}
            <Form.Group controlId="formMapDescription" className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={newMap.description}
                onChange={handleNewMapChange}
                placeholder="Ejemplo: Descripción del mapa..."
                rows={3}
                required
              />
            </Form.Group>

            {/* Campo para cargar imagen */}
            <Form.Group controlId="formMapImage" className="mb-3">
              <Form.Label>Seleccionar Imagen</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setNewMap({ ...newMap, image: URL.createObjectURL(file), imageFile: file });
                  }
                }}
              />
                    </Form.Group>

                    {/* Vista previa de la imagen cargada */}
                    {newMap.image && (
                      <div className="text-center mt-3">
                        <img
                          src={newMap.image}
                          alt="Vista previa del mapa"
                          style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
                        />
                      </div>
                    )}
                  </Form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handleCloseAddMapModal}>
                    Cancelar
                  </Button>
                  <Button variant="success" onClick={handleSaveNewMap}>
                    Guardar
                  </Button>
                </Modal.Footer>
              </Modal>
              <Modal
                show={showImageModal}
                onHide={handleCloseImageModal}
                centered
                dialogClassName="image-modal" /* Clase personalizada para estilos */
              >
                <Modal.Body className="d-flex justify-content-center align-items-center">
                  {selectedImage && (
                    <img
                      src={selectedImage}
                      alt="Vista previa del mapa"
                      style={{ borderRadius: "8px" }}
                    />
                  )}
                </Modal.Body>
              </Modal>
    </div>
  );  
}
export default ClientList;
