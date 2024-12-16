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

// Reportar métricas de rendimiento (opcional)
reportWebVitals();