import React, { useEffect, useState } from "react";
import { renderAsync } from "docx-preview"; // Para renderizar la vista previa
//import "./WordViewer.css"; // Asegúrate de crear un archivo CSS para el diseño si es necesario

const ViewDocument = () => {
  const [docxPreview, setDocxPreview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const queryString = window.location.search;
    const urlParam = queryString.split("url=")[1];

    if (!urlParam) {
      setError("No se proporcionó una URL válida.");
      setIsLoading(false);
      return;
    }

    const fetchAndRenderDocument = async (documentUrl) => {
      try {
        const response = await fetch(decodeURIComponent(documentUrl));
        if (!response.ok) {
          throw new Error(`Error al descargar el documento: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const container = document.createElement("div");

        await renderAsync(arrayBuffer, container);
        setDocxPreview(container.innerHTML);
        setIsLoading(false);
      } catch (err) {
        console.error("Error al procesar el documento:", err);
        setError(`Error al procesar el documento: ${err.message}`);
        setIsLoading(false);
      }
    };

    const documentUrl = decodeURIComponent(urlParam);
    fetchAndRenderDocument(documentUrl);
  }, []);

  return (
    <div className="word-viewer">
      <h1>Visor de Documentos</h1>
      {isLoading ? (
        <p>Cargando documento...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <div
          className="docx-preview"
          dangerouslySetInnerHTML={{ __html: docxPreview }}
        ></div>
      )}
    </div>
  );
};

export default ViewDocument;