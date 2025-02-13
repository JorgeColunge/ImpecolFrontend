import { openDB } from 'idb';
import api from './Api';
import axios from 'axios';

// Inicializar IndexedDB para los usuarios
export const initUsersDB = async () => {
    return openDB('offline-ddbb', 3, { // Incrementa la versión a 3
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          // Crear otros object stores si los necesitas
        }
        if (oldVersion < 2) {
          // Crear el object store para usuarios si no existe
          if (!db.objectStoreNames.contains('users')) {
            db.createObjectStore('users', { keyPath: 'id' });
          }
        }
      },
    });
  };

  export const initDB = async () => {
    return openDB('offline-ddbb', 3, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('stationFindings')) {
          db.createObjectStore('stationFindings', { keyPath: 'id' });
        }
      },
    });
  };

  const getImageUrl = (image) => {
    if (!image) return null;
    return image.startsWith('http') ? image : `${process.env.REACT_APP_API_URL}${image}`;
  };
  

    // Guardar usuarios en IndexedDB
    export const saveUsers = async (users, initialSync) => {
    // Procesar previamente las imágenes
    const processedUsers = await Promise.all(
      users.map(async (user) => {
        if (user.image) {
          try {
              // Primero, solicita la URL prefirmada desde el backend
              const preSignedResponse = await api.post('/PrefirmarArchivos', { url: user.image });

              if (preSignedResponse.data?.signedUrl) {
                  const imageUrl = preSignedResponse.data.signedUrl;

                  // Descarga la imagen desde la URL prefirmada
                  const response = await fetch(imageUrl);
                  if (response.ok) {
                      const blob = await response.blob();
                      user.imageBlob = blob;
                      console.log(`Imagen descargada correctamente para el usuario ${user.id}`);
                  } else {
                      console.warn(`No se pudo obtener la imagen para el usuario ${user.id}`);
                      user.imageBlob = null;
                  }
              } else {
                  console.warn(`No se obtuvo una URL prefirmada para el usuario ${user.id}`);
                  user.imageBlob = null;
              }
          } catch (error) {
              console.error(`Error al procesar la imagen del usuario ${user.id}:`, error);
              user.imageBlob = null;
          }
      }
        return user;
      })
    );

    // Ahora guarda los usuarios en IndexedDB
    const db = await initUsersDB();
    const tx = db.transaction('users', 'readwrite');
    const store = tx.objectStore('users');
  
    // Las operaciones de IndexedDB son rápidas y síncronas
    processedUsers.forEach((user) => {
      user.synced = initialSync;
      console.log(`Guardando usuario en IndexedDB: ${user.id}`, user);
      store.put(user); // Guarda cada usuario
    });
  
    await tx.done; // Finaliza la transacción
    console.log('Usuarios guardados en IndexedDB con imágenes.');
  };
  

  export const getUsers = async () => {
    const db = await initUsersDB();
    const users = await db.getAll('users');

    console.log('Usuarios recuperados de IndexedDB:', users);

    // Convierte los blobs en URLs locales
    users.forEach((user) => {
        if (user.imageBlob) {
            user.imageUrl = URL.createObjectURL(user.imageBlob); // Genera una URL temporal desde el blob
            console.log(`URL de imagen creada para usuario ${user.id}:`, user.imageUrl);
        } else {
            console.warn(`Usuario ${user.id} no tiene una imagen almacenada en IndexedDB.`);
        }
    });

    return users;
  };   
  
  export const syncUsers = async () => {
    const db = await initUsersDB();
  
    const allUsers = await db.getAll('users'); // Obtén todos los usuarios
    const unsyncedUsers = allUsers.filter((user) => !user.synced); // Filtra los no sincronizados
  
    console.log('Usuarios no sincronizados:', unsyncedUsers);
  
    if (unsyncedUsers.length === 0) {
      console.log('No hay usuarios para sincronizar.');
      return;
    }
  
    try {
      for (const user of unsyncedUsers) {
        console.log(`Sincronizando usuario: ${user.id}`, user);
  
        const formData = new FormData();
        formData.append('id', user.id);
        formData.append('name', user.name);
        formData.append('lastname', user.lastname);
        formData.append('phone', user.phone);
        formData.append('rol', user.rol);
        formData.append('password', user.password);
        formData.append('email', user.email);
  
        if (user.imageBlob) {
          formData.append('image', user.imageBlob, `${user.id}.jpg`);
        }
  
        // Sincroniza el usuario con el servidor
        try {
          await api.post('/register', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
  
          console.log(`Usuario sincronizado correctamente: ${user.id}`);
  
          // Actualiza el estado del usuario en IndexedDB
          const tx = db.transaction('users', 'readwrite');
          const store = tx.objectStore('users');
          user.synced = true; // Marca como sincronizado
          await store.put(user);
          await tx.done; // Finaliza la transacción
        } catch (syncError) {
          console.error(`Error al sincronizar el usuario ${user.id}:`, syncError);
        }
      }
    } catch (globalError) {
      console.error('Error global durante la sincronización de usuarios:', globalError);
    } finally {
      console.log('Sincronización completada.');
    }
  };

  export const syncUsersOnStart = async () => {
    try {
        const db = await initUsersDB();
        const usersInDB = await db.getAll('users');
        
        if (navigator.onLine) { // Verifica si hay conexión
            const response = await api.get('/users');
            const serverUsers = response.data; // Usuarios obtenidos del servidor
            
            // Crear un Set con los IDs de los usuarios del servidor
            const serverUserIds = new Set(serverUsers.map(user => user.id));

            // Eliminar usuarios de IndexedDB que no están en el servidor
            const tx = db.transaction('users', 'readwrite');
            const store = tx.objectStore('users');
            for (const user of usersInDB) {
                if (!serverUserIds.has(user.id)) { // Si el ID no está en el servidor, eliminarlo
                    console.log(`Eliminando usuario de IndexedDB: ${user.id}`);
                    await store.delete(user.id);
                }
            }
            await tx.done;

            // Guardar los nuevos usuarios en IndexedDB
            await saveUsers(serverUsers, true);
            console.log('Usuarios sincronizados en IndexedDB.');

        } else {
            console.log('No hay conexión a Internet. No se pueden sincronizar los usuarios.');
        }
    } catch (error) {
        console.error('Error al sincronizar usuarios en el inicio:', error);
    }
};

// Inicializa IndexedDB para perfiles
export const initProfileDB = async () => {
    return openDB('offline-profile', 3, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('profile')) {
                db.createObjectStore('profile', { keyPath: 'id' });
            }
        },
    });
};

