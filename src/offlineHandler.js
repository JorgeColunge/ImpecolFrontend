import { openDB } from 'idb';
import { updateInspection } from './indexedDBHandler';

// Inicializar IndexedDB
const initDB = async () => {
  return openDB('offline-db', 3, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`🔄 Actualizando IndexedDB de versión ${oldVersion} a ${newVersion}`);

      if (!db.objectStoreNames.contains('requests')) {
        console.log('🛠️ Creando Object Store "requests" en IndexedDB...');
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      } else {
        console.log('✅ Object Store "requests" ya existe.');
      }
    },
  });
};

// Guardar solicitud
export const saveRequest = async (request) => {
  try {
    const db = await initDB();
    const tx = db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');

    const completeUrl = request.url.startsWith('http')
      ? request.url
      : `${process.env.REACT_APP_API_URL}/api${request.url}`;

    let serializableBody;
    if (request.body instanceof FormData) {
      serializableBody = await convertFormDataToObject(request.body);
    } else {
      serializableBody = request.body;
    }

    const serializableRequest = {
      ...request,
      url: completeUrl,
      body: serializableBody,
    };

    console.log('🔍 Verificando estructura antes de guardar en IndexedDB:', serializableRequest);

    await store.add(serializableRequest);
    await tx.done;
    console.log('✅ Solicitud guardada correctamente en IndexedDB:', serializableRequest);
  } catch (error) {
    console.error('❌ Error al guardar la solicitud offline:', error);
  }
};

// Convertir FormData a Objeto Serializable
export const convertFormDataToObject = async (formData) => {
  const object = {};
  const promises = [];

  formData.forEach((value, key) => {
    if (value instanceof Blob) {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
          if (reader.result) {
            if (!object[key]) {
              object[key] = [];
            }

            // Añadimos cada imagen a una lista para soportar múltiples archivos
            object[key].push({
              type: value.type,
              data: reader.result,
              name: value.name || key,
            });

            console.log(`✅ Blob convertido correctamente a base64 para ${key}:`, object[key]);
            resolve();
          } else {
            console.error(`❌ Error al leer el blob para ${key}`, value);
            reject(new Error(`No se pudo leer el blob para ${key}`));
          }
        };

        reader.onerror = () => {
          console.error(`❌ Error al procesar el blob para ${key}`, reader.error);
          reject(reader.error);
        };

        reader.readAsDataURL(value);
      });

      promises.push(promise);
    } else {
      object[key] = value;
    }
  });

  try {
    await Promise.all(promises);
    // 🔍 Agregar log para ver generalObservations
    if (object.generalObservations) {
      console.log(`📝📝📝📝📝 generalObservations 📝📝📝📝📝📝`, object.generalObservations);
    }

    // 🔍 Agregar log para ver exitTime
    if (object.exitTime) {
      console.log(`📝📝📝📝📝 exitTime 📝📝📝📝📝📝`, object.exitTime);
    }

    // 🔄 Construcción del campo findings con datos locales
    const parsedFindingsByType = object.findingsByType 
      ? (typeof object.findingsByType === "string" ? JSON.parse(object.findingsByType) : object.findingsByType) 
      : {};
      
    const parsedProductsByType = object.productsByType 
      ? (typeof object.productsByType === "string" ? JSON.parse(object.productsByType) : object.productsByType) 
      : {};

    const parsedStationsFindings = object.stationsFindings 
      ? (typeof object.stationsFindings === "string" ? JSON.parse(object.stationsFindings) : object.stationsFindings) 
      : [];

    const parsedSignatures = object.signatures 
      ? (typeof object.signatures === "string" ? JSON.parse(object.signatures) : object.signatures) 
      : {};

    // 📌 Construir URLs locales para imágenes
    const findingsImagesById = {};
    if (object.findingsImages && Array.isArray(object.findingsImages)) {
      object.findingsImages.forEach(image => {
        if (image.id) {
          findingsImagesById[image.id] = image.localUrl; // Usar la URL local en IndexedDB
        }
      });
    }

    const stationImagesById = {};
    if (object.stationImages && Array.isArray(object.stationImages)) {
      object.stationImages.forEach(image => {
        if (image.id) {
          stationImagesById[image.id] = image.localUrl; // Usar la URL local en IndexedDB
        }
      });
    }

    // Asociar imágenes a `findingsByType`
    Object.keys(parsedFindingsByType).forEach(type => {
      parsedFindingsByType[type] = parsedFindingsByType[type].map(finding => {
        // Asocia la imagen correspondiente al ID del hallazgo
        if (findingsImagesById[finding.id]) {
          finding.photo = findingsImagesById[finding.id];
        }
        return finding;
      });
    });

    // Asociar imágenes a `stationsFindings`
    parsedStationsFindings.forEach(finding => {
      if (stationImagesById[finding.stationId]) {
        finding.photo = stationImagesById[finding.stationId];
      }
    });

    // Reconstruir el objeto signatures con URLs locales
    const updatedSignatures = {
      client: {
        id: parsedSignatures?.client?.id || null,
        name: parsedSignatures?.client?.name || null,
        position: parsedSignatures?.client?.position || null,
        signature: parsedSignatures?.client?.signature || null, // Mantener firma local
      },
      technician: {
        id: parsedSignatures?.technician?.id || null,
        name: parsedSignatures?.technician?.name || null,
        role: parsedSignatures?.technician?.role || null,
        signature: parsedSignatures?.technician?.signature || null, // Mantener firma local
      },
    };

    // Construir objeto final de findings
    const findings = {
      findingsByType: parsedFindingsByType,
      productsByType: parsedProductsByType,
      stationsFindings: parsedStationsFindings,
      signatures: updatedSignatures,
      genericImages: object.genericImages || [], // Usar imágenes locales si existen
      findingsImages: object.findingsImages ? object.findingsImages.map(img => img.localUrl) : [], // Usar imágenes locales
      stationImages: object.stationImages ? object.stationImages.map(img => img.localUrl) : [], // Usar imágenes locales
    };

    // 🔍 Agregar log para ver findings construido
    console.log(`📝📝📝📝📝 findings construido 📝📝📝📝📝📝`, findings);

    // 📌 Llamar a la función para actualizar IndexedDB solo si hay inspectionId
    if (object.inspectionId) {
      await updateInspection(object.inspectionId, object.generalObservations, object.exitTime, findings);
    }
    return object;
  } catch (error) {
    console.error(`❌ Error al convertir FormData a objeto:`, error);
    throw error;
  }
};


