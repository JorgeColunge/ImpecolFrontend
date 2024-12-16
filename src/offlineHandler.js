import { openDB } from 'idb';

// Inicializar IndexedDB
const initDB = async () => {
  return openDB('offline-db', 2, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('requests')) {
        db.createObjectStore('requests', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

// Guardar solicitud
// Guardar solicitud
export const saveRequest = async (request) => {
  try {
    const db = await initDB();
    const tx = db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');

    const completeUrl = request.url.startsWith('http')
      ? request.url
      : `http://localhost:10000/api${request.url}`;

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
  const db = await initDB();
  await db.clear('requests');
};

// Detectar si está offline
export const isOffline = () => !navigator.onLine;

export const syncRequests = async () => {
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