// Guardar perfil en IndexedDB
export const saveProfile = async (user) => {
    const db = await initProfileDB();
    const tx = db.transaction('profile', 'readwrite');
    const store = tx.objectStore('profile');
    await store.put(user);
    await tx.done;
    console.log(`Perfil de usuario ${user.id} guardado en IndexedDB.`);
};

// Obtener perfil desde IndexedDB
export const getProfile = async (userId) => {
    const db = await initProfileDB();
    return await db.get('profile', userId);
};


// Inicializar IndexedDB para servicios y clientes
export const initServicesDB = async () => {
  return openDB('offline-services', 6, { // Asegura que la versión sea mayor a la anterior
      upgrade(db, oldVersion) {
          if (oldVersion < 6) {
              if (!db.objectStoreNames.contains('services')) {
                  db.createObjectStore('services', { keyPath: 'id' });
              }
              if (!db.objectStoreNames.contains('clients')) {
                  db.createObjectStore('clients', { keyPath: 'id' });
              }
              if (!db.objectStoreNames.contains('events')) {
                db.createObjectStore('events', { keyPath: 'id' });
              }
              if (!db.objectStoreNames.contains('technicians')) {
                db.createObjectStore('technicians', { keyPath: 'id' });
              }
              if (!db.objectStoreNames.contains('inspections')) {
                db.createObjectStore('inspections', { keyPath: 'id' });
              }
          }
      },
  });
};

