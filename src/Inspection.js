import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Button, Table, InputGroup, FormControl, Modal, Form, Tooltip, OverlayTrigger } from 'react-bootstrap';
import api from './Api'; // Usa el archivo de API con lógica offline integrada
import { saveRequest, isOffline } from './offlineHandler';
import { initUsersDB, saveUsers, getUsers, getInspectionById, saveInspections, saveProducts, getProducts } from './indexedDBHandler';
import { compressImage } from './imageHelpers';
import SignatureCanvas from 'react-signature-canvas';
import "./Inspection.css";
import { ArrowDownSquare, ArrowUpSquare, Eye, FileEarmarkArrowDown, FileEarmarkPlus, EnvelopePaper, Whatsapp, Radioactive, FileEarmarkExcel, FileEarmarkImage, FileEarmarkPdf, FileEarmarkWord, PencilSquare, QrCodeScan, XCircle } from 'react-bootstrap-icons';
import { useUnsavedChanges } from './UnsavedChangesContext'
import QrScannerComponent from './QrScannerComponent';
import moment from 'moment';
import { useSocket } from './SocketContext';

function Inspection() {
  const storedUserInfo = JSON.parse(localStorage.getItem("user_info"));
  const userRol = storedUserInfo?.rol || '';
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
  const [documents, setDocuments] = useState([]);
  const [currentStationId, setCurrentStationId] = useState(null);
  const [stationFinding, setStationFinding] = useState({
    description: '', // Nuevo campo
    photo: null,
    latitude: '', // Nuevo campo para localización
    longitude: '', // Nuevo campo para localización
    altitude: '', // Nuevo campo para localización
    timestamp: '', // Hora de la captura
  });
  const [stationModalOpenHorizontal, setStationModalOpenHorizontal] = useState(false);
  const [currentStationIdHorizontal, setCurrentStationIdHorizontal] = useState(null);
  const [collapseStates, setCollapseStates] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [viewStationModalOpen, setViewStationModalOpen] = useState(false);
  const [viewStationData, setViewStationData] = useState({});
  const [stationType, setStationType] = useState(null);
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
  const [searchTermJardineria, setSearchTermJardineria] = useState('');
  const [searchTermHogar, setSearchTermHogar] = useState('');
  const [searchTermEmpresarial, setSearchTermEmpresarial] = useState('');
  const [searchTermHorizontal, setSearchTermHorizontal] = useState('');
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [currentQrStationType, setCurrentQrStationType] = useState(null);
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
  const [showModal, setShowModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const navigate = useNavigate();

  const socket = useSocket(); // Obtenemos el socket

  useEffect(() => {
    if (socket) {
      socket.on("inspection_synced", ({ oldId, newId }) => {
        console.log(`🔄 La inspección ${oldId} ha sido actualizada a ${newId}`);

        if (inspectionId === oldId) {
          console.log(`✅ Actualizando ID de la inspección actual: ${oldId} → ${newId}`);

          // Actualizamos la URL sin recargar la página
          navigate(`/inspection/${newId}`, { replace: true });

          // Actualizamos el estado para reflejar el nuevo ID
          setInspectionData((prevData) => ({
            ...prevData,
            id: newId, // Reemplazamos el ID viejo con el nuevo
          }));

          // Reemplazamos en los hallazgos y firmas si es necesario
          setFindingsByType((prevFindings) => {
            const updatedFindings = { ...prevFindings };
            for (const type in updatedFindings) {
              updatedFindings[type] = updatedFindings[type].map(finding =>
                finding.inspection_id === oldId ? { ...finding, inspection_id: newId } : finding
              );
            }
            return updatedFindings;
          });

          setClientStations((prevStations) => {
            const updatedStations = { ...prevStations };
            for (const stationId in updatedStations) {
              if (updatedStations[stationId].inspection_id === oldId) {
                updatedStations[stationId].inspection_id = newId;
              }
            }
            return updatedStations;
          });

          setActions((prevActions) =>
            prevActions.map((action) =>
              action.inspection_id === oldId ? { ...action, inspection_id: newId } : action
            )
          );
        }
      });

      return () => {
        socket.off("inspection_synced");
      };
    }
  }, [socket, inspectionId, navigate]);

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
      const response = await api.post("/convert-to-pdf", {
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
        showNotification(response.data.message || "Ocurrió un error al convertir el documento.");
      }
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      showNotification("Error de conexión con el servidor al intentar convertir el documento.");
    } finally {
      setLoadingConvertToPdf(false); // Ocultar spinner
    }
  };

  const handleActionClick = async (configurationId) => {
    if (isExecuting) return;
    setIsExecuting(true);

    try {
      const payload = { idEntity: inspectionId, id: configurationId, uniqueId: Date.now() };
      const response = await api.post(
        `${process.env.REACT_APP_API_URL}/api/create-document-inspeccion`,
        payload
      );

      if (response.data.success) {
        showNotification("Acción ejecutada con éxito.");
        await fetchDocuments();
      } else {
        showNotification("Error al ejecutar la acción.");
      }
    } catch (error) {
      console.error("Error al ejecutar la acción:", error);
      showNotification("Error al ejecutar la acción.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.post('/PrefirmarArchivos', { url: selectedDocument.document_url });
      if (response.data.signedUrl) {
        const preSignedUrl = response.data.signedUrl;
        const link = document.createElement('a');
        link.href = preSignedUrl;
        link.download = 'document'; // Cambia el nombre del archivo si es necesario
        link.click();
      } else {
        showNotification("No se pudo obtener la URL prefirmada.");
      }
    } catch (error) {
      console.error('Error al obtener la URL prefirmada para descargar:', error);
      showNotification('Hubo un error al procesar la solicitud.');
    }
  };

  const handleEditGoogleDrive = async () => {
    setLoadingGoogleDrive(true); // Mostrar el spinner
    try {
      console.log("Iniciando pre-firmado del documento:", selectedDocument);

      const response = await api.post("/PrefirmarArchivos", { url: selectedDocument.document_url });
      console.log("Respuesta de pre-firmado:", response.data);

      if (response.data.signedUrl) {
        const preSignedUrl = response.data.signedUrl;
        console.log("URL prefirmada obtenida:", preSignedUrl);

        console.log("Enviando solicitud para editar en Google Drive...");
        const googleDriveResponse = await api.post("/edit-googledrive", { s3Url: preSignedUrl });
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
          showNotification("No se pudo obtener el archivo en Google Drive.");
        }
      } else {
        console.error("No se pudo obtener la URL prefirmada.");
        showNotification("No se pudo obtener la URL prefirmada.");
      }
    } catch (error) {
      console.error("Error al procesar la solicitud de Google Drive:", error);
      showNotification("Hubo un error al procesar la solicitud.");
    } finally {
      setLoadingGoogleDrive(false); // Ocultar el spinner
    }
  };


  const handleEditLocal = () => {
    navigate("/edit-local-file", { state: { documentId: selectedDocument.id } });
  };

  const handleDocumentClick = (documentUrl) => {
    setSelectedDocument(documentUrl);
    setDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setSelectedDocument(null);
    setDocumentModalOpen(false);
  };

  console.log("user rol", userRol);

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
    const preSignUrl = async (url) => {
      try {
        console.log(`Intentando pre-firmar la URL: ${url}`); // Log de inicio
        const response = await api.post('/PrefirmarArchivos', { url });
        console.log(`URL pre-firmada con éxito: ${response.data.signedUrl}`); // Log de éxito
        return response.data.signedUrl;
      } catch (error) {
        console.error(`Error al pre-firmar la URL: ${url}`, error); // Log de error
        return null; // Retorna null si hay un error
      }
    };

    const fetchInspectionData = async () => {
      try {
        console.log('🔍 Verificando modo de conexión...');

        let inspectionData;

        if (isOffline()) {
          console.log('📴 Modo offline activado. Consultando IndexedDB...');
          inspectionData = await getInspectionById(inspectionId);

          if (!inspectionData) {
            console.warn(`⚠️ Inspección ${inspectionId} no encontrada en IndexedDB.`);
            return setLoading(false);
          }

          console.log('✅ Inspección cargada desde IndexedDB:', inspectionData);

          // 🔥 Convertir `inspection_type` de array a string separado por comas
          if (Array.isArray(inspectionData.inspection_type)) {
            inspectionData.inspection_type = inspectionData.inspection_type.join(", ");
          }
        } else {
          console.log('🌐 Modo online. Consultando API...');
          const response = await api.get(`${process.env.REACT_APP_API_URL}/api/inspections/${inspectionId}`);
          inspectionData = response.data;

          console.log('✅ Inspección obtenida desde API:', inspectionData);

          // Guardar en IndexedDB para acceso offline en el futuro
          await saveInspections({ [inspectionData.service_id]: [inspectionData] });
          console.log('📥 Inspección almacenada en IndexedDB.');
        }

        setInspectionData(inspectionData);

        // Cargar observaciones generales
        setGeneralObservations(inspectionData.observations || '');

        // Procesar hallazgos
        const initialFindings = inspectionData.findings?.findingsByType || {};
        for (const type of Object.keys(initialFindings)) {
          initialFindings[type] = await Promise.all(
            initialFindings[type].map(async (finding) => {
              if (!finding.photo) return { ...finding, photo: null, photoRelative: null, photoBlob: null };

              let signedUrl = null;
              try {
                signedUrl = await preSignUrl(finding.photo);
              } catch (error) {
                console.error(`❌ Error al pre-firmar la URL del hallazgo ${finding.id}:`, error);
              }

              return { ...finding, photo: signedUrl, photoRelative: finding.photo || null, photoBlob: null };
            })
          );
        }
        setFindingsByType(initialFindings);

        setProductsByType(inspectionData.findings?.productsByType || {});

        // Cargar firmas y pre-firmar URLs
        const signatures = inspectionData.findings?.signatures || {};
        if (signatures.technician?.signature) {
          setTechSignaturePreview(await preSignUrl(signatures.technician.signature) || signatures.technician.signature);
        }
        if (signatures.client?.signature) {
          setClientSignaturePreview(await preSignUrl(signatures.client.signature) || signatures.client.signature);
        }

        // Cargar datos del cliente
        if (signatures.client) {
          setSignData({
            name: signatures.client.name || '',
            id: signatures.client.id || '',
            position: signatures.client.position || '',
          });
        }

        // Procesar hallazgos en estaciones
        const clientStationsData = {};
        for (const finding of inspectionData.findings?.stationsFindings || []) {
          try {
            const signedUrl = finding.photo ? await preSignUrl(finding.photo) : null;
            if (!finding.stationId) continue;

            clientStationsData[finding.stationId] = { ...finding, photo: signedUrl, photoRelative: finding.photo || null, photoBlob: null };
          } catch (error) {
            console.error(`❌ Error procesando hallazgo en estación ${finding.stationId}:`, error);
          }
        }
        setClientStations(clientStationsData);

        // Cargar estaciones relacionadas
        if (!isOffline() && inspectionData.service_id) {
          const serviceResponse = await api.get(`${process.env.REACT_APP_API_URL}/api/services/${inspectionData.service_id}`);
          const clientId = serviceResponse.data.client_id;

          console.log("cliente id: ", clientId)
          const clientResponse = await api.get(`${process.env.REACT_APP_API_URL}/api/clients/${clientId}`);
          const clientData = clientResponse.data;
          console.log("datos del cliente: ", clientData)
          setClientData(clientResponse.data);
          if (clientId) {
            const stationsResponse = await api.get(`${process.env.REACT_APP_API_URL}/api/stations/client/${clientId}`);
            setStations(stationsResponse.data);

          }
        }

        // Cargar productos disponibles
        try {
          if (isOffline()) {
            console.log('📴 Offline: leyendo productos desde IndexedDB...');
            const offlineProducts = await getProducts();
            setAvailableProducts(offlineProducts);
          } else {
            console.log('🌐 Online: descargando productos...');
            const { data: productsFromServer } = await api.get(`${process.env.REACT_APP_API_URL}/api/products`);
            setAvailableProducts(productsFromServer);

            // Cachear para el futuro
            await saveProducts(productsFromServer);
          }
        } catch (prodErr) {
          console.error('❌ Error al cargar productos:', prodErr);
          setAvailableProducts([]);               // evita crashes de UI
        }

        setLoading(false);
        console.log('✅ Carga de datos de inspección completada.');
      } catch (error) {
        console.error('❌ Error al cargar los datos de inspección:', error);
        setLoading(false);
      }
    };


    const fetchActions = async () => {
      try {
        const response = await api.get(`${process.env.REACT_APP_API_URL}/api/actions-inspections`, {
          params: { inspection_id: inspectionId }, // Consulta con el ID de inspección
        });
        setActions(response.data.actions || []); // Asume que el backend devuelve un array de acciones
      } catch (error) {
        console.error('Error fetching actions:', error);
      }
    };

    fetchDocuments();
    fetchActions();

    fetchInspectionData();
  }, [inspectionId]);

  const fetchDocuments = async () => {
    try {
      const response = await api.get(`${process.env.REACT_APP_API_URL}/api/get-documents`, {
        params: { entity_type: 'inspections', entity_id: inspectionId },
      });
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleQrScan = (scannedValue) => {
    console.log("Valor recibido del escáner QR:", scannedValue);
    const normalizedValue = scannedValue.toLowerCase();

    if (currentQrStationType === "Jardineria") {
      setSearchTermJardineria(normalizedValue);
      console.log("Estado de búsqueda actualizado (Jardineria):", normalizedValue);
    } else if (currentQrStationType === "Horizontal") {
      setSearchTermHorizontal(normalizedValue);
      console.log("Estado de búsqueda actualizado (Horizontal):", normalizedValue);
    } else if (currentQrStationType === "Empresarial") {
      setSearchTermEmpresarial(normalizedValue);
      console.log("Estado de búsqueda actualizado (Empresarial):", normalizedValue);
    } else if (currentQrStationType === "Hogar") {
      setSearchTermHogar(normalizedValue);
      console.log("Estado de búsqueda actualizado (Hogar):", normalizedValue);
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
      if (stationFinding.photo) {
        URL.revokeObjectURL(stationFinding.photo);
      }
    };
  }, [stationFinding.photo, stationFinding.photo]);

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
    if (isExecuting) return;
    setIsExecuting(true);
    try {
      const formData = new FormData();

      // Información básica
      formData.append("inspectionId", inspectionId);
      formData.append("generalObservations", generalObservations);

      // Incluir el ID del usuario explícitamente
      formData.append("userId", storedUserInfo?.id_usuario || null);
      formData.append("exitTime", moment().format("HH:mm"));

      // Procesar findingsByType
      const findingsByTypeProcessed = {};
      Object.keys(findingsByType).forEach((type) => {
        findingsByTypeProcessed[type] = findingsByType[type].map((finding) => ({
          ...finding,
          photo: finding.photoBlob ? null : finding.photoRelative, // Enviar la URL relativa si no hay nueva imagen
          date: finding.date || getFormattedDateWithSlashes(),
          time: finding.time || new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).replace(/\u00A0/g, ' '),
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
        const prefix = "";
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
          id: storedUserInfo?.id_usuario || null,
          name: `${storedUserInfo?.name || ""} ${storedUserInfo?.lastname || ""}`.trim(),
          role: userRol || "No disponible",
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
    } finally {
      setIsExecuting(false);
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

    const now = moment();
    const date = inspectionData?.date
      ? moment(inspectionData.date).format("DD-MM-YYYY") // ← nuevo formato aquí
      : now.format("DD-MM-YYYY");
    const time = now.format("HH:mm"); // Hora exacta

    // Actualizar los hallazgos con el nuevo elemento
    setFindingsByType((prevFindings) => {
      const now = new Date();
      const dateFinding = getFormattedDateWithSlashes();
      const timeFinding = now.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).replace(/\u00A0/g, ' ');

      return {
        ...prevFindings,
        [type]: [
          ...(prevFindings[type] || []),
          {
            id: newFindingId,
            place: '',
            description: '',
            photo: null,
            date: dateFinding,
            time: timeFinding,
          },
        ],
      };
    });

    // Expandir el nuevo hallazgo
    setCollapseStates((prevStates) => ({
      ...prevStates,
      [newFindingKey]: true,
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

  const handleFindingPhotoChange = async (type, index, file) => {
    if (!file || !file.type.startsWith('image/')) {
      showNotification('Seleccione un archivo válido de tipo imagen.');
      return;
    }

    const compressed = await compressImage(file);
    const photoURL = URL.createObjectURL(compressed);

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

  const handleOpenStationModal = async (stationId) => {
    const station = stations.find((s) => s.id === stationId); // Buscar la estación
    if (!station) return;

    const captureGeolocation = (callback) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, altitude } = position.coords;
            const timestamp = new Date().toISOString();

            const locationData = {
              latitude,
              longitude,
              altitude: altitude || "No disponible",
              timestamp,
            };

            console.log("Datos de geolocalización obtenidos:", locationData);
            callback(locationData);
          },
          (error) => {
            console.error("Error al obtener la ubicación:", error);
            showNotification("No se pudo obtener la ubicación.");
            callback({
              latitude: "No disponible",
              longitude: "No disponible",
              altitude: "No disponible",
              timestamp: new Date().toISOString(),
            });
          }
        );
      } else {
        showNotification("La geolocalización no está soportada en este navegador.");
        callback({
          latitude: "No disponible",
          longitude: "No disponible",
          altitude: "No disponible",
          timestamp: new Date().toISOString(),
        });
      }
    };

    if (station.type === "Localización") {
      const timestamp = moment().format('DD-MM-YYYY HH:mm');
      // Obtener geolocalización y guardar directamente en StationFindings
      captureGeolocation((locationData) => {

        // Guardar los datos directamente en clientStations
        setClientStations((prevStations) => ({
          ...prevStations,
          [stationId]: {
            ...locationData,
            description: `✅ Registro exitoso ${timestamp} ✅`, // Descripción por defecto
          },
        }));
      });
      return;
    }

    if (station.type === "Control") {
      // Capturar geolocalización antes de abrir el modal
      captureGeolocation((locationData) => {
        // Guardar los datos de geolocalización en el estado del modal
        setCurrentStationId(stationId);
        setStationFinding({
          ...locationData,
          description: '', // Inicializamos para que el usuario pueda ingresar
          photo: null, // Inicializamos para que el usuario pueda subir
        });
        setStationModalOpen(true); // Abrimos el modal para que el usuario complete
      });
    }
  };

  const handleCloseStationModal = () => {
    setCurrentStationId(null);
    setStationModalOpen(false);
    setStationFinding({
      description: '',
      photo: null,
      latitude: '', // Nuevo campo para localización
      longitude: '', // Nuevo campo para localización
      altitude: '', // Nuevo campo para localización
      timestamp: '', // Hora de la captura

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

  // Manejador de estado de colapso
  const handleCollapseToggle = (currentKey) => {
    setCollapseStates({ [currentKey]: !collapseStates[currentKey] }); // Solo permite un hallazgo expandido
  };

  const handleViewStation = (stationId) => {
    setViewStationData(clientStations[stationId] || {});
    setViewStationModalOpen(true);
  };

  const handleViewStationJardineria = (stationId) => {
    setViewStationData(clientStations[stationId] || {});
    setStationType('Jardineria');
    setViewStationModalOpen(true);
  };

  const handleViewStationHogar = (stationId) => {
    setViewStationData(clientStations[stationId] || {});
    setStationType('Hogar');
    setViewStationModalOpen(true);
  };

  const handleViewStationHorizontal = (stationId) => {
    setViewStationData(clientStations[stationId] || {});
    setStationType('Horizontal');
    setViewStationModalOpen(true);
  };

  const handleViewStationEmpresarial = (stationId) => {
    setViewStationData(clientStations[stationId] || {});
    setStationType('Empresarial');
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

  if (loading) return
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      zIndex: 1050,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div className="spinner-border text-secondary" role="status" style={{ width: "5rem", height: "5rem" }}>
      <span className="visually-hidden">Cargando datos de la Inspección...</span>
    </div>
  </div>
    ;

  if (!inspectionData)
    return (
      <div className="alert alert-danger" role="alert">
        No se encontró información de la inspección.
      </div>
    );

  const getFormattedDateWithSlashes = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`; // formato con /
  };

  const { inspection_type, inspection_sub_type, date, time, service_id, exit_time } = inspectionData;

  /********* 1. Categorías “reales” que llegan desde la ficha *********/
  const originalCategories = inspection_type
    ? inspection_type.split(',').map(t => t.trim())
    : [];                       // ← vacío si no vino nada

  /********* 2. Categorías auxiliares que NO deben exigir hallazgos ****/
  const extraCategories = [
    'Observaciones Cliente',
    'Observaciones Inspector',
    'Observaciones SST',
  ];

  /********* 3. Lista completa para renderizar en la UI ****************/
  const parsedInspectionTypes = [...originalCategories, ...extraCategories];

  /********* 4. ¿hay un hallazgo con descripción en cada categoría real? */
  const hasFindingsInEveryOriginalCategory = originalCategories.every(cat =>
    (findingsByType[cat] || []).some(
      f => (f.description || '').trim().length > 0
    )
  );

  /********* 5. ¿hay observación general? ********************************/
  const hasGeneralObs = generalObservations.trim().length > 0;

  /********* 6. Puede firmar solo si cumple ambas condiciones ************/
  const canSign = hasGeneralObs && hasFindingsInEveryOriginalCategory;

  /********* 7. Texto de tooltip *****************************************/
  const getSignMissingMessage = () => {
    const faltantes = [];

    if (!hasGeneralObs) {
      faltantes.push('• Ingresar observación general');
    }

    const categoriasSinHallazgo = originalCategories.filter(cat =>
      !(findingsByType[cat] || []).some(
        f => (f.description || '').trim().length
      )
    );
    if (categoriasSinHallazgo.length) {
      faltantes.push(
        `• Hallazgo en: ${categoriasSinHallazgo.join(', ')}`
      );
    }

    return faltantes.length
      ? `Para firmar necesitas:\n${faltantes.join('\n')}`
      : '';
  };

  /* ------------- tooltip reutilizable -------------- */
  const renderTooltip = props => (
    <Tooltip
      {...props}
      id="tooltip-sign-info"
      className="text-start white-space-pre"
    >
      {getSignMissingMessage()}
    </Tooltip>
  );

  return (
    <div className="container mt-4">

      {/* Tarjeta Información General */}
      <div className="card border-success mb-3" style={{ minHeight: 0, height: 'auto' }}>
        <div className="card-header">Información General</div>
        <div className="card-body">
          {/* Primera fila: Información General y Documentos */}
          <div className="row" style={{ minHeight: 0, height: 'auto' }}>
            {/* Columna 1: Información General */}
            <div className="col-md-6">
              <p><strong>Inspección:</strong> {inspectionId}</p>
              <p><strong>Fecha:</strong> {moment.utc(date).format('DD/MM/YYYY')}</p>
              <p><strong>Hora de Inicio:</strong> {moment(time, "HH:mm:ss").format("HH:mm A")}</p>
              <p><strong>Hora de Finalización:</strong> {moment(exit_time, "HH:mm:ss").format("HH:mm A")}</p>
              <p><strong>Servicio:</strong> {service_id}</p>
              <br></br>
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
                disabled={techSignaturePreview || userRol === 'Cliente'}
              ></textarea>
            </div>

            {/* Columna 2: Documentos */}
            <div className="col-md-6">
              <h5>Documentos</h5>
              {documents.length > 0 ? (
                <div className="row" style={{ minHeight: 0, height: 'auto' }}>
                  {documents.map((doc, index) => (
                    <div className="col-6 col-md-3 text-center mb-3" key={index}>
                      <button
                        className="btn p-0"
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                        onClick={() => handleDocumentClick(doc)}
                      >
                        {doc.document_type === "doc" ? (
                          <FileEarmarkWord size={40} color="blue" title="Documento Word" />
                        ) : doc.document_type === "xlsx" ? (
                          <FileEarmarkExcel size={40} color="green" title="Hoja de cálculo Excel" />
                        ) : doc.document_type === "pdf" ? (
                          <FileEarmarkPdf size={40} color="red" title="Documento PDF" />
                        ) : ["jpg", "jpeg", "png"].includes(doc.document_type) ? (
                          <FileEarmarkImage size={40} color="orange" title="Imagen" />
                        ) : (
                          <FileEarmarkArrowDown size={40} color="gray" title="Archivo" />
                        )}
                        <div className="mt-2">
                          <small>{doc.document_name}</small>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No se encontraron documentos relacionados con esta inspección.</p>
              )}

              {/* Mostrar las acciones debajo de los documentos */}
              <div className="mt-3">
                <h5>Acciones</h5>
                {actions.length > 0 ? (
                  <div className="row" style={{ minHeight: 0, height: 'auto' }}>
                    {actions.map((action, index) => {
                      // Determinar el ícono y color según el action_type
                      let IconComponent;
                      let color;

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
                            onClick={() => {
                              if (action.action_type === "generate_pdf" && action.configuration_id === 0) {
                                handleOpenConvertToPdfModal();
                              } else {
                                handleActionClick(action.configuration_id);
                              }
                            }}
                          >
                            <IconComponent size={40} color={color} title={action.action_name} />
                            <div className="mt-2">
                              <small>{action.action_name}</small>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p>No se encontraron acciones relacionadas con esta inspección.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones por Tipo de Inspección */}
      {parsedInspectionTypes.map((type, index) => (
        <div className="card border-success mb-3" key={index} >
          <div className="card-header">{type}</div>
          <div className="card-body">

            {type === 'Jardineria' && stations.length > 0 && (
              <div className="mt-1">
                <div style={{ display: 'none' }}>
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Buscar estación por descripción"
                    value={searchTermJardineria}
                    onChange={(e) => setSearchTermJardineria(e.target.value)}
                  />
                </div>
                <QrCodeScan
                  size={40}
                  className="btn p-0 mx-4"
                  onClick={() => handleOpenQrScanner("Jardineria")}
                />
                <div className="table-responsive mt-3">
                  {isMobile ? (
                    // Vista móvil con colapso
                    stations
                      .filter((station) => {
                        // Validar primero que la categoría sea "Jardineria"
                        if (station.category !== "Jardineria") {
                          return false;
                        }

                        // Normalizamos el término de búsqueda
                        const search = searchTermJardineria.trim().toLowerCase();
                        const stationPrefix = "station-";
                        const isStationSearch = search.startsWith(stationPrefix);

                        // Verificar si coincide con el término de búsqueda
                        let matchesSearch = false;
                        if (search) {
                          if (isStationSearch) {
                            const stationId = Number(search.replace(stationPrefix, ""));
                            matchesSearch = !isNaN(stationId) && station.id === stationId;
                          } else {
                            const stationName = station.name ? station.name.toLowerCase() : "";
                            const stationDescription = station.description
                              ? station.description.toLowerCase()
                              : "";
                            matchesSearch =
                              stationName.includes(search) || stationDescription.includes(search);
                          }
                        }

                        // Verificar si tiene hallazgos
                        const hasFindings = !!clientStations[station.id];

                        // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                        return hasFindings || matchesSearch;
                      })
                      .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                      .map((station) => {
                        const currentKey = `station-${station.id}`;
                        return (
                          <div
                            key={station.id}
                            className="finding-item border mb-3 p-2"
                            style={{ borderRadius: "5px", backgroundColor: "#f8f9fa" }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{station.name || `Estación ${station.description}`}</strong>
                              <div
                                className="icon-toggle"
                                onClick={() => handleCollapseToggle(currentKey)}
                                style={{ cursor: "pointer" }}
                              >
                                {collapseStates[currentKey] ? (
                                  <ArrowUpSquare title="Ocultar" />
                                ) : (
                                  <ArrowDownSquare title="Expandir" />
                                )}
                              </div>
                            </div>
                            <div
                              className={`finding-details ${collapseStates[currentKey] ? "d-block" : "d-none"
                                } mt-2`}
                            >
                              {clientStations[station.id] ? (
                                <>
                                  <p>
                                    <strong>Descripción:</strong>{" "}
                                    {clientStations[station.id].description || "-"}
                                  </p>
                                  <div className="mb-3">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{ width: "150px", objectFit: "cover" }}
                                      />
                                    ) : (
                                      <span>Sin Foto</span>
                                    )}
                                  </div>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
                                  >
                                    Editar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p>Sin hallazgo reportado</p>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
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
                      <tbody>
                        {stations
                          .filter((station) => {
                            console.log("Evaluando estación:", station);

                            // Verificar categoría
                            if (station.category !== "Jardineria") {
                              console.log(
                                `Estación ${station.name || `ID: ${station.id}`} excluida por categoría:`,
                                station.category
                              );
                              return false;
                            }

                            // Normalizamos el término de búsqueda
                            const search = searchTermJardineria.trim().toLowerCase();
                            const stationPrefix = "station-";
                            const isStationSearch = search.startsWith(stationPrefix);

                            // Verificar si coincide con el término de búsqueda
                            let matchesSearch = false;
                            if (search) {
                              if (isStationSearch) {
                                const stationId = Number(search.replace(stationPrefix, ""));
                                matchesSearch = !isNaN(stationId) && station.id === stationId;
                              } else {
                                const stationName = station.name ? station.name.toLowerCase() : "";
                                const stationDescription = station.description
                                  ? station.description.toLowerCase()
                                  : "";
                                matchesSearch =
                                  stationName.includes(search) || stationDescription.includes(search);
                              }
                            }

                            // Verificar si tiene hallazgos
                            const hasFindings = !!clientStations[station.id];

                            // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                            return hasFindings || matchesSearch;
                          })
                          .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                          .map((station) => (
                            <tr key={station.id}>
                              <td className="align-middle">
                                {station.name || `Estación ${station.description}`}
                              </td>
                              {clientStations[station.id] ? (
                                <>
                                  <td className="align-middle">
                                    {clientStations[station.id].description || "-"}
                                  </td>
                                  <td className="align-middle mx-1 px-1">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{
                                          width: "250px",
                                          objectFit: "cover",
                                          margin: "0px",
                                          padding: "0px",
                                        }}
                                      />
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="align-middle">
                                    {!isMobile && (
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => handleViewStationJardineria(station.id)}
                                        style={{ border: "none", background: "none" }}
                                      >
                                        <Eye
                                          className="mx-2"
                                          size={"25px"}
                                          color="blue"
                                          type="button"
                                        />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-link p-0"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente" || station.type === 'Localización'
                                      }
                                      style={{ border: "none", background: "none" }}
                                    >
                                      <PencilSquare
                                        className="mx-2"
                                        size={"20px"}
                                        color={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "gray"
                                            : "green"
                                        }
                                        type="button"
                                        title={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "Inspección firmada, edición bloqueada"
                                            : "Editar"
                                        }
                                      />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td colSpan="2">Sin hallazgo reportado</td>
                                  <td>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente"
                                      }
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

            {type === 'Hogar' && stations.length > 0 && (
              <div className="mt-1">
                <div style={{ display: 'none' }}>
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Buscar estación por descripción"
                    value={searchTermHogar}
                    onChange={(e) => setSearchTermHogar(e.target.value)}
                  />
                </div>
                <QrCodeScan
                  size={40}
                  className="btn p-0 mx-4"
                  onClick={() => handleOpenQrScanner("Hogar")}
                />
                <div className="table-responsive mt-3">
                  {isMobile ? (
                    // Vista móvil con colapso
                    stations
                      .filter((station) => {
                        // Validar primero que la categoría sea "Hogar"
                        if (station.category !== "Hogar") {
                          return false;
                        }

                        // Normalizamos el término de búsqueda
                        const search = searchTermHogar.trim().toLowerCase();
                        const stationPrefix = "station-";
                        const isStationSearch = search.startsWith(stationPrefix);

                        // Verificar si coincide con el término de búsqueda
                        let matchesSearch = false;
                        if (search) {
                          if (isStationSearch) {
                            const stationId = Number(search.replace(stationPrefix, ""));
                            matchesSearch = !isNaN(stationId) && station.id === stationId;
                          } else {
                            const stationName = station.name ? station.name.toLowerCase() : "";
                            const stationDescription = station.description
                              ? station.description.toLowerCase()
                              : "";
                            matchesSearch =
                              stationName.includes(search) || stationDescription.includes(search);
                          }
                        }

                        // Verificar si tiene hallazgos
                        const hasFindings = !!clientStations[station.id];

                        // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                        return hasFindings || matchesSearch;
                      })
                      .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                      .map((station) => {
                        const currentKey = `station-${station.id}`;
                        return (
                          <div
                            key={station.id}
                            className="finding-item border mb-3 p-2"
                            style={{ borderRadius: "5px", backgroundColor: "#f8f9fa" }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{station.name || `Estación ${station.description}`}</strong>
                              <div
                                className="icon-toggle"
                                onClick={() => handleCollapseToggle(currentKey)}
                                style={{ cursor: "pointer" }}
                              >
                                {collapseStates[currentKey] ? (
                                  <ArrowUpSquare title="Ocultar" />
                                ) : (
                                  <ArrowDownSquare title="Expandir" />
                                )}
                              </div>
                            </div>
                            <div
                              className={`finding-details ${collapseStates[currentKey] ? "d-block" : "d-none"
                                } mt-2`}
                            >
                              {clientStations[station.id] ? (
                                <>
                                  <p>
                                    <strong>Descripción:</strong>{" "}
                                    {clientStations[station.id].description || "-"}
                                  </p>
                                  <div className="mb-3">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{ width: "150px", objectFit: "cover" }}
                                      />
                                    ) : (
                                      <span>Sin Foto</span>
                                    )}
                                  </div>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
                                  >
                                    Editar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p>Sin hallazgo reportado</p>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
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
                      <tbody>
                        {stations
                          .filter((station) => {
                            console.log("Evaluando estación:", station);

                            // Verificar categoría
                            if (station.category !== "Hogar") {
                              console.log(
                                `Estación ${station.name || `ID: ${station.id}`} excluida por categoría:`,
                                station.category
                              );
                              return false;
                            }

                            // Normalizamos el término de búsqueda
                            const search = searchTermHogar.trim().toLowerCase();
                            const stationPrefix = "station-";
                            const isStationSearch = search.startsWith(stationPrefix);

                            // Verificar si coincide con el término de búsqueda
                            let matchesSearch = false;
                            if (search) {
                              if (isStationSearch) {
                                const stationId = Number(search.replace(stationPrefix, ""));
                                matchesSearch = !isNaN(stationId) && station.id === stationId;
                              } else {
                                const stationName = station.name ? station.name.toLowerCase() : "";
                                const stationDescription = station.description
                                  ? station.description.toLowerCase()
                                  : "";
                                matchesSearch =
                                  stationName.includes(search) || stationDescription.includes(search);
                              }
                            }

                            // Verificar si tiene hallazgos
                            const hasFindings = !!clientStations[station.id];

                            // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                            return hasFindings || matchesSearch;
                          })
                          .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                          .map((station) => (
                            <tr key={station.id}>
                              <td className="align-middle">
                                {station.name || `Estación ${station.description}`}
                              </td>
                              {clientStations[station.id] ? (
                                <>
                                  <td className="align-middle">
                                    {clientStations[station.id].description || "-"}
                                  </td>
                                  <td className="align-middle mx-1 px-1">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{
                                          width: "250px",
                                          objectFit: "cover",
                                          margin: "0px",
                                          padding: "0px",
                                        }}
                                      />
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="align-middle">
                                    {!isMobile && (
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => handleViewStationHogar(station.id)}
                                        style={{ border: "none", background: "none" }}
                                      >
                                        <Eye
                                          className="mx-2"
                                          size={"25px"}
                                          color="blue"
                                          type="button"
                                        />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-link p-0"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente" || station.type === 'Localización'
                                      }
                                      style={{ border: "none", background: "none" }}
                                    >
                                      <PencilSquare
                                        className="mx-2"
                                        size={"20px"}
                                        color={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "gray"
                                            : "green"
                                        }
                                        type="button"
                                        title={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "Inspección firmada, edición bloqueada"
                                            : "Editar"
                                        }
                                      />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td colSpan="2">Sin hallazgo reportado</td>
                                  <td>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente"
                                      }
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

            {type === 'Empresarial' && stations.length > 0 && (
              <div className="mt-1">
                <div style={{ display: 'none' }}>
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Buscar estación por descripción"
                    value={searchTermEmpresarial}
                    onChange={(e) => setSearchTermEmpresarial(e.target.value)}
                  />
                </div>
                <QrCodeScan
                  size={40}
                  className="btn p-0 mx-4"
                  onClick={() => handleOpenQrScanner("Empresarial")}
                />
                <div className="table-responsive mt-3">
                  {isMobile ? (
                    // Vista móvil con colapso
                    stations
                      .filter((station) => {
                        // Validar primero que la categoría sea "Empresarial"
                        if (station.category !== "Empresarial") {
                          return false;
                        }

                        // Normalizamos el término de búsqueda
                        const search = searchTermEmpresarial.trim().toLowerCase();
                        const stationPrefix = "station-";
                        const isStationSearch = search.startsWith(stationPrefix);

                        // Verificar si coincide con el término de búsqueda
                        let matchesSearch = false;
                        if (search) {
                          if (isStationSearch) {
                            const stationId = Number(search.replace(stationPrefix, ""));
                            matchesSearch = !isNaN(stationId) && station.id === stationId;
                          } else {
                            const stationName = station.name ? station.name.toLowerCase() : "";
                            const stationDescription = station.description
                              ? station.description.toLowerCase()
                              : "";
                            matchesSearch =
                              stationName.includes(search) || stationDescription.includes(search);
                          }
                        }

                        // Verificar si tiene hallazgos
                        const hasFindings = !!clientStations[station.id];

                        // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                        return hasFindings || matchesSearch;
                      })
                      .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                      .map((station) => {
                        const currentKey = `station-${station.id}`;
                        return (
                          <div
                            key={station.id}
                            className="finding-item border mb-3 p-2"
                            style={{ borderRadius: "5px", backgroundColor: "#f8f9fa" }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{station.name || `Estación ${station.description}`}</strong>
                              <div
                                className="icon-toggle"
                                onClick={() => handleCollapseToggle(currentKey)}
                                style={{ cursor: "pointer" }}
                              >
                                {collapseStates[currentKey] ? (
                                  <ArrowUpSquare title="Ocultar" />
                                ) : (
                                  <ArrowDownSquare title="Expandir" />
                                )}
                              </div>
                            </div>
                            <div
                              className={`finding-details ${collapseStates[currentKey] ? "d-block" : "d-none"
                                } mt-2`}
                            >
                              {clientStations[station.id] ? (
                                <>
                                  <p>
                                    <strong>Descripción:</strong>{" "}
                                    {clientStations[station.id].description || "-"}
                                  </p>
                                  <div className="mb-3">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{ width: "150px", objectFit: "cover" }}
                                      />
                                    ) : (
                                      <span>Sin Foto</span>
                                    )}
                                  </div>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
                                  >
                                    Editar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p>Sin hallazgo reportado</p>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
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
                      <tbody>
                        {stations
                          .filter((station) => {
                            console.log("Evaluando estación:", station);

                            // Verificar categoría
                            if (station.category !== "Empresarial") {
                              console.log(
                                `Estación ${station.name || `ID: ${station.id}`} excluida por categoría:`,
                                station.category
                              );
                              return false;
                            }

                            // Normalizamos el término de búsqueda
                            const search = searchTermEmpresarial.trim().toLowerCase();
                            const stationPrefix = "station-";
                            const isStationSearch = search.startsWith(stationPrefix);

                            // Verificar si coincide con el término de búsqueda
                            let matchesSearch = false;
                            if (search) {
                              if (isStationSearch) {
                                const stationId = Number(search.replace(stationPrefix, ""));
                                matchesSearch = !isNaN(stationId) && station.id === stationId;
                              } else {
                                const stationName = station.name ? station.name.toLowerCase() : "";
                                const stationDescription = station.description
                                  ? station.description.toLowerCase()
                                  : "";
                                matchesSearch =
                                  stationName.includes(search) || stationDescription.includes(search);
                              }
                            }

                            // Verificar si tiene hallazgos
                            const hasFindings = !!clientStations[station.id];

                            // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                            return hasFindings || matchesSearch;
                          })
                          .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                          .map((station) => (
                            <tr key={station.id}>
                              <td className="align-middle">
                                {station.name || `Estación ${station.description}`}
                              </td>
                              {clientStations[station.id] ? (
                                <>
                                  <td className="align-middle">
                                    {clientStations[station.id].description || "-"}
                                  </td>
                                  <td className="align-middle mx-1 px-1">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{
                                          width: "250px",
                                          objectFit: "cover",
                                          margin: "0px",
                                          padding: "0px",
                                        }}
                                      />
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="align-middle">
                                    {!isMobile && (
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => handleViewStationEmpresarial(station.id)}
                                        style={{ border: "none", background: "none" }}
                                      >
                                        <Eye
                                          className="mx-2"
                                          size={"25px"}
                                          color="blue"
                                          type="button"
                                        />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-link p-0"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente" || station.type === 'Localización'
                                      }
                                      style={{ border: "none", background: "none" }}
                                    >
                                      <PencilSquare
                                        className="mx-2"
                                        size={"20px"}
                                        color={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "gray"
                                            : "green"
                                        }
                                        type="button"
                                        title={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "Inspección firmada, edición bloqueada"
                                            : "Editar"
                                        }
                                      />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td colSpan="2">Sin hallazgo reportado</td>
                                  <td>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente"
                                      }
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


            {type === 'Horizontal' && stations.length > 0 && (
              <div className="mt-1">
                <div style={{ display: 'none' }}>
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Buscar estación por descripción"
                    value={searchTermHorizontal}
                    onChange={(e) => setSearchTermHorizontal(e.target.value)}
                  />
                </div>
                <QrCodeScan
                  size={40}
                  className="btn p-0 mx-4"
                  onClick={() => handleOpenQrScanner("Horizontal")}
                />
                <div className="table-responsive mt-3">
                  {isMobile ? (
                    // Vista móvil con colapso
                    stations
                      .filter((station) => {
                        // Validar primero que la categoría sea "Horizontal"
                        if (station.category !== "Horizontal") {
                          return false;
                        }

                        // Normalizamos el término de búsqueda
                        const search = searchTermHorizontal.trim().toLowerCase();
                        const stationPrefix = "station-";
                        const isStationSearch = search.startsWith(stationPrefix);

                        // Verificar si coincide con el término de búsqueda
                        let matchesSearch = false;
                        if (search) {
                          if (isStationSearch) {
                            const stationId = Number(search.replace(stationPrefix, ""));
                            matchesSearch = !isNaN(stationId) && station.id === stationId;
                          } else {
                            const stationName = station.name ? station.name.toLowerCase() : "";
                            const stationDescription = station.description
                              ? station.description.toLowerCase()
                              : "";
                            matchesSearch =
                              stationName.includes(search) || stationDescription.includes(search);
                          }
                        }

                        // Verificar si tiene hallazgos
                        const hasFindings = !!clientStations[station.id];

                        // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                        return hasFindings || matchesSearch;
                      })
                      .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                      .map((station) => {
                        const currentKey = `station-${station.id}`;
                        return (
                          <div
                            key={station.id}
                            className="finding-item border mb-3 p-2"
                            style={{ borderRadius: "5px", backgroundColor: "#f8f9fa" }}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <strong>{station.name || `Estación ${station.description}`}</strong>
                              <div
                                className="icon-toggle"
                                onClick={() => handleCollapseToggle(currentKey)}
                                style={{ cursor: "pointer" }}
                              >
                                {collapseStates[currentKey] ? (
                                  <ArrowUpSquare title="Ocultar" />
                                ) : (
                                  <ArrowDownSquare title="Expandir" />
                                )}
                              </div>
                            </div>
                            <div
                              className={`finding-details ${collapseStates[currentKey] ? "d-block" : "d-none"
                                } mt-2`}
                            >
                              {clientStations[station.id] ? (
                                <>
                                  <p>
                                    <strong>Descripción:</strong>{" "}
                                    {clientStations[station.id].description || "-"}
                                  </p>
                                  <div className="mb-3">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{ width: "150px", objectFit: "cover" }}
                                      />
                                    ) : (
                                      <span>Sin Foto</span>
                                    )}
                                  </div>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
                                  >
                                    Editar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <p>Sin hallazgo reportado</p>
                                  <button
                                    className="btn btn-outline-success"
                                    onClick={() => handleOpenStationModal(station.id)}
                                    disabled={
                                      (techSignaturePreview) ||
                                      userRol === "Cliente"
                                    }
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
                      <tbody>
                        {stations
                          .filter((station) => {
                            console.log("Evaluando estación:", station);

                            // Verificar categoría
                            if (station.category !== "Horizontal") {
                              console.log(
                                `Estación ${station.name || `ID: ${station.id}`} excluida por categoría:`,
                                station.category
                              );
                              return false;
                            }

                            // Normalizamos el término de búsqueda
                            const search = searchTermHorizontal.trim().toLowerCase();
                            const stationPrefix = "station-";
                            const isStationSearch = search.startsWith(stationPrefix);

                            // Verificar si coincide con el término de búsqueda
                            let matchesSearch = false;
                            if (search) {
                              if (isStationSearch) {
                                const stationId = Number(search.replace(stationPrefix, ""));
                                matchesSearch = !isNaN(stationId) && station.id === stationId;
                              } else {
                                const stationName = station.name ? station.name.toLowerCase() : "";
                                const stationDescription = station.description
                                  ? station.description.toLowerCase()
                                  : "";
                                matchesSearch =
                                  stationName.includes(search) || stationDescription.includes(search);
                              }
                            }

                            // Verificar si tiene hallazgos
                            const hasFindings = !!clientStations[station.id];

                            // Mostrar si tiene hallazgos o coincide con el término de búsqueda
                            return hasFindings || matchesSearch;
                          })
                          .sort((a, b) => b.type.localeCompare(a.type)) // Ordenar por `type` alfabéticamente inverso
                          .map((station) => (
                            <tr key={station.id}>
                              <td className="align-middle">
                                {station.name || `Estación ${station.description}`}
                              </td>
                              {clientStations[station.id] ? (
                                <>
                                  <td className="align-middle">
                                    {clientStations[station.id].description || "-"}
                                  </td>
                                  <td className="align-middle mx-1 px-1">
                                    {clientStations[station.id].photo ? (
                                      <img
                                        src={clientStations[station.id].photo}
                                        alt="Foto"
                                        style={{
                                          width: "250px",
                                          objectFit: "cover",
                                          margin: "0px",
                                          padding: "0px",
                                        }}
                                      />
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="align-middle">
                                    {!isMobile && (
                                      <button
                                        className="btn btn-link p-0"
                                        onClick={() => handleViewStationHorizontal(station.id)}
                                        style={{ border: "none", background: "none" }}
                                      >
                                        <Eye
                                          className="mx-2"
                                          size={"25px"}
                                          color="blue"
                                          type="button"
                                        />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-link p-0"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente" || station.type === 'Localización'
                                      }
                                      style={{ border: "none", background: "none" }}
                                    >
                                      <PencilSquare
                                        className="mx-2"
                                        size={"20px"}
                                        color={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "gray"
                                            : "green"
                                        }
                                        type="button"
                                        title={
                                          (techSignaturePreview) ||
                                            userRol === "Cliente"
                                            ? "Inspección firmada, edición bloqueada"
                                            : "Editar"
                                        }
                                      />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td colSpan="2">Sin hallazgo reportado</td>
                                  <td>
                                    <button
                                      className="btn btn-outline-success"
                                      onClick={() => handleOpenStationModal(station.id)}
                                      disabled={
                                        (techSignaturePreview) ||
                                        userRol === "Cliente"
                                      }
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
                          className={`finding-details ${collapseStates[currentKey] ? "d-block" : "d-none"
                            }`}
                        >
                          <div className="col-md-2 mt-3 mb-0 ms-auto text-end">
                            <XCircle
                              size={"18px"}
                              color={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector') ? "gray" : "red"} // Cambiar color si está bloqueado
                              onClick={() => {
                                if ((techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')) {
                                  return;
                                }
                                handleShowConfirmDelete(type, idx);
                              }}
                              style={{
                                cursor: (techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector') ? "not-allowed" : "pointer", // Cambiar cursor si está bloqueado
                              }}
                              title={
                                (techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')
                                  ? "Inspección firmada, acción bloqueada"
                                  : "Eliminar hallazgo"
                              }
                            />
                          </div>
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
                                disabled={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')}
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
                                disabled={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')}
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
                                  disabled={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')}
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
                            color={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector') ? "gray" : "red"} // Cambiar color si está bloqueado
                            onClick={() => {
                              if ((techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')) {
                                return;
                              }
                              handleShowConfirmDelete(type, idx);
                            }}
                            style={{
                              cursor: (techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector') ? "not-allowed" : "pointer", // Cambiar cursor si está bloqueado
                            }}
                            title={
                              (techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')
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
                              disabled={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')}
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
                              disabled={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')}
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
                                disabled={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')}
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
              disabled={(techSignaturePreview && userRol !== 'Cliente') || (userRol !== 'Cliente' && type === 'Observaciones Cliente') || (userRol !== 'Supervisor Técnico' && type === 'Observaciones Inspector') || (userRol !== 'SST' && type === 'Observaciones SST') || (userRol === 'Cliente' && type !== 'Observaciones Cliente' && type !== 'Observaciones SST' && type !== 'Observaciones Inspector')}
            >
              + Agregar Hallazgo
            </button>

            {type !== 'Observaciones Cliente' && type !== 'Observaciones Inspector' && type !== 'Observaciones SST' && (
              <>
                {/* Producto */}
                <hr></hr>
                <h6 className='mt-2'>Producto</h6>
                <div className="row" style={{ minHeight: 0, height: 'auto' }}>
                  <div className="col-md-12 mb-3">
                    <select
                      id={`product-${type}`}
                      className="form-select"
                      value={productsByType[type]?.product || ''}
                      onChange={(e) => handleProductChange(type, 'product', e.target.value)}
                      disabled={techSignaturePreview || userRol === 'Cliente'}
                    >
                      <option value="">Seleccione un producto</option>
                      {getFilteredProducts(type).map((product) => (
                        <option key={product.id} value={product.name}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {/* Sección de Firma */}
      <div className="card border-success mt-4">
        <div className="card-header">Firmas</div>
        <div className="card-body">

          {/* si la inspección NO está firmada aún … */}
          {!techSignaturePreview && userRol !== 'Cliente' && (
            <div className="text-center">

              <OverlayTrigger
                placement="top"
                overlay={renderTooltip}               // SIEMPRE un elemento
                trigger={canSign ? [] : ['hover', 'focus', 'click']} // sin disparadores ⇒ no se muestra
              >
                {/*  El span sigue siendo el wrapper que captura el hover cuando el
      botón está disable  */}
                <span
                  className="d-inline-block"
                  onClick={e => { if (!canSign) e.preventDefault(); }}
                >
                  <Button
                    variant="outline-success"
                    disabled={!canSign}
                    onClick={() => setSignModalOpen(true)}
                    style={!canSign ? { pointerEvents: 'none' } : {}}
                  >
                    Firmar
                  </Button>
                </span>
              </OverlayTrigger>


            </div>
          )}

          {/* … si ya hay firma, sigues mostrando la pre-visualización tal como lo tienes */}
          {techSignaturePreview && (
            <>
              <div className="mb-4 text-center">
                <h5>Firma del Operario</h5>
                <img
                  src={techSignaturePreview}
                  alt="Firma del Técnico"
                  style={{ width: isMobile ? 280 : 700, height: 200, objectFit: 'contain', border: '1px solid #ddd' }}
                />
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
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              rows="3"
              value={stationFinding.description || ''}

              onChange={(e) => handleStationFindingChange('description', e.target.value)}
              placeholder="Ingrese una descripción del hallazgo"
              disabled={techSignaturePreview || userRol === 'Cliente'}
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
                disabled={techSignaturePreview || userRol === 'Cliente'}
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



      <Modal show={viewStationModalOpen} onHide={() => setViewStationModalOpen(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Detalles de la Estación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
            <h5 className="mb-3">Firma del Operario</h5>
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
                disabled={techSignaturePreview || userRol === 'Cliente'}
              />
            </div>
            <div className="mt-4 text-center">
              <h6>Datos del Operario</h6>
              <p><strong>Nombre:</strong> {storedUserInfo?.name || 'No disponible'} {storedUserInfo?.lastname}</p>
              <p><strong>Cédula:</strong> {storedUserInfo?.id_usuario || 'No disponible'}</p>
              <p><strong>Cargo:</strong> {userRol || 'No disponible'}</p>
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
              if (sigCanvasTech.current.isEmpty()) {
                showNotification("La firma es obligatoria.");
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
                  const response = await api.post("/PrefirmarArchivosPDF", {
                    url: selectedDocument.document_url,
                  });

                  if (response.data.signedUrl) {
                    setPdfUrl(response.data.signedUrl);
                    setShowModal(true);
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

                const sendResponse = await api.post("/enviar-botix-acta", payload);

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

                const sendResponse = await api.post("/enviar-acta-por-correo", payload);

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
                  style={{ width: "1rem", height: "1rem" }}
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
        show={showModal}
        onHide={() => setShowModal(false)}
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
            zIndex: 1050,
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

export default Inspection;