export const reconstructFormData = (data) => {
  const formData = new FormData();
  console.log('🔄 Datos originales para reconstrucción:', data);

  // 1. Añadir campos JSON relevantes directamente
  const jsonFields = ['findingsByType', 'stationsFindings', 'productsByType', 'signatures'];
  jsonFields.forEach((key) => {
    if (data[key]) {
      const jsonValue = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      formData.append(key, jsonValue);
      console.log(`✅ Campo JSON reconstruido para ${key}:`, jsonValue);
    }
  });

  // 2. Añadir imágenes por categoría
  const imageFields = ['tech_signature', 'client_signature', 'findingsImages', 'stationImages', 'images'];
  imageFields.forEach((field) => {
    if (Array.isArray(data[field])) {
      data[field].forEach((image) => {
        const blob = convertBase64ToBlob(image.data, image.type);
        formData.append(field, blob, image.name);
        console.log(`✅ Imagen añadida al campo ${field}: ${image.name}`);
      });
    }
  });

  // 3. Campos simples (ej., inspectionId, generalObservations)
  Object.entries(data).forEach(([key, value]) => {
    if (!jsonFields.includes(key) && !imageFields.includes(key)) {
      formData.append(key, value);
      console.log(`✅ Campo simple agregado para ${key}:`, value);
    }
  });

  console.log('✅ FormData reconstruido:', Array.from(formData.entries()));
  return formData;
};

// Convertir Base64 a Blob
const convertBase64ToBlob = (base64, type) => {
  if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) {
    console.error('❌ Base64 inválido o no definido:', base64);
    return null;
  }

  try {
    const [, base64Data] = base64.split(',');
    const byteString = atob(base64Data);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([ab], { type });
    console.log(`✅ Blob reconstruido correctamente con tipo ${type}:`, blob);
    return blob;
  } catch (error) {
    console.error('❌ Error al convertir Base64 a Blob:', error, base64);
    return null;
  }
};


// Obtener todas las solicitudes almacenadas
export const getRequests = async () => {
  const db = await initDB();
  return db.getAll('requests');
};

// Eliminar solicitudes sincronizadas
export const clearRequests = async () => {
  try {
    const db = await initDB();
    
    if (!db.objectStoreNames.contains('requests')) {
      console.warn('⚠️ No hay datos en IndexedDB para eliminar.');
      return;
    }

    await db.clear('requests');
    console.log('✅ Solicitudes eliminadas de IndexedDB.');
  } catch (error) {
    console.error('❌ Error al eliminar solicitudes en IndexedDB:', error);
  }
};


// Detectar si está offline
export const isOffline = () => !navigator.onLine;

export const syncRequests = async () => {
  const db = await initDB();
  
  if (!db.objectStoreNames.contains('requests')) {
    console.warn('⚠️ No hay solicitudes almacenadas, evitando error.');
    return;
  }
  
  const requests = await getRequests();

  if (requests.length === 0) {
    console.log('✅ No hay solicitudes para sincronizar.');
    localStorage.setItem('sync', '0');

    // Emitir evento manual para reflejar el cambio
    const syncEvent = new CustomEvent('syncUpdate', { detail: 0 });
    window.dispatchEvent(syncEvent);
    return;
  }

  console.log('🔄 Iniciando sincronización de solicitudes:', requests);

  for (const req of requests) {
    console.log(`🔍 Procesando solicitud para URL: ${req.url}`);

    try {
      const formData = reconstructFormData(req.body);

      console.log(`🔄 Campos en FormData para ${req.url}:`, Array.from(formData.entries()));

      const response = await fetch(req.url, {
        method: req.method,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error en la solicitud ${req.url}: ${response.status} - ${errorText}`);
        continue;
      }

      console.log(`✅ Solicitud sincronizada correctamente: ${req.url}`);
      // Reducir el contador en localStorage
      const currentSyncCount = parseInt(localStorage.getItem('sync') || '0', 10);
      const newSyncCount = Math.max(0, currentSyncCount - 1); // Asegurarnos de que no sea negativo
      localStorage.setItem('sync', newSyncCount.toString());
      // Emitir evento manual para reflejar el cambio
      const syncEvent = new CustomEvent('syncUpdate', { detail: newSyncCount });
      window.dispatchEvent(syncEvent);
    } catch (error) {
      console.error(`❌ Error al sincronizar la solicitud ${req.url}:`, error);
    }
  }

  await clearRequests();
  console.log('✅ Sincronización completada y solicitudes eliminadas.');
};