// Guardar servicios y clientes en IndexedDB
export const saveServices = async (services, clients) => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction(['services', 'clients'], 'readwrite');
      const serviceStore = tx.objectStore('services');
      const clientStore = tx.objectStore('clients');

      // Guardar cada servicio en IndexedDB
      for (const service of services) {
          await serviceStore.put(service);
      }

      // Guardar cada cliente en IndexedDB correctamente
      for (const clientId in clients) {
          if (clients.hasOwnProperty(clientId)) {
              const clientData = clients[clientId];
              if (typeof clientData === 'string') {
                  // Si clientData es una cadena, guardarlo como objeto correctamente
                  await clientStore.put({ id: clientId, name: clientData });
              } else if (typeof clientData === 'object' && clientData !== null) {
                  // Si ya es un objeto, guardarlo tal cual
                  await clientStore.put({ id: clientId, ...clientData });
              }
          }
      }

      await tx.done;
      console.log("✅ Servicios y clientes guardados correctamente en IndexedDB.");
  } catch (error) {
      console.error("❌ Error al guardar servicios y clientes en IndexedDB:", error);
  }
};

// Obtener servicios y clientes desde IndexedDB
export const getServices = async () => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction(['services', 'clients'], 'readonly');
      const services = await tx.objectStore('services').getAll();
      const clients = await tx.objectStore('clients').getAll();

      // Convertir la lista de clientes en un objeto { id: name }
      const clientMap = clients.reduce((acc, client) => {
          if (typeof client.name === 'string') {
              acc[client.id] = client.name;
          } else {
              console.warn(`⚠️ Cliente mal almacenado en IndexedDB:`, client);
          }
          return acc;
      }, {});

      return { services, clients: clientMap };
  } catch (error) {
      console.error("❌ Error al obtener servicios y clientes desde IndexedDB:", error);
      return { services: [], clients: {} };
  }
};

// Sincronizar servicios con el backend
export const syncServicesOnStart = async () => {
  try {
      const db = await initServicesDB();
      const storedServices = await db.transaction('services', 'readonly').objectStore('services').getAll();

      if (navigator.onLine) {
          console.log("🌐 Modo online: obteniendo servicios desde el servidor...");
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/services`);
          const serverServices = response.data;

          // Obtener los clientes relacionados
          const clientData = {};
          for (const service of serverServices) {
              if (service.client_id && !clientData[service.client_id]) {
                  try {
                      const clientResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/clients/${service.client_id}`);
                      clientData[service.client_id] = clientResponse.data; // Guardar el objeto completo
                  } catch (error) {
                      console.error(`⚠️ Error obteniendo cliente ${service.client_id}:`, error);
                  }
              }
          }

          // Crear un Set con los IDs de los servicios del servidor
          const serverServiceIds = new Set(serverServices.map(service => service.id));

          // Eliminar servicios que ya no existen en el servidor
          const tx = db.transaction('services', 'readwrite');
          const store = tx.objectStore('services');

          for (const service of storedServices) {
              if (!serverServiceIds.has(service.id)) {
                  console.log(`🗑 Eliminando servicio obsoleto de IndexedDB: ${service.id}`);
                  await store.delete(service.id);
              }
          }
          await tx.done;

          // Guardar los servicios y clientes actualizados en IndexedDB
          await saveServices(serverServices, clientData);
          console.log("✅ Servicios y clientes sincronizados en IndexedDB.");
      } else {
          console.log("📴 Modo offline: usando datos desde IndexedDB.");
      }
  } catch (error) {
      console.error("❌ Error al sincronizar servicios y clientes:", error);
  }
};


// Inicializar IndexedDB para clientes
export const initClientsDB = async () => {
  return openDB('offline-clients', 1, { // Asegurar nueva versión
      upgrade(db, oldVersion) {
          if (oldVersion < 6) {
              if (!db.objectStoreNames.contains('clients')) {
                  db.createObjectStore('clients', { keyPath: 'id' });
              }
          }
      },
  });
};

