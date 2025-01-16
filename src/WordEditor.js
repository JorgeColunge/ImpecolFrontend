import React, { useState, useEffect } from "react";

const WordEditor = () => {
  const [iframeUrl, setIframeUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndUploadFile = async (signedUrl) => {
      try {
        console.log("[LOG] Iniciando proceso con URL prefirmada:", signedUrl);
    
        // Enviar la URL prefirmada al backend para descargar y almacenar temporalmente
        console.log("[LOG] Enviando solicitud al backend para almacenar archivo temporalmente...");
        const uploadResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/upload-temp-document`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: signedUrl }),
        });
    
        if (!uploadResponse.ok) {
          console.error("[ERROR] Falló la solicitud al backend:", uploadResponse.statusText);
          throw new Error(`Error al subir el archivo al servidor: ${uploadResponse.statusText}`);
        }
    
        const responseData = await uploadResponse.json();
        console.log("[LOG] Respuesta del backend:", responseData);
    
        const { fileUrl } = responseData;
    
        if (!fileUrl) {
          console.error("[ERROR] No se recibió una URL del archivo del backend.");
          throw new Error("El backend no devolvió una URL válida del archivo.");
        }
    
        // **No procesar adicionalmente el fileUrl recibido del backend**
        console.log("[LOG] Usando la URL directa del backend para OnlyOffice Editor:", fileUrl);
        setIframeUrl(fileUrl);
        setIsLoading(false);
      } catch (err) {
        console.error("[ERROR] Ocurrió un error durante el proceso:", err.message);
        setError(`Error al procesar el archivo: ${err.message}`);
        setIsLoading(false);
      }
    };    

    const queryString = window.location.search;
    const urlParam = queryString.split("url=")[1];

    if (urlParam) {
      const signedUrl = decodeURIComponent(urlParam);
      console.log("[LOG] URL prefirmada encontrada en los parámetros:", signedUrl);
      fetchAndUploadFile(signedUrl);
    } else {
      console.error("[ERROR] No se proporcionó una URL válida en los parámetros.");
      setError("No se proporcionó una URL válida.");
      setIsLoading(false);
    }
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Editor de Documentos Word</h1>
      {isLoading ? (
        <p>Cargando documento...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <iframe
          src={iframeUrl}
          style={{
            width: "100%",
            height: "600px",
            border: "none",
          }}
          title="OnlyOffice Editor"
        ></iframe>
      )}
    </div>
  );
};

export default WordEditor;
