import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// Crear el contexto
const SocketContext = createContext(null);

// Hook para usar el contexto
export const useSocket = () => useContext(SocketContext);

// Proveedor del contexto
export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Inicializa el socket y guarda la referencia
        socketRef.current = io("http://localhost:10000");

        // Log para depuración
        socketRef.current.on('connect', () => {
            console.log(`Conectado al servidor Socket.IO con ID: ${socketRef.current.id}`);
            const storedUserInfo = localStorage.getItem("user_info");
            if (storedUserInfo) {
                const userData = JSON.parse(storedUserInfo);
                // Asegúrate de que `socketRef.current` esté inicializado
                socketRef.current.emit('register', userData.id_usuario);
                console.log(`Usuario registrado en el socket: ${userData.id_usuario}`);
            }
        });

        // Manejar desconexión
        socketRef.current.on('disconnect', () => {
            console.log('Socket desconectado');
        });

        // Limpieza al desmontar
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
};