// Guardar clientes en IndexedDB
export const saveClients = async (clients) => {
  try {
      const db = await initClientsDB();
      const tx = db.transaction('clients', 'readwrite');
      const store = tx.objectStore('clients');

      for (const client of clients) {
          await store.put(client);
      }

      await tx.done;
      console.log("Clientes guardados en IndexedDB.");
  } catch (error) {
      console.error("Error al guardar clientes en IndexedDB:", error);
  }
};

// Obtener clientes desde IndexedDB
export const getClients = async () => {
  try {
      const db = await initClientsDB();
      const tx = db.transaction('clients', 'readonly');
      const store = tx.objectStore('clients');
      return await store.getAll();
  } catch (error) {
      console.error("Error al obtener clientes desde IndexedDB:", error);
      return [];
  }
};

export const saveEvents = async (events) => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction('events', 'readwrite');
      const eventStore = tx.objectStore('events');

      // Guardar cada evento en IndexedDB
      for (const event of events) {
          await eventStore.put(event);
      }

      await tx.done;
      console.log("✅ Eventos guardados correctamente en IndexedDB.");
  } catch (error) {
      console.error("❌ Error al guardar eventos en IndexedDB:", error);
  }
};

export const getEvents = async () => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction('events', 'readonly');
      const events = await tx.objectStore('events').getAll();

      console.log("📂 Eventos obtenidos desde IndexedDB:", events);
      return events;
  } catch (error) {
      console.error("❌ Error al obtener eventos desde IndexedDB:", error);
      return [];
  }
};

export const saveTechnicians = async (technicians) => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction('technicians', 'readwrite');
      const techStore = tx.objectStore('technicians');

      // Guardar cada técnico en IndexedDB
      for (const technician of technicians) {
          await techStore.put(technician);
      }

      await tx.done;
      console.log("✅ Técnicos guardados correctamente en IndexedDB.");
  } catch (error) {
      console.error("❌ Error al guardar técnicos en IndexedDB:", error);
  }
};

export const getTechnicians = async () => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction('technicians', 'readonly');
      const technicians = await tx.objectStore('technicians').getAll();

      console.log("📂 Técnicos obtenidos desde IndexedDB:", technicians);
      return technicians;
  } catch (error) {
      console.error("❌ Error al obtener técnicos desde IndexedDB:", error);
      return [];
  }
};


export const saveInspections = async (inspections) => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction('inspections', 'readwrite');
      const inspectionStore = tx.objectStore('inspections');

      console.log("🔄 Guardando inspecciones en IndexedDB...", inspections);

      for (const inspection of inspections) {
          console.log("➡️ Guardando inspección con service_id:", inspection.service_id, " - ID:", inspection.id);
          await inspectionStore.put(inspection);
      }

      await tx.done;
      console.log("✅ Inspecciones guardadas correctamente en IndexedDB.");
  } catch (error) {
      console.error("❌ Error al guardar inspecciones en IndexedDB:", error);
  }
};

export const getInspections = async (serviceId) => {
  try {
      const db = await initServicesDB();
      const tx = db.transaction('inspections', 'readonly');
      const allInspections = await tx.objectStore('inspections').getAll();

      console.log("📂 Todas las inspecciones en IndexedDB:", allInspections);

      // Convertimos serviceId a string para asegurar que el filtrado funcione correctamente
      const serviceIdStr = String(serviceId);

      // Filtrar solo las inspecciones que pertenecen al servicio
      const serviceInspections = allInspections.filter(ins => String(ins.service_id) === serviceIdStr);

      console.log(`📂 Inspecciones obtenidas desde IndexedDB para el servicio ${serviceId}:`, serviceInspections);
      return serviceInspections;
  } catch (error) {
      console.error("❌ Error al obtener inspecciones desde IndexedDB:", error);
      return [];
  }
};
