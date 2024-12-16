import { openDB } from 'idb';
import api from './Api';

// Inicializar IndexedDB para los usuarios
export const initUsersDB = async () => {
    return openDB('offline-db', 2, { // Incrementa la versión a 2
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
    return openDB('offline-db', 2, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('stationFindings')) {
          db.createObjectStore('stationFindings', { keyPath: 'id' });
        }
      },
    });
  };
  

// Guardar usuarios en IndexedDB
export const saveUsers = async (users, initialSync) => {
    // Procesar previamente las imágenes
    const processedUsers = await Promise.all(
      users.map(async (user) => {
        if (user.image) {
          try {
            const response = await fetch(`http://localhost:10000${user.image}`);
            if (response.ok) {
              const blob = await response.blob();
              user.imageBlob = blob; // Almacena el blob en el objeto del usuario
            } else {
              console.warn(`No se pudo obtener la imagen para el usuario ${user.id}`);
              user.imageBlob = null; // Si no se pudo obtener, almacena null
            }
          } catch (error) {
            console.error(`Error al procesar la imagen del usuario ${user.id}:`, error);
            user.imageBlob = null; // Si ocurre un error, almacena null
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
  
    // Convierte los blobs en URLs locales
    users.forEach((user) => {
      if (user.imageBlob && !user.imageUrl) {
        user.imageUrl = URL.createObjectURL(user.imageBlob); // Genera una URL temporal desde el blob
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