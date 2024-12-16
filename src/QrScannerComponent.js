import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

const QrScannerComponent = ({ onScan = () => {} }) => {
    const [qrError, setQrError] = useState(null);
  
    const handleScan = (data) => {
      if (data) {
        console.log("Datos escaneados desde el QR:", data);
        onScan(data.text.trim()); // Envía el texto escaneado al manejador
      } else {
        console.log("No se recibió información del QR.");
      }
    };  
  
    const handleError = (err) => {
      console.error('Error escaneando QR:', err);
      setQrError('No se pudo leer el QR. Intenta nuevamente.');
    };
  
    return (
      <div>
        {qrError && <p className="text-danger">{qrError}</p>}
        <QrScanner
          delay={300}
          style={{ width: '100%' }}
          onError={handleError}
          onScan={handleScan}
        />
      </div>
    );
  };

export default QrScannerComponent;