import axios from 'axios';
import { saveRequest, isOffline, convertFormDataToObject } from './offlineHandler';

// Helper para inspeccionar FormData
const inspectFormData = (formData) => {
  const inspectedData = {};
  if (formData instanceof FormData) {
    for (const [key, value] of formData.entries()) {
      inspectedData[key] = value instanceof Blob ? `Blob(${value.type}, ${value.size} bytes)` : value;
    }
  }
  return inspectedData;
};

const api = axios.create({
  baseURL: 'http://localhost:10000/api',
});

api.interceptors.request.use(async (config) => {
  if (isOffline()) {
    console.log('📡 [OFFLINE] Interceptando solicitud offline:', config);

    let serializableBody;
    if (config.data instanceof FormData) {
      serializableBody = await convertFormDataToObject(config.data);
    } else {
      serializableBody = config.data;
    }

    console.log('📄 [OFFLINE] Estructura de la solicitud serializable:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      body: serializableBody,
    });

    await saveRequest({
      url: config.url,
      method: config.method,
      headers: config.headers,
      body: serializableBody,
    });

    // Incrementar el contador de solicitudes pendientes en localStorage
    const currentSyncCount = parseInt(localStorage.getItem('sync') || '0', 10);
    const newSyncCount = currentSyncCount + 1;
    localStorage.setItem('sync', newSyncCount.toString());

    // Notificar manualmente sobre el cambio
    const syncEvent = new CustomEvent('syncUpdate', { detail: newSyncCount });
    window.dispatchEvent(syncEvent);

    return Promise.reject({ message: 'Offline: la solicitud se guardó localmente' });
  } else {
    console.log('🌐 [ONLINE] Enviando solicitud online:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      body: config.data instanceof FormData ? inspectFormData(config.data) : config.data,
    });
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
