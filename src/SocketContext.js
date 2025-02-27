import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Crear el contexto
const SocketContext = createContext(null);

// Hook para usar el contexto
export const useSocket = () => useContext(SocketContext);

// Proveedor del contexto
export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Si el socket ya existe, no lo volvemos a crear
        if (!socketRef.current) {
            console.log('🔌 Inicializando conexión con el servidor Socket.IO...');
            socketRef.current = io(`${process.env.REACT_APP_API_URL}`, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 3000,
            });

            socketRef.current.on('connect', () => {
                console.log(`✅ Conectado al servidor Socket.IO con ID: ${socketRef.current.id}`);
                setIsConnected(true);

                const storedUserInfo = localStorage.getItem("user_info");
                if (storedUserInfo) {
                    const userData = JSON.parse(storedUserInfo);
                    socketRef.current.emit('register', userData.id_usuario);
                    console.log(`👤 Usuario registrado en el socket: ${userData.id_usuario}`);
                }
            });

            socketRef.current.on('disconnect', (reason) => {
                console.log(`❌ Socket desconectado: ${reason}`);
                setIsConnected(false);
            });

            socketRef.current.on('reconnect_attempt', () => {
                console.log('🔄 Intentando reconectar...');
            });

            socketRef.current.on('reconnect', (attemptNumber) => {
                console.log(`🔄 Reconexion exitosa después de ${attemptNumber} intentos`);
            });

            socketRef.current.on('reconnect_failed', () => {
                console.log('⚠️ Falló la reconexión después de varios intentos');
            });
        }

        const handleOnline = () => {
            console.log('🌐 Conexión a internet restaurada. Intentando reconectar socket...');
            if (!socketRef.current.connected) {
                socketRef.current.connect();
            }
        };

        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('online', handleOnline);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []); // Se ejecuta solo una vez

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
};
