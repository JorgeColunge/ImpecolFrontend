import React, { useEffect, useState, useRef } from 'react';
import { useParams,useLocation } from 'react-router-dom';
import { Button, Table, InputGroup, FormControl, Modal, Form } from 'react-bootstrap';
import api from './Api'; // Usa el archivo de API con lógica offline integrada
import { saveRequest, isOffline } from './offlineHandler';
import { initDB, initUsersDB, saveUsers, getUsers } from './indexedDBHandler';
import SignatureCanvas from 'react-signature-canvas';
import "./Inspection.css";
import { ArrowDownSquare, ArrowUpSquare, Eye, PencilSquare, QrCodeScan, XCircle } from 'react-bootstrap-icons';
import  {useUnsavedChanges} from './UnsavedChangesContext'
import QrScannerComponent from './QrScannerComponent';
import moment from 'moment';

function Inspection() {
  const { inspectionId } = useParams();
  const [inspectionData, setInspectionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generalObservations, setGeneralObservations] = useState('');
  const [findingsByType, setFindingsByType] = useState({});
  const [productsByType, setProductsByType] = useState({});
  const [availableProducts, setAvailableProducts] = useState([]);
  const [stations, setStations] = useState([]); // Estado para estaciones
  const [clientStations, setClientStations] = useState({}); // Estado para hallazgos en estaciones
  const [stationModalOpen, setStationModalOpen] = useState(false);
  const [currentStationId, setCurrentStationId] = useState(null);
  const [stationFinding, setStationFinding] = useState({
    purpose: 'Consumo', // Valor predeterminado
    consumptionAmount: 'Nada', // Valor predeterminado
    captureQuantity: '',
    marked: 'Si', // Valor predeterminado
    physicalState: 'Buena', // Valor predeterminado
    damageLocation: '',
    requiresChange: 'No', // Valor predeterminado
    changePriority: 'No', // Valor predeterminado
    description: '', // Nuevo campo
    photo: null,
  });  
  const [stationModalOpenDesinsectacion, setStationModalOpenDesinsectacion] = useState(false);
  const [currentStationIdDesinsectacion, setCurrentStationIdDesinsectacion] = useState(null);
  const [stationFindingDesinsectacion, setStationFindingDesinsectacion] = useState({
    captureQuantity: '',
    physicalState: 'Buena', // Default: Buena
    damageLocation: '',
    requiresChange: 'No', // Default: No
    changePriority: 'No', // Default: No
    description: '',
    photo: null,
  });
  const [collapseStates, setCollapseStates] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [viewStationModalOpen, setViewStationModalOpen] = useState(false);
  const [viewStationData, setViewStationData] = useState({});
  const [stationType, setStationType] = useState(null); // 'Desratización' o 'Desinsectación'
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [techSignaturePreview, setTechSignaturePreview] = useState(null);
  const [clientSignaturePreview, setClientSignaturePreview] = useState(null);
  const [techSignature, setTechSignature] = useState(null);
  const [clientSignature, setClientSignature] = useState(null);
  const [signData, setSignData] = useState({
    name: '',
    id: '',
    position: '',
  });

  const sigCanvasTech = useRef();
  const sigCanvasClient = useRef();
  const location = useLocation();
  const { setHasUnsavedChanges, setUnsavedRoute } = useUnsavedChanges();
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: null, index: null });
  const [searchTermDesratizacion, setSearchTermDesratizacion] = useState('');
  const [searchTermDesinsectacion, setSearchTermDesinsectacion] = useState('');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [currentQrStationType, setCurrentQrStationType] = useState(null);

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 1500); // Cerrar después de 1.5 segundos
  };

  const handleClearTechSignature = () => {
    sigCanvasTech.current.clear();
    setTechSignature(null);
  };

  const handleClearClientSignature = () => {
    sigCanvasClient.current.clear();
    setClientSignature(null);
  };

  const handleSaveSignature = async () => {
    if (sigCanvasTech.current) {
      // Generar la imagen en formato Blob para enviar al backend
      sigCanvasTech.current.getTrimmedCanvas().toBlob((blob) => {
        setTechSignature(blob); // Guardar como Blob
      });
      // Generar la imagen en formato base64 para previsualización
      const dataURL = sigCanvasTech.current.getTrimmedCanvas().toDataURL();
      setTechSignaturePreview(dataURL); // Guardar la previsualización
    }
    if (sigCanvasClient.current) {
      // Generar la imagen en formato Blob para enviar al backend
      sigCanvasClient.current.getTrimmedCanvas().toBlob((blob) => {
        setClientSignature(blob); // Guardar como Blob
      });
      // Generar la imagen en formato base64 para previsualización
      const dataURL = sigCanvasClient.current.getTrimmedCanvas().toDataURL();
      setClientSignaturePreview(dataURL); // Guardar la previsualización
    }
  };
  

  const handleSignModalCancel = () => {
    setSignModalOpen(false);
    setTechSignature(null);
    setClientSignature(null);
    setSignData({ name: "", id: "", position: "" });
  };

  const handleSignModalClose = () => {
    setSignModalOpen(false);
  };
  

  const handleSignDataChange = (field, value) => {
    setSignData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
    // Marcar cambios detectados
    setHasUnsavedChanges(true);
    setUnsavedRoute(location.pathname);
  };

  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        const response = await api.get(`http://localhost:10000/api/inspections/${inspectionId}`);
        setInspectionData(response.data);
  
        // Cargar observaciones generales
        setGeneralObservations(response.data.observations || '');
  
        // Inicializar findingsByType y productsByType
        const initialFindings = response.data.findings?.findingsByType || {};
        const initialProducts = response.data.findings?.productsByType || {};
  
        Object.keys(initialFindings).forEach((type) => {
          initialFindings[type] = initialFindings[type].map((finding) => ({
            ...finding,
            photo: finding.photo ? `http://localhost:10000${finding.photo}` : null,
            photoRelative: finding.photo || null,
            photoBlob: null,
          }));
        });
  
        setFindingsByType(initialFindings);
        setProductsByType(initialProducts);
  
        // Cargar firmas si existen
        const signatures = response.data.findings?.signatures || {};
        if (signatures.technician?.signature) {
          const techSignatureUrl = `http://localhost:10000${signatures.technician.signature}`;
          setTechSignaturePreview(techSignatureUrl);
        }
        if (signatures.client?.signature) {
          const clientSignatureUrl = `http://localhost:10000${signatures.client.signature}`;
          setClientSignaturePreview(clientSignatureUrl);
        }

        // Cargar datos del cliente
        if (signatures.client) {
          setSignData({
            name: signatures.client.name || '',
            id: signatures.client.id || '',
            position: signatures.client.position || '',
          });
        }
  
        // Cargar estaciones
        const initialStationsFindings = response.data.findings?.stationsFindings || [];
        const clientStationsData = {};
        initialStationsFindings.forEach((finding) => {
          clientStationsData[finding.stationId] = {
            ...finding,
            photo: finding.photo ? `http://localhost:10000${finding.photo}` : null,
            photoRelative: finding.photo || null,
            photoBlob: null,
          };
        });
  
        setClientStations(clientStationsData);
  
        // Cargar estaciones relacionadas
        const clientId = response.data.service_id
          ? (await api.get(`http://localhost:10000/api/services/${response.data.service_id}`)).data
              .client_id
          : null;
  
        if (clientId) {
          const stationsResponse = await api.get(
            `http://localhost:10000/api/stations/client/${clientId}`
          );
          setStations(stationsResponse.data);
        }

        // Consultar productos disponibles
        const productsResponse = await api.get(`http://localhost:10000/api/products`);
        console.log("Productos obtenidos desde la API:", productsResponse.data);
        setAvailableProducts(productsResponse.data);
  
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inspection data:', error);
        setLoading(false);
      }
    };
  
    fetchInspectionData();
  }, [inspectionId]); 

  const handleQrScan = (scannedValue) => {
    console.log("Valor recibido del escáner QR:", scannedValue);
    const normalizedValue = scannedValue.toLowerCase();
  
    if (currentQrStationType === "Desratización") {
      setSearchTermDesratizacion(normalizedValue);
      console.log("Estado de búsqueda actualizado (Desratización):", normalizedValue);
    } else if (currentQrStationType === "Desinsectación") {
      setSearchTermDesinsectacion(normalizedValue);
      console.log("Estado de búsqueda actualizado (Desinsectación):", normalizedValue);
    }
  
    setQrScannerOpen(false); // Cierra el modal
  };  
  
  const handleOpenQrScanner = (type) => {
    setCurrentQrStationType(type); // Define el tipo antes de abrir el escáner
    setQrScannerOpen(true); // Abre el modal de escáner QR
  };
    
  useEffect(() => {
    return () => {
      if (stationFinding.photo) {
        URL.revokeObjectURL(stationFinding.photo);
      }
      if (stationFindingDesinsectacion.photo) {
        URL.revokeObjectURL(stationFindingDesinsectacion.photo);
      }
    };
  }, [stationFinding.photo, stationFindingDesinsectacion.photo]);

  useEffect(() => {
    // Detectar si el dispositivo es móvil
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768); // Ancho típico para dispositivos móviles
    };
  
    // Escuchar cambios en el tamaño de la ventana
    window.addEventListener('resize', handleResize);
  
    // Ejecutar al montar el componente
    handleResize();
  
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const detectChanges = () => {
  const changes = {
    generalObservations: generalObservations !== inspectionData?.observations,
    findingsByType: JSON.stringify(findingsByType) !== JSON.stringify(inspectionData?.findings?.findingsByType),
    productsByType: JSON.stringify(productsByType) !== JSON.stringify(inspectionData?.findings?.productsByType),
    stationsFindings: JSON.stringify(clientStations) !== JSON.stringify(
      inspectionData?.findings?.stationsFindings.reduce((acc, finding) => {
        acc[finding.stationId] = finding;
        return acc;
      }, {})
    ),
  };

  console.log('Cambios detectados:', changes);
  return Object.values(changes).some((change) => change); // Retorna true si hay algún cambio
};

const handleSaveChanges = async () => {
  try {
    const formData = new FormData();

    // Información básica
    formData.append("inspectionId", inspectionId);
    formData.append("generalObservations", generalObservations);

    // Procesar findingsByType
    const findingsByTypeProcessed = {};
    Object.keys(findingsByType).forEach((type) => {
      findingsByTypeProcessed[type] = findingsByType[type].map((finding) => ({
        ...finding,
        photo: finding.photoBlob ? null : finding.photoRelative, // Enviar la URL relativa si no hay nueva imagen
      }));
    });

    formData.append("findingsByType", JSON.stringify(findingsByTypeProcessed));
    
    // Procesar productsByType con ID
    const productsByTypeProcessed = {};
    Object.keys(productsByType).forEach((type) => {
      const productData = productsByType[type];
      if (productData) {
        productsByTypeProcessed[type] = {
          id: productData.id || null, // Incluir el ID
          product: productData.product || '',
          dosage: productData.dosage || '',
        };
      }
    });

    formData.append("productsByType", JSON.stringify(productsByTypeProcessed));

    // Procesar stationsFindings
    const stationsFindingsArray = Object.entries(clientStations).map(([stationId, finding]) => ({
      ...finding,
      stationId,
      photo: finding.photoBlob ? null : finding.photoRelative, // Enviar la URL relativa si no hay nueva imagen
    }));

    formData.append("stationsFindings", JSON.stringify(stationsFindingsArray));

    // Ajuste en las firmas: eliminar el prefijo completo si existe
    const removePrefix = (url) => {
      const prefix = "http://localhost:10000";
      return url && url.startsWith(prefix) ? url.replace(prefix, "") : url;
    };

    // Construir el objeto signatures
    const signatures = {
      client: {
        id: signData.id,
        name: signData.name,
        position: signData.position,
        signature: clientSignature instanceof Blob ? null : removePrefix(clientSignaturePreview), // Usar la URL si no hay nueva firma
      },
      technician: {
        name: "Técnico",
        signature: techSignature instanceof Blob ? null : removePrefix(techSignaturePreview), // Usar la URL si no hay nueva firma
      },
    };

    formData.append("signatures", JSON.stringify(signatures));

    // Agregar imágenes como campos separados
    if (techSignature instanceof Blob) {
      formData.append("tech_signature", techSignature, "tech_signature.jpg");
    }
    if (clientSignature instanceof Blob) {
      formData.append("client_signature", clientSignature, "client_signature.jpg");
    }

    // Agregar imágenes de findings
    Object.keys(findingsByType).forEach((type) => {
      findingsByType[type].forEach((finding) => {
        if (finding.photoBlob) {
          formData.append("findingsImages", finding.photoBlob, `${finding.id}.jpg`);
        }
      });
    });

    // Agregar imágenes de stationsFindings
    stationsFindingsArray.forEach((finding) => {
      if (finding.photoBlob) {
        formData.append("stationImages", finding.photoBlob, `${finding.stationId}.jpg`);
      }
    });

    // Enviar datos al backend
    await api.post(`/inspections/${inspectionId}/save`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    showNotification("Cambios guardados exitosamente.");

    // Resetear el estado de cambios no guardados
    setHasUnsavedChanges(false);
    setUnsavedRoute(null); // Opcional: Resetear la ruta de cambios
  } catch (error) {
    console.error("Error guardando los cambios:", error);

    if (error.message.includes("Offline")) {
      showNotification(
        "Cambios guardados localmente. Se sincronizarán automáticamente cuando vuelva la conexión."
      );
    } else {
      showNotification("Hubo un error al guardar los cambios.");
    }
  }
};

const dataURLtoBlob = (dataURL) => {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], { type: mimeString });
};


  const handleStationChange = (stationId, field, value) => {
    setClientStations((prevStations) => ({
      ...prevStations,
      [stationId]: { ...prevStations[stationId], [field]: value },
    }));
  };

  const handleAddFinding = (type) => {
    const newFindingId = Date.now(); // ID único basado en el timestamp
    const newFindingKey = `${type}-${newFindingId}`; // Clave única para el hallazgo
  
    // Actualizar los hallazgos con el nuevo elemento
    setFindingsByType((prevFindings) => ({
      ...prevFindings,
      [type]: [
        ...(prevFindings[type] || []),
        { id: newFindingId, place: '', description: '', photo: null },
      ],
    }));
  
    // Actualizar los estados de colapso para expandir el nuevo hallazgo
    setCollapseStates((prevStates) => ({
      ...prevStates,
      [newFindingKey]: true, // Expandir el nuevo hallazgo
    }));
  };  
  

  const handleFindingChange = (type, index, field, value) => {
    setFindingsByType((prevFindings) => {
      const updatedFindings = [...prevFindings[type]];
      updatedFindings[index] = { ...updatedFindings[index], [field]: value };
      // Marcar cambios detectados
      setHasUnsavedChanges(true);
      setUnsavedRoute(location.pathname);
      return { ...prevFindings, [type]: updatedFindings };
    });
  };

  const handleFindingPhotoChange = (type, index, file) => {
    if (!file || !file.type.startsWith('image/')) {
      showNotification('Seleccione un archivo válido de tipo imagen.');
      return;
    }
  
    const photoURL = URL.createObjectURL(file);
  
    setFindingsByType((prevFindings) => {
      const updatedFindings = [...prevFindings[type]];
      updatedFindings[index] = {
        ...updatedFindings[index],
        photo: photoURL, // Nueva URL para previsualización
        photoBlob: file, // Nuevo archivo seleccionado
      };
      // Marcar cambios detectados
      setHasUnsavedChanges(true);
      setUnsavedRoute(location.pathname);
      return { ...prevFindings, [type]: updatedFindings };
    });
  };    

  const handleProductChange = (type, field, value) => {
    setProductsByType((prevProducts) => {
      const updatedProduct = { ...prevProducts[type] };
  
      if (field === 'product') {
        const selectedProduct = availableProducts.find((product) => product.name === value);
        updatedProduct.product = value;
        updatedProduct.id = selectedProduct ? selectedProduct.id : null; // Agregar el ID del producto
      } else {
        updatedProduct[field] = value;
      }
  
      return {
        ...prevProducts,
        [type]: updatedProduct,
      };
    });
  
    // Marcar cambios detectados
    setHasUnsavedChanges(true);
    setUnsavedRoute(location.pathname);
  };  

  const getFilteredProducts = (type) => {
    if (!availableProducts || !type) {
      console.log("No hay productos disponibles o el tipo de inspección está vacío.");
      return [];
    }
  
    console.log("Filtrando productos para el tipo de inspección:", type);
    console.log("Productos disponibles antes del filtrado:", availableProducts);
  
    return availableProducts.filter((product) => {
      console.log("Evaluando producto:", product);
  
      if (!product.category) {
        console.warn(
          `Producto omitido (${product.name}) porque no tiene categoría definida.`,
          product
        );
        return false; // Omitimos productos sin categoría
      }
  
      try {
        // Limpiar las categorías, eliminar corchetes y dividir en un array
        const cleanedCategory = product.category
          .replace(/[\{\}\[\]"]/g, "") // Elimina `{`, `}`, `[`, `]`, y comillas
          .split(",")
          .map((cat) => cat.trim().toLowerCase()); // Convierte a minúsculas para comparación
  
        console.log(
          `Categorías procesadas del producto (${product.name}):`,
          cleanedCategory
        );
  
        // Verificar si alguna categoría coincide con el tipo de inspección
        const match = cleanedCategory.some((category) => {
          const isMatch = category === type.toLowerCase();
          console.log(
            `Comparando categoría (${category}) con tipo (${type.toLowerCase()}):`,
            isMatch ? "Coincide" : "No coincide"
          );
          return isMatch;
        });
  
        console.log(
          `Resultado del filtrado para el producto (${product.name}):`,
          match ? "Incluido" : "Excluido"
        );
  
        return match;
      } catch (error) {
        console.error(
          `Error al procesar las categorías del producto (${product.name}):`,
          product.category,
          error
        );
        return false; // Omitir producto en caso de error
      }
    });
  };  
  

  const handleOpenStationModal = (stationId) => {
    setCurrentStationId(stationId);
  
    if (clientStations[stationId]) {
      setStationFinding({
        ...clientStations[stationId], // Carga los datos existentes
        photoBlob: null, // Asegúrate de que `photoBlob` esté vacío para nuevas selecciones
      });
    } else {
      // Si no hay hallazgo previo, usa valores predeterminados
      setStationFinding({
        purpose: 'Consumo',
        consumptionAmount: 'Nada',
        captureQuantity: '',
        marked: 'No',
        physicalState: 'Buena',
        damageLocation: '',
        requiresChange: 'No',
        changePriority: 'No',
        description: '',
        photo: null,
        photoBlob: null,
      });
    }
  
    setStationModalOpen(true);
  };
  
  
  const handleCloseStationModal = () => {
    setCurrentStationId(null);
    setStationModalOpen(false);
    setStationFinding({
      purpose: 'Consumo',
      consumptionAmount: 'Nada',
      captureQuantity: '',
      marked: 'No',
      physicalState: 'Buena',
      damageLocation: '',
      requiresChange: 'No',
      changePriority: 'No',
      photo: null,
    });
  };
  
  const handleStationFindingChange = (field, value) => {
    setStationFinding((prevFinding) => {
      const updatedFinding = {
        ...prevFinding,
        [field]: value,
        id: prevFinding.id || Date.now(), // Asegurar que cada hallazgo tenga un id único
      };
      // Marcar cambios detectados
      setHasUnsavedChanges(true);
      setUnsavedRoute(location.pathname);
      console.log(`Hallazgo para estación id asignado: ${updatedFinding.id}`);
      return updatedFinding; // Retornar el nuevo estado
    });
  };
  
  

  const handleStationFindingPhotoChange = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      console.error('No se seleccionó un archivo válido o no es una imagen.');
      showNotification('Seleccione un archivo válido de tipo imagen.');
      return;
    }
  
    // Crear una URL temporal para la previsualización
    const photoURL = URL.createObjectURL(file);
  
    setStationFinding((prevFinding) => {
      // Liberar la URL anterior si existía
      if (prevFinding.photo && prevFinding.photo.startsWith('blob:')) {
        URL.revokeObjectURL(prevFinding.photo);
      }
  
      return {
        ...prevFinding,
        photo: photoURL, // Nueva URL para previsualización
        photoBlob: file, // Nuevo archivo seleccionado (Blob)
      };
    });

    // Marcar cambios detectados
    setHasUnsavedChanges(true);
    setUnsavedRoute(location.pathname);
  
    console.log('Nueva imagen seleccionada:', file);
  };  
  
  const handleSaveStationFinding = () => {
    setClientStations((prevStations) => ({
      ...prevStations,
      [currentStationId]: { ...stationFinding },
    }));
    handleCloseStationModal();
  };
  
  const handleSaveStationFindingDesinsectacion = () => {
    setClientStations((prevStations) => ({
      ...prevStations,
      [currentStationIdDesinsectacion]: { ...stationFindingDesinsectacion },
    }));
    handleCloseStationModalDesinsectacion();
  };
   

  const handleOpenStationModalDesinsectacion = (stationId) => {
    setCurrentStationIdDesinsectacion(stationId);
  
    if (clientStations[stationId]) {
      setStationFindingDesinsectacion({
        ...clientStations[stationId], // Carga los datos existentes
        photoBlob: null, // Asegúrate de que `photoBlob` esté vacío para nuevas selecciones
      });
    } else {
      // Si no hay hallazgo previo, usa valores predeterminados
      setStationFindingDesinsectacion({
        captureQuantity: '',
        physicalState: 'Buena',
        damageLocation: '',
        requiresChange: 'No',
        changePriority: 'No',
        description: '',
        photo: null,
        photoBlob: null,
      });
    }
  
    setStationModalOpenDesinsectacion(true);
  };
  
  
  const handleCloseStationModalDesinsectacion = () => {
    setCurrentStationIdDesinsectacion(null);
    setStationModalOpenDesinsectacion(false);
    setStationFindingDesinsectacion({
      captureQuantity: '',
      physicalState: 'Buena',
      damageLocation: '',
      requiresChange: 'No',
      changePriority: 'No',
      description: '',
      photo: null,
    });
  };
  
  const handleStationFindingChangeDesinsectacion = (field, value) => {
    setStationFindingDesinsectacion((prevFinding) => {
      const updatedFinding = {
        ...prevFinding,
        [field]: value,
        id: prevFinding.id || Date.now(), // Generar un id único si no existe
      };
      // Marcar cambios detectados
      setHasUnsavedChanges(true);
      setUnsavedRoute(location.pathname);
      console.log(`Hallazgo de desinsectación id asignado: ${updatedFinding.id}`);
      return updatedFinding; // Retornar el estado actualizado
    });
  };
  
  
  const handleStationFindingPhotoChangeDesinsectacion = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      console.error("No se seleccionó un archivo válido o no es una imagen.");
      showNotification("Seleccione un archivo válido de tipo imagen.");
      return;
    }
  
    const photoURL = URL.createObjectURL(file);
  
    setStationFindingDesinsectacion((prevFinding) => ({
      ...prevFinding,
      photo: photoURL, // URL para previsualización
      photoBlob: file, // Blob para guardar offline o enviar online
    }));
    // Marcar cambios detectados
    setHasUnsavedChanges(true);
    setUnsavedRoute(location.pathname);
  };

  const saveStationFindingOffline = async (stationId, finding) => {
    const db = await initDB();
    const tx = db.transaction("stationFindings", "readwrite");
    const store = tx.objectStore("stationFindings");
  
    await store.put({
      id: stationId,
      ...finding,
      photoBlob: finding.photoBlob ? new Blob([finding.photoBlob], { type: "image/jpeg" }) : null,
    });
  
    await tx.done;
    console.log("Hallazgo guardado offline para estación:", stationId);
  };  

  const syncStationFindings = async () => {
    const db = await initDB();
    const tx = db.transaction("stationFindings", "readonly");
    const store = tx.objectStore("stationFindings");
    const findings = await store.getAll();
  
    for (const finding of findings) {
      const formData = new FormData();
      formData.append("stationId", finding.id);
      formData.append("description", finding.description || "");
      if (finding.photoBlob) {
        formData.append("photo", finding.photoBlob, `${finding.id}.jpg`);
      }
  
      try {
        await api.post("/station/findings", formData);
        console.log(`Hallazgo sincronizado para estación: ${finding.id}`);
      } catch (error) {
        console.error(`Error al sincronizar hallazgo para estación ${finding.id}:`, error);
      }
    }
  }; 

  // Manejador de estado de colapso
const handleCollapseToggle = (currentKey) => {
  setCollapseStates({ [currentKey]: !collapseStates[currentKey] }); // Solo permite un hallazgo expandido
};

const handleViewStation = (stationId) => {
  setViewStationData(clientStations[stationId] || {});
  setViewStationModalOpen(true);
};

const handleViewStationDesratizacion = (stationId) => {
  setViewStationData(clientStations[stationId] || {});
  setStationType('Desratización');
  setViewStationModalOpen(true);
};

const handleViewStationDesinsectacion = (stationId) => {
  setViewStationData(clientStations[stationId] || {});
  setStationType('Desinsectación');
  setViewStationModalOpen(true);
};

const handleShowConfirmDelete = (type, index) => {
  setConfirmDelete({ show: true, type, index });
};

const handleCloseConfirmDelete = () => {
  setConfirmDelete({ show: false, type: null, index: null });
};

const handleDeleteFinding = () => {
  const { type, index } = confirmDelete;

  if (!type || index === null || index === undefined) {
    console.error(`El tipo ${type} o el índice ${index} no son válidos.`);
    handleCloseConfirmDelete();
    return;
  }

  setFindingsByType((prevFindings) => {
    const updatedFindings = { ...prevFindings };
    updatedFindings[type].splice(index, 1);

    if (updatedFindings[type].length === 0) {
      delete updatedFindings[type];
    }

    return updatedFindings;
  });

  handleCloseConfirmDelete();
};

  if (loading) return <div>Cargando detalles de la inspección...</div>;

  if (!inspectionData)
    return (
      <div className="alert alert-danger" role="alert">
        No se encontró información de la inspección.
      </div>
    );

  const { inspection_type, inspection_sub_type, date, time, service_id } = inspectionData;

  const parsedInspectionTypes = inspection_type
    ? inspection_type.split(",").map((type) => type.trim())
    : [];

  return (
    <div className="container mt-4">

      {/* Sección General */}
      <div className="card border-success mb-3" style={{ minHeight: 0, height: 'auto' }}>
        <div className="card-header">General</div>
        <div className="card-body">
          <p><strong>Inspección:</strong> {inspectionId}</p>
          <p><strong>Fecha:</strong> {moment(date).format('DD/MM/YYYY')}</p>
          <p><strong>Hora:</strong> {time}</p>
          <p><strong>Servicio:</strong> {service_id}</p>
          <div className="mt-3">
          <textarea
            id="generalObservations"
            className="form-control"
            rows="4"
            value={generalObservations}
            onChange={(e) => {
              const newValue = e.target.value;
              setGeneralObservations(newValue);

              // Detectar cambios en las observaciones generales
              if (newValue !== (inspectionData?.observations || '')) {
                setHasUnsavedChanges(true);
                setUnsavedRoute(location.pathname);
              }
            }}
            placeholder="Ingrese sus observaciones generales aquí"
            disabled={techSignaturePreview && clientSignaturePreview}
          ></textarea>
          </div>
        </div>
      </div>

      {/* Secciones por Tipo de Inspección */}
      {parsedInspectionTypes.map((type, index) => (
        <div className="card border-success mb-3" key={index} >
          <div className="card-header">{type}</div>
          <div className="card-body">

            {type === 'Desratización' && stations.length > 0 && (
              <div className="mt-1">
                <h6>Hallazgos en Estaciones</h6>
                <div className="mb-3 d-flex">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Buscar estación por descripción"
                    value={searchTermDesratizacion}
                    onChange={(e) => setSearchTermDesratizacion(e.target.value)}
                  />
                  <QrCodeScan
                    size={40}
                    className="btn p-0 mx-4"
                    onClick={() => handleOpenQrScanner("Desratización")}
                  />
                </div>
                <div className="table-responsive mt-3">
                  {isMobile ? (
                    // Vista móvil con colapso
                    stations
                      .filter((station) => {
                        // Validar primero que la categoría sea "Roedores"
                        if (station.category !== "Roedores") {
                          return false;
                        }

                        // Normalizamos el término de búsqueda
                        const search = searchTermDesratizacion.trim().toLowerCase();

                        // Verificamos si el término de búsqueda tiene el formato "station-<id>"
                        const stationPrefix = "station-";
                        const isStationSearch = search.startsWith(stationPrefix);

                        // Búsqueda por ID exacto
                        if (isStationSearch) {
                          const stationId = Number(search.replace(stationPrefix, ""));
                          return !isNaN(stationId) && station.id === stationId;
                        }

                        // Búsqueda general en nombre y descripción
                        const stationName = station.name ? station.name.toLowerCase() : "";
                        const stationDescription = station.description ? station.description.toLowerCase() : "";
                        return stationName.includes(search) || stationDescription.includes(search);
                      })
                      .map((station) => {
                        const currentKey = `station-${station.id}`;
                        return (
                          <div
                            key={station.id}
                            className="finding-item border mb-3 p-2"
                            style={{ borderRadius: '5px', backgroundColor: '#f8f9fa' }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{station.name || `Estación ${station.description}`}</strong>
                              <div
                                className="icon-toggle"
                                onClick={() => handleCollapseToggle(currentKey)}
                                style={{ cursor: 'pointer' }}
                              >
                                {collapseStates[currentKey] ? (
                                  <ArrowUpSquare title="Ocultar" />
                                ) : (
                                  <ArrowDownSquare title="Expandir" />
                                )}
                              </div>
                            </div>
                            <div
                              className={`finding-details ${
                                collapseStates[currentKey] ? 'd-block' : 'd-none'
                              } mt-2`}
                            >
                             {clientStations[station.id] ? (
                      <>
                        <p><strong>Finalidad:</strong> {clientStations[station.id].purpose || '-'}</p>

                        {clientStations[station.id].purpose === 'Consumo' && (
                          <p><strong>Cantidad Consumida:</strong> {clientStations[station.id].consumptionAmount || '-'}</p>
                        )}

                        {clientStations[station.id].purpose === 'Captura' && (
                          <p><strong>Cantidad Capturada:</strong> {clientStations[station.id].captureQuantity || '-'}</p>
                        )}

                        <p><strong>Estado Físico:</strong> {clientStations[station.id].physicalState || '-'}</p>
                        {clientStations[station.id].physicalState === 'Dañada' && (
                          <>
                            <p><strong>Lugar del Daño:</strong> {clientStations[station.id].damageLocation || '-'}</p>
                            <p><strong>Requiere Cambio:</strong> {clientStations[station.id].requiresChange || '-'}</p>
                            {clientStations[station.id].requiresChange === 'Si' && (
                              <p><strong>Prioridad de Cambio:</strong> {clientStations[station.id].changePriority || '-'}</p>
                            )}
                          </>
                        )}
                        <p><strong>Descripción:</strong> {clientStations[station.id].description || '-'}</p>
                        <div className="mb-3">
                          {clientStations[station.id].photo ? (
                            <img
                              src={clientStations[station.id].photo}
                              alt="Foto"
                              style={{ width: '150px', objectFit: 'cover' }}
                            />
                          ) : (
                            <span>Sin Foto</span>
                          )}
                        </div>
                        <button
                          className="btn btn-outline-success"
                          onClick={() => handleOpenStationModal(station.id)}
                          disabled={techSignaturePreview && clientSignaturePreview}
                        >
                          Editar
                        </button>
                      </>
                  ) : (
                    <>
                      <p>Sin hallazgo reportado</p>
                      <button
                        className="btn btn-outline-success"
                        onClick={() => handleOpenStationModalDesinsectacion(station.id)}
                        disabled={techSignaturePreview && clientSignaturePreview}
                      >
                        +
                      </button>
                    </>
                  )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    // Vista de tabla para tablet y computadora
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Estación</th>
                          <th>Finalidad</th>
                          <th>Estado Físico</th>
                          <th>Descripción</th>
                          <th>Foto</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                      {stations.filter((station) => {
  console.log("Evaluando estación:", station);

  // Verificar categoría
  if (station.category !== "Roedores") {
    console.log(`Estación ${station.name || `ID: ${station.id}`} excluida por categoría:`, station.category);
    return false;
  }

  // Normalizamos el término de búsqueda
  const search = searchTermDesratizacion.trim().toLowerCase();
  console.log("Término de búsqueda utilizado:", search); // Log del término de búsqueda

  const stationPrefix = "station-";
  const isStationSearch = search.startsWith(stationPrefix);

  // Búsqueda por ID exacto usando el prefijo
  if (isStationSearch) {
    const stationId = Number(search.replace(stationPrefix, ""));
    console.log(`Buscando estación con ID ${stationId} en estación con ID:`, station.id);
    const match = !isNaN(stationId) && station.id === stationId;
    console.log(`Resultado de búsqueda exacta para estación ${station.id}:`, match ? "Coincide" : "No coincide");
    return match;
  }

  // Búsqueda general en nombre o descripción
  const stationName = station.name ? station.name.toLowerCase() : "";
  const stationDescription = station.description ? station.description.toLowerCase() : "";
  const matches = stationName.includes(search) || stationDescription.includes(search);

  console.log(`Resultado del filtro general para estación ${station.name || `ID: ${station.id}`}:`, matches ? "Incluida" : "Excluida");
  return matches;
})
                          .map((station) => (
                            <tr key={station.id}>
                              <td className='align-middle'>{station.name || `Estación ${station.description}`}</td>
                              {clientStations[station.id] ? (
                              <>
                                <td className='align-middle'>{clientStations[station.id].purpose || '-'}</td>
                                <td className='align-middle'>{clientStations[station.id].physicalState || '-'}</td>
                                <td className='align-middle'>{clientStations[station.id].description || '-'}</td>
                                <td className='align-middle mx-1 px-1'>
                                  {clientStations[station.id].photo ? (
                                    <img
                                      src={clientStations[station.id].photo}
                                      alt="Foto"
                                      style={{ width: '250px', objectFit: 'cover', margin: "0px", padding: "0px" }}
                                    />
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className='align-middle'>
                                {!isMobile && (
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => handleViewStationDesratizacion(station.id)}
                                    style={{ border: "none", background: "none" }}
                                    >
                                    <Eye
                                    className='mx-2'
                                      size={"25px"}
                                      color='blue'
                                      type='button'
                                    />
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={techSignaturePreview && clientSignaturePreview} // Bloquear si ya está firmado
                                    style={{ border: "none", background: "none" }} // Estilo para eliminar apariencia de botón
                                  >
                                    <PencilSquare
                                      className="mx-2"
                                      size={"20px"}
                                      color={techSignaturePreview && clientSignaturePreview ? "gray" : "green"} // Cambiar color si está bloqueado
                                      type="button"
                                      title={techSignaturePreview && clientSignaturePreview ? "Inspección firmada, edición bloqueada" : "Editar"}
                                    />
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td colSpan="4">Sin hallazgo reportado</td>
                                <td>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={techSignaturePreview && clientSignaturePreview}
                                  >
                                    +
                                  </button>
                                </td>
                              </>
                            )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}


            {type === 'Desinsectación' && stations.length > 0 && (
              <div className="mt-1">
                <h6>Hallazgos en Estaciones</h6>
                <div className="mb-3 d-flex">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar estación por descripción"
                    value={searchTermDesinsectacion}
                    onChange={(e) => setSearchTermDesinsectacion(e.target.value)}
                  />
                  <QrCodeScan
                    size={40}
                    className="btn p-0 mx-4"
                    onClick={() => handleOpenQrScanner("Desinsectación")}
                  />
                </div>
                <div className="table-responsive mt-3">
                  {isMobile ? (
                    // Vista móvil con colapso
                    stations
                      .filter((station) => {
                        // Validar primero que la categoría sea "Aéreas"
                        if (station.category !== "Aéreas") {
                          return false;
                        }

                        // Normalizamos el término de búsqueda
                        const search = searchTermDesinsectacion.trim().toLowerCase();

                        // Verificamos si el término de búsqueda tiene el formato "station-<id>"
                        const stationPrefix = "station-";
                        const isStationSearch = search.startsWith(stationPrefix);

                        // Búsqueda por ID exacto
                        if (isStationSearch) {
                          const stationId = Number(search.replace(stationPrefix, ""));
                          return !isNaN(stationId) && station.id === stationId;
                        }

                        // Búsqueda general en nombre y descripción
                        const stationName = station.name ? station.name.toLowerCase() : "";
                        const stationDescription = station.description ? station.description.toLowerCase() : "";
                        return stationName.includes(search) || stationDescription.includes(search);
                      })
                      .map((station) => {
                        const currentKey = `station-desinsectacion-${station.id}`;
                        return (
                          <div
                            key={station.id}
                            className="finding-item border mb-3 p-2"
                            style={{ borderRadius: '5px', backgroundColor: '#f8f9fa' }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{station.name || `Estación ${station.description}`}</strong>
                              <div
                                className="icon-toggle"
                                onClick={() => handleCollapseToggle(currentKey)}
                                style={{ cursor: 'pointer' }}
                              >
                                {collapseStates[currentKey] ? (
                                  <ArrowUpSquare title="Ocultar" />
                                ) : (
                                  <ArrowDownSquare title="Expandir" />
                                )}
                              </div>
                            </div>
                            <div
                              className={`finding-details ${
                                collapseStates[currentKey] ? 'd-block' : 'd-none'
                              } mt-2`}
                            >
                              {clientStations[station.id] ? (
                                <>
                                  <p><strong>Capturas:</strong> {clientStations[station.id].captureQuantity || '-'}</p>
                                  <p><strong>Estado Físico:</strong> {clientStations[station.id].physicalState || '-'}</p>
                                  <p><strong>Descripción:</strong> {clientStations[station.id].description || '-'}</p>
                                  <div className="mb-3">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{ width: '150px', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <span>Sin Foto</span>
                                    )}
                                  </div>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModalDesinsectacion(station.id)}
                                    disabled={techSignaturePreview && clientSignaturePreview}
                                  >
                                    Editar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p>Sin hallazgo reportado</p>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModalDesinsectacion(station.id)}
                                    disabled={techSignaturePreview && clientSignaturePreview}
                                  >
                                    +
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    // Vista de tabla para tablet y computadora
                    <table className="table table-bordered">
                      <thead>
                        <tr>
                          <th>Estación</th>
                          <th>Cantidad de Capturas</th>
                          <th>Estado Físico</th>
                          <th>Descripción</th>
                          <th>Foto</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stations
                          .filter((station) => {
                            const search = searchTermDesinsectacion.trim().toLowerCase(); // Normalizamos el término de búsqueda
                            const stationPrefix = "station-"; // Prefijo esperado para búsqueda por ID
                            const isStationSearch = search.startsWith(stationPrefix);

                            // Verificar primero que la categoría sea "Aéreas"
                            if (station.category !== "Aéreas") {
                              return false;
                            }

                            // Búsqueda por ID exacto
                            if (isStationSearch) {
                              const stationId = Number(search.replace(stationPrefix, ""));
                              return !isNaN(stationId) && station.id === stationId;
                            }

                            // Búsqueda general en nombre, descripción o ID
                            const stationName = station.name ? station.name.toLowerCase() : "";
                            const stationDescription = station.description ? station.description.toLowerCase() : "";
                            const stationId = station.id ? station.id.toString().toLowerCase() : "";

                            return (
                              stationName.includes(search) ||
                              stationDescription.includes(search) ||
                              stationId.includes(search)
                            );
                          })
                          .map((station) => (
                            <tr key={station.id}>
                              <td className='align-middle'>{station.name || `Estación ${station.description}`}</td>
                              {clientStations[station.id] ? (
                                <>
                                  <td className='align-middle'>{clientStations[station.id].captureQuantity || '-'}</td>
                                  <td className='align-middle'>{clientStations[station.id].physicalState || '-'}</td>
                                  <td className='align-middle'>{clientStations[station.id].description || '-'}</td>
                                  <td className='align-middle'>
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{ width: '250px', objectFit: 'cover', margin: "0px", padding: "0px" }}
                                      />
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                  <td className='align-middle'>
                                  {!isMobile && (
                                    <button
                                      className="btn btn-link p-0"
                                      onClick={() => handleViewStationDesinsectacion(station.id)}
                                      style={{ border: "none", background: "none" }}
                                    >
                                      <Eye
                                      className='mx-2'
                                        size={"25px"}
                                        color='blue'
                                        type='button'
                                      />
                                    </button>
                                  )}
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={techSignaturePreview && clientSignaturePreview}
                                    style={{ border: "none", background: "none" }}
                                  >
                                    <PencilSquare
                                    className='mx-2'
                                      size={"20px"}
                                      color='green'
                                      type='button'
                                      onClick={() => handleOpenStationModalDesinsectacion(station.id)}
                                      disabled={techSignaturePreview && clientSignaturePreview}
                                    />
                                  </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td colSpan="4">Sin hallazgo reportado</td>
                                  <td>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => handleOpenStationModalDesinsectacion(station.id)}
                                      disabled={techSignaturePreview && clientSignaturePreview}
                                    >
                                      +
                                    </button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Hallazgos */}
            <hr></hr>
            <h6 className='mt-2'>Hallazgos</h6>
            <div className="table-responsive findings-container">
            {(findingsByType[type] || []).map((finding, idx) => {
              const currentKey = `${type}-${finding.id}`; // Usar el ID único como clave
              const findingTitle = finding.place && finding.place.trim() !== '' 
                ? `Hallazgo ${finding.place}` 
                : `Hallazgo ${idx + 1}`; // Mostrar 'Hallazgo' seguido del índice si 'place' está vacío

              return (
                <div key={currentKey} className="finding-item mb-3 mx-1">
                  {/* Para dispositivos móviles: función de colapso */}
                  {isMobile ? (
                    <>
                      <div className="d-flex justify-content-between align-items-center" >
                        <strong>{findingTitle}</strong>
                        <div
                          className="icon-toggle"
                          onClick={() =>
                            setCollapseStates({ [currentKey]: !collapseStates[currentKey] })
                          }
                          style={{ cursor: "pointer", display: "inline-block" }}
                        >
                          {collapseStates[currentKey] ? (
                            <ArrowUpSquare title="Ocultar" />
                          ) : (
                            <ArrowDownSquare title="Expandir" />
                          )}
                        </div>
                      </div>

                      <div
                        className={`finding-details ${
                          collapseStates[currentKey] ? "d-block" : "d-none"
                        }`} 
                      >
                        <div className="row mt-3" style={{ minHeight: 0, height: 'auto' }}>
                          <div className="col-md-2" >
                            <label htmlFor={`place-${type}-${idx}`} className="form-label">
                              Lugar
                            </label>
                            <input
                              id={`place-${type}-${idx}`}
                              type="text"
                              className="form-control table-input"
                              value={finding.place}
                              onChange={(e) =>
                                handleFindingChange(type, idx, "place", e.target.value)
                              }
                              placeholder="Lugar"
                              disabled={techSignaturePreview && clientSignaturePreview}
                            />
                          </div>
                          <div className="col-md-8">
                            <label
                              htmlFor={`description-${type}-${idx}`}
                              className="form-label"
                            >
                              Descripción
                            </label>
                            <textarea
                              id={`description-${type}-${idx}`}
                              className="form-control table-textarea"
                              rows="2"
                              value={finding.description}
                              onChange={(e) =>
                                handleFindingChange(type, idx, "description", e.target.value)
                              }
                              placeholder="Descripción"
                              disabled={techSignaturePreview && clientSignaturePreview}
                            ></textarea>
                          </div>
                          <div className="col-md-2">
                            <label className="form-label">Foto</label>
                            <div className="image-upload-container">
                              {finding.photo ? (
                                <img
                                  src={finding.photo}
                                  alt={`Preview ${idx}`}
                                  className="image-preview"
                                />
                              ) : (
                                <div className="drag-drop-area">
                                  <span>Arrastra o selecciona una imagen</span>
                                </div>
                              )}
                              <input
                                type="file"
                                className="image-input"
                                disabled={techSignaturePreview && clientSignaturePreview}
                                onChange={(e) =>
                                  handleFindingPhotoChange(type, idx, e.target.files[0])
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Para tablet y computadoras: mostrar todo expandido
                    <div className="finding-details d-block">
                      <div className="col-md-2 mt-0 mb-0 ms-auto text-end">
                      <XCircle
                        size={"20px"}
                        color={techSignaturePreview && clientSignaturePreview ? "gray" : "red"} // Cambiar color si está bloqueado
                        onClick={() => {
                          if (techSignaturePreview && clientSignaturePreview) {
                            return;
                          }
                          handleShowConfirmDelete(type, idx);
                        }}
                        style={{
                          cursor: techSignaturePreview && clientSignaturePreview ? "not-allowed" : "pointer", // Cambiar cursor si está bloqueado
                        }}
                        title={
                          techSignaturePreview && clientSignaturePreview
                            ? "Inspección firmada, acción bloqueada"
                            : "Eliminar hallazgo"
                        }
                      />
                      </div>
                      <div className="row mt-3" style={{ minHeight: 0, height: 'auto' }}>
                        <div className="col-md-2">
                          <label htmlFor={`place-${type}-${idx}`} className="form-label">
                            Lugar
                          </label>
                          <input
                            id={`place-${type}-${idx}`}
                            type="text"
                            className="form-control table-input"
                            value={finding.place}
                            onChange={(e) =>
                              handleFindingChange(type, idx, "place", e.target.value)
                            }
                            placeholder="Lugar"
                            disabled={techSignaturePreview && clientSignaturePreview}
                          />
                        </div>
                        <div className="col-md-8">
                          <label
                            htmlFor={`description-${type}-${idx}`}
                            className="form-label"
                          >
                            Descripción
                          </label>
                          <textarea
                            id={`description-${type}-${idx}`}
                            className="form-control table-textarea"
                            rows="2"
                            value={finding.description}
                            onChange={(e) =>
                              handleFindingChange(type, idx, "description", e.target.value)
                            }
                            placeholder="Descripción"
                            disabled={techSignaturePreview && clientSignaturePreview}
                          ></textarea>
                        </div>
                        <div className="col-md-2">
                          <label className="form-label">Foto</label>
                          <div className="image-upload-container">
                            {finding.photo ? (
                              <img
                                src={finding.photo}
                                alt={`Preview ${idx}`}
                                className="image-preview"
                              />
                            ) : (
                              <div className="drag-drop-area">
                                <span>Arrastra o selecciona una imagen</span>
                              </div>
                            )}
                            <input
                              type="file"
                              className="image-input"
                              disabled={techSignaturePreview && clientSignaturePreview}
                              onChange={(e) =>
                                handleFindingPhotoChange(type, idx, e.target.files[0])
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

            <button
              className="btn btn-outline-success mb-3"
              onClick={() => handleAddFinding(type)}
              disabled={techSignaturePreview && clientSignaturePreview}
            >
              + Agregar Hallazgo
            </button>

            {/* Producto */}
            <hr></hr>
            <h6 className='mt-2'>Producto</h6>
            <div className="row" style={{ minHeight: 0, height: 'auto' }}>
              <div className="col-md-6 mb-3">
                <select
                  id={`product-${type}`}
                  className="form-select"
                  value={productsByType[type]?.product || ''}
                  onChange={(e) => handleProductChange(type, 'product', e.target.value)}
                  disabled={techSignaturePreview && clientSignaturePreview}
                >
                  <option value="">Seleccione un producto</option>
                  {getFilteredProducts(type).map((product) => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <input
                  id={`dosage-${type}`}
                  type="number"
                  className="form-control"
                  value={productsByType[type]?.dosage || ''}
                  onChange={(e) => handleProductChange(type, 'dosage', e.target.value)}
                  placeholder="Ingrese la dosificación en gr/ml"
                  disabled={techSignaturePreview && clientSignaturePreview}
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Sección de Firma */}
      <div className="card border-success mt-4">
        <div className="card-header">Firmas</div>
        <div className="card-body">
          {/* Mostrar solo el botón si no hay firmas */}
          {!techSignaturePreview || !clientSignaturePreview ? (
            <div className="text-center">
              <button className="btn btn-outline-success" onClick={() => setSignModalOpen(true)}>
                Firmar
              </button>
            </div>
          ) : (
            <>
              {/* Mostrar la información completa si hay firmas */}
              {/* Firma del Técnico */}
              <div className="mb-4 text-center">
                <h5>Firma del Técnico</h5>
                <img
                  src={techSignaturePreview}
                  alt="Firma del Técnico"
                  style={{ width: isMobile ? 280 : 700, height: 200, objectFit: 'contain', border: '1px solid #ddd' }}
                />
              </div>

              {/* Firma del Cliente */}
              <div className="mb-4 text-center">
                <h5>Firma del Cliente</h5>
                <img
                  src={clientSignaturePreview}
                  alt="Firma del Cliente"
                  style={{ width: isMobile ? 280 : 700, height: 200, objectFit: 'contain', border: '1px solid #ddd' }}
                />
              </div>

              {/* Datos del Cliente */}
              <div className="mt-4">
                <h5>Datos del Cliente</h5>
                <p><strong>Nombre:</strong> {signData.name || 'No registrado'}</p>
                <p><strong>Cédula:</strong> {signData.id || 'No registrada'}</p>
                <p><strong>Cargo:</strong> {signData.position || 'No registrado'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Botón para guardar cambios y firmar */}
      <div className="text-end mt-4">
        <button className="btn btn-success me-2" onClick={handleSaveChanges}>
          Guardar Cambios
        </button>
      </div>

      <Modal show={stationModalOpen} onHide={handleCloseStationModal} size="lg">
        <Modal.Header closeButton>
            <Modal.Title>Agregar Hallazgo para la Estación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div className="mb-3">
            <label className="form-label">Finalidad</label>
            <select
                className="form-select"
                value={stationFinding.purpose}
                onChange={(e) => handleStationFindingChange('purpose', e.target.value)}
            >
                <option value="Consumo">Consumo</option>
                <option value="Captura">Captura</option>
            </select>
            </div>
            {stationFinding.purpose === 'Consumo' && (
            <div className="mb-3">
                <label className="form-label">Cantidad de Consumo</label>
                <select
                className="form-select"
                value={stationFinding.consumptionAmount}
                onChange={(e) => handleStationFindingChange('consumptionAmount', e.target.value)}
                >
                <option value="Nada">Nada</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="Todo">Todo</option>
                </select>
            </div>
            )}
            {stationFinding.purpose === 'Captura' && (
            <div className="mb-3">
                <label className="form-label">Cantidad de Capturas</label>
                <input
                type="number"
                className="form-control"
                value={stationFinding.captureQuantity}
                onChange={(e) => handleStationFindingChange('captureQuantity', e.target.value)}
                />
            </div>
            )}
            <div className="mb-3">
            <label className="form-label">Señalizada</label>
            <select
                className="form-select"
                value={stationFinding.marked}
                onChange={(e) => handleStationFindingChange('marked', e.target.value)}
            >
                <option value="Si">Si</option>
                <option value="No">No</option>
            </select>
            </div>
            <div className="mb-3">
            <label className="form-label">Estado Físico</label>
            <select
                className="form-select"
                value={stationFinding.physicalState}
                onChange={(e) => handleStationFindingChange('physicalState', e.target.value)}
            >
                <option value="Buena">Buena</option>
                <option value="Dañada">Dañada</option>
                <option value="Faltante">Faltante</option>
            </select>
            </div>
            {stationFinding.physicalState === 'Dañada' && (
            <>
                <div className="mb-3">
                <label className="form-label">Lugar del Daño</label>
                <select
                    className="form-select"
                    value={stationFinding.damageLocation}
                    onChange={(e) => handleStationFindingChange('damageLocation', e.target.value)}
                >
                    <option value="Cuerpo">Cuerpo</option>
                    <option value="Tapa">Tapa</option>
                    <option value="Sticker">Sticker</option>
                    <option value="Tablero">Tablero</option>
                </select>
                </div>
                <div className="mb-3">
                <label className="form-label">Requiere Cambio</label>
                <select
                    className="form-select"
                    value={stationFinding.requiresChange}
                    onChange={(e) => handleStationFindingChange('requiresChange', e.target.value)}
                >
                    <option value="Si">Si</option>
                    <option value="No">No</option>
                </select>
                </div>
                {stationFinding.requiresChange === 'Si' && (
                <div className="mb-3">
                    <label className="form-label">Prioridad de Cambio</label>
                    <select
                    className="form-select"
                    value={stationFinding.changePriority}
                    onChange={(e) => handleStationFindingChange('changePriority', e.target.value)}
                    >
                    <option value="Si">Si</option>
                    <option value="No">No</option>
                    </select>
                </div>
                )}
            </>
            )}
            <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
                className="form-control"
                rows="3"
                value={stationFinding.description || ''}
                
                onChange={(e) => handleStationFindingChange('description', e.target.value)}
                placeholder="Ingrese una descripción del hallazgo"
                disabled={techSignaturePreview && clientSignaturePreview}
            ></textarea>
            </div>
            <div className="mb-3">
            <label className="form-label">Fotografía</label>
            <div className="image-upload-container">
              {stationFinding.photo ? (
                <img
                  src={stationFinding.photo}
                  alt="Preview"
                  className="image-preview"
                />
              ) : (
                <div className="drag-drop-area">
                  <span>Arrastra o selecciona una imagen</span>
                </div>
              )}
              <input
                type="file"
                className="image-input"
                disabled={techSignaturePreview && clientSignaturePreview}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleStationFindingPhotoChange(file); // Se mantiene la lógica original
                  }
                }}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
            <button className="btn btn-secondary" onClick={handleCloseStationModal}>
            Cancelar
            </button>
            <button className="btn btn-success" onClick={handleSaveStationFinding}>
            Guardar Hallazgo
            </button>
        </Modal.Footer>
        </Modal>

        <Modal show={stationModalOpenDesinsectacion} onHide={handleCloseStationModalDesinsectacion} size="lg">
        <Modal.Header closeButton>
            <Modal.Title>Agregar Hallazgo para la Estación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <div className="mb-3">
            <label className="form-label">Cantidad de Capturas</label>
            <input
                type="number"
                className="form-control"
                value={stationFindingDesinsectacion.captureQuantity}
                onChange={(e) => handleStationFindingChangeDesinsectacion('captureQuantity', e.target.value)}
                placeholder="Ingrese la cantidad de capturas"
            />
            </div>
            <div className="mb-3">
            <label className="form-label">Estado Físico</label>
            <select
                className="form-select"
                value={stationFindingDesinsectacion.physicalState}
                onChange={(e) => handleStationFindingChangeDesinsectacion('physicalState', e.target.value)}
            >
                <option value="Buena">Buena</option>
                <option value="Dañada">Dañada</option>
                <option value="Faltante">Faltante</option>
            </select>
            </div>
            {stationFindingDesinsectacion.physicalState === 'Dañada' && (
            <>
                <div className="mb-3">
                <label className="form-label">Lugar del Daño</label>
                <select
                    className="form-select"
                    value={stationFindingDesinsectacion.damageLocation}
                    onChange={(e) => handleStationFindingChangeDesinsectacion('damageLocation', e.target.value)}
                >
                    <option value="Marco">Marco</option>
                    <option value="Estacas">Estacas</option>
                    <option value="Lamina">Lámina</option>
                </select>
                </div>
                <div className="mb-3">
                <label className="form-label">Requiere Cambio</label>
                <select
                    className="form-select"
                    value={stationFindingDesinsectacion.requiresChange}
                    onChange={(e) => handleStationFindingChangeDesinsectacion('requiresChange', e.target.value)}
                >
                    <option value="Si">Si</option>
                    <option value="No">No</option>
                </select>
                </div>
                {stationFindingDesinsectacion.requiresChange === 'Si' && (
                <div className="mb-3">
                    <label className="form-label">Prioridad de Cambio</label>
                    <select
                    className="form-select"
                    value={stationFindingDesinsectacion.changePriority}
                    onChange={(e) => handleStationFindingChangeDesinsectacion('changePriority', e.target.value)}
                    >
                    <option value="Si">Si</option>
                    <option value="No">No</option>
                    </select>
                </div>
                )}
            </>
            )}
            <div className="mb-3">
            <label className="form-label">Descripción</label>
            <textarea
                className="form-control"
                rows="3"
                value={stationFindingDesinsectacion.description}
                onChange={(e) => handleStationFindingChangeDesinsectacion('description', e.target.value)}
                placeholder="Ingrese una descripción del hallazgo"
                disabled={techSignaturePreview && clientSignaturePreview}
            ></textarea>
            </div>
            <div className="mb-3">
            <label className="form-label">Fotografía</label>
            <div className="image-upload-container">
              {stationFindingDesinsectacion.photo ? (
                <img
                  src={stationFindingDesinsectacion.photo}
                  alt="Preview"
                  className="image-preview"
                />
              ) : (
                <div className="drag-drop-area">
                  <span>Arrastra o selecciona una imagen</span>
                </div>
              )}
              <input
                type="file"
                className="image-input"
                disabled={techSignaturePreview && clientSignaturePreview}
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    handleStationFindingPhotoChangeDesinsectacion(file); // Mantiene la lógica original
                  }
                }}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
            <button className="btn btn-secondary" onClick={handleCloseStationModalDesinsectacion}>
            Cancelar
            </button>
            <button className="btn btn-success" onClick={handleSaveStationFindingDesinsectacion}>
            Guardar Hallazgo
            </button>
        </Modal.Footer>
        </Modal>

        <Modal show={viewStationModalOpen} onHide={() => setViewStationModalOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles de la Estación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {stationType === 'Desratización' && (
            <>
              <p><strong>Finalidad:</strong> {viewStationData.purpose || '-'}</p>
              {viewStationData.purpose === 'Consumo' && (
                <p><strong>Cantidad Consumida:</strong> {viewStationData.consumptionAmount || '-'}</p>
              )}
              {viewStationData.purpose === 'Captura' && (
                <p><strong>Cantidad Capturada:</strong> {viewStationData.captureQuantity || '-'}</p>
              )}
            </>
          )}
          {stationType === 'Desinsectación' && (
            <>
              <p><strong>Capturas:</strong> {viewStationData.captureQuantity || '-'}</p>
            </>
          )}
          <p><strong>Estado Físico:</strong> {viewStationData.physicalState || '-'}</p>
          {viewStationData.physicalState === 'Dañada' && (
            <>
              <p><strong>Lugar del Daño:</strong> {viewStationData.damageLocation || '-'}</p>
              <p><strong>Requiere Cambio:</strong> {viewStationData.requiresChange || '-'}</p>
              {viewStationData.requiresChange === 'Si' && (
                <p><strong>Prioridad de Cambio:</strong> {viewStationData.changePriority || '-'}</p>
              )}
            </>
          )}
          <p><strong>Descripción:</strong> {viewStationData.description || '-'}</p>
          <div className="mb-3">
            {viewStationData.photo ? (
              <img
                src={viewStationData.photo}
                alt="Foto"
                style={{ width: '300px', objectFit: 'cover' }}
              />
            ) : (
              <span>Sin Foto</span>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={() => setViewStationModalOpen(false)}>
            Cerrar
          </button>
        </Modal.Footer>
      </Modal>

       {/* Modal de firma */}
       <Modal show={signModalOpen} onHide={handleSignModalCancel} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Firmar Inspección</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Firma del Técnico */}
          <div className="mb-4 text-center">
            <h5 className="mb-3">Firma del Técnico</h5>
            <div className="position-relative text-center">
              <SignatureCanvas
                ref={sigCanvasTech}
                penColor="black"
                canvasProps={{
                  width: isMobile ? 280 : 700,
                  height: 200,
                  className: "signature-canvas",
                }}
              />
              <XCircle
                className="position-absolute top-0 end-0 text-danger"
                size={24}
                style={{ cursor: "pointer" }}
                title="Limpiar Firma Técnico"
                onClick={handleClearTechSignature}
                disabled={techSignaturePreview && clientSignaturePreview}
              />
            </div>
          </div>

          {/* Firma del Cliente */}
          <div className="mb-4 text-center">
            <h5 className="mb-3">Firma del Cliente</h5>
            <div className="col-12 position-relative text-center">
              <SignatureCanvas
                ref={sigCanvasClient}
                penColor="black"
                canvasProps={{
                  width: isMobile ? 280 : 700,
                  height: 200,
                  className: "signature-canvas",
                }}
              />
              <XCircle
                className="position-absolute top-0 end-0 text-danger"
                size={24}
                style={{ cursor: "pointer" }}
                title="Limpiar Firma Cliente"
                onClick={handleClearClientSignature}
                disabled={techSignaturePreview && clientSignaturePreview}
              />
            </div>
          </div>

          {/* Datos adicionales */}
          <div className="row" style={{ minHeight: 0, height: 'auto' }}>
            <div className="col-md-4 mt-1 text-center">
            <h5 className="mb-3">Datos del Cliente</h5>
              <input
                type="text"
                className="form-control"
                value={signData.name}
                onChange={(e) => handleSignDataChange("name", e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="col-md-4 mt-1">
              <input
                type="number"
                className="form-control"
                value={signData.id}
                onChange={(e) => handleSignDataChange("id", e.target.value)}
                placeholder="Cédula"
                required
              />
            </div>
            <div className="col-md-4 mt-1">
              <input
                type="text"
                className="form-control"
                value={signData.position}
                onChange={(e) => handleSignDataChange("position", e.target.value)}
                placeholder="Cargo"
                required
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" onClick={handleSignModalCancel}>
            Cancelar
          </button>
          <button
            className="btn btn-success"
            onClick={() => {
              // Validación de firmas
              if (sigCanvasTech.current.isEmpty() || sigCanvasClient.current.isEmpty()) {
                showNotification("Ambas firmas (Técnico y Cliente) son obligatorias.");
                return;
              }

              // Validación de campos del cliente
              if (!signData.name.trim() || !signData.id.trim() || !signData.position.trim()) {
                showNotification("Todos los campos del cliente (Nombre, Cédula, Cargo) son obligatorios.");
                return;
              }

              // Guardar las firmas y los datos del cliente
              handleSaveSignature();
              setSignData((prevData) => ({
                ...prevData,
                name: signData.name.trim(),
                id: signData.id.trim(),
                position: signData.position.trim(),
              }));
              showNotification('Firmas y datos guardados correctamente.');
              handleSignModalClose();
            }}
          >
            Guardar Firmas
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={notification.show}
        centered
        onHide={() => setNotification({ show: false, message: '' })}
        backdrop="static"
        keyboard={false}
      >
        <Modal.Body className="text-center">
          <p>{notification.message}</p>
        </Modal.Body>
      </Modal>

      <Modal show={confirmDelete.show} onHide={handleCloseConfirmDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Eliminación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que deseas eliminar este hallazgo?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseConfirmDelete}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteFinding}>
            Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={qrScannerOpen} onHide={() => setQrScannerOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Escanear Código QR</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <QrScannerComponent onScan={handleQrScan} />
        </Modal.Body>
      </Modal>

    </div>
  );
}

export default Inspection;
