import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { UnsavedChangesProvider } from './UnsavedChangesContext';
import reportWebVitals from './reportWebVitals';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Iconos FontAwesome
import 'bootstrap/dist/css/bootstrap.min.css'; // Estilos de Bootstrap

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <UnsavedChangesProvider>
    <App />
  </UnsavedChangesProvider>
);

// 📢 Registrar Service Worker si es compatible
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ Service Worker registrado con éxito:', registration);
      })
      .catch(error => {
        console.error('❌ Error registrando Service Worker:', error);
      });
  });
}

// Reportar métricas de rendimiento (opcional)
reportWebVitals();
