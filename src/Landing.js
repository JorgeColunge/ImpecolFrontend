import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
//import './Landing.css';

function Landing() {
  const handleInstall = () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        window.deferredPrompt = null;
      });
    } else {
      alert('La opción de instalación no está disponible en este momento.');
    }
  };

  return (
    <div className="container-fluid bg-light vh-100 d-flex flex-column align-items-center justify-content-center">
      <div className="row w-100">
        {/* Sección del banner */}
        <div className="col-12 text-center mb-5">
          <img src="/images/LogoImpecol.png" alt="Logo" className="img-fluid mb-3" style={{ maxWidth: '200px' }} />
          <h1 className="display-4">¡Limpieza impecable al alcance de tus manos!</h1>
          <p className="lead">Descarga nuestra aplicación móvil directamente desde tu navegador o úsala en la web.</p>
        </div>

        {/* Sección de botones para descargar y usar en la web */}
        <div className="col-12 text-center">
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button
              onClick={handleInstall}
              className="btn btn-success btn-lg px-4 py-3 d-flex align-items-center gap-2"
            >
              <i className="bi bi-download"></i>
              Instalar aplicación
            </button>
            <a
              href="/login"
              className="btn btn-secondary btn-lg px-4 py-3 d-flex align-items-center gap-2"
            >
              <i className="bi bi-browser-edge"></i>
              Usar en la web
            </a>
          </div>
        </div>

        {/* Sección de imagen promocional */}
        <div className="col-12 mt-5 text-center">
          <img
            src="/images/mobile-preview.png" // Cambia esta imagen según tu diseño
            alt="Vista previa de la app"
            className="img-fluid rounded shadow-lg"
            style={{ maxWidth: '500px' }}
          />
        </div>

        {/* Pie de página */}
        <div className="col-12 mt-5 text-center text-muted">
          <p>&copy; 2025 Impecol. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default Landing;
