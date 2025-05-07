import React, { useState, useEffect } from "react";
import { renderAsync } from "docx-preview"; // Para renderizar la vista previa
import { Button } from "react-bootstrap";
import mammoth from "mammoth"; // Para extraer texto del documento
import "./DocumentUploader.css";

const DocumentUploader = () => {
  const [file, setFile] = useState(null);
  const [docxPreview, setDocxPreview] = useState("");
  const [variables, setVariables] = useState([]);
  const [tables, setTables] = useState([]);
  const [templateName, setTemplateName] = useState("");
  const [editorKey, setEditorKey] = useState(Date.now());

  useEffect(() => {
    console.log("🧩 Cargando script de OnlyOffice...");
    const script = document.createElement("script");
    //script.src = "http://localhost/web-apps/apps/api/documents/api.js";
    script.src = "https://services.impecol.com/onlyoffice/web-apps/apps/api/documents/api.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const waitForFileAvailable = async (url, maxRetries = 10) => {
    console.log(`⏳ Verificando disponibilidad de archivo: ${url}`);
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        if (response.ok) {
          console.log(`✅ Archivo disponible en intento ${attempt}`);
          return true;
        } else {
          console.warn(`⚠️ Archivo no disponible (intento ${attempt}): ${response.status}`);
        }
      } catch (err) {
        console.warn(`⚠️ Error al intentar acceder al archivo (intento ${attempt}):`, err);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Espera 500ms
    }
    throw new Error("❌ El archivo no estuvo disponible después de varios intentos.");
  };

  const handleFileChange = async (uploadedFile) => {
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const isDocx =
      uploadedFile.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isDocx) {
      alert("Por favor selecciona un archivo .docx");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get-onlyoffice-config`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Error al obtener configuración OnlyOffice");

      const config = await response.json();

      // Extraer variables y tablas después de renderizar
      extractVariablesAndTables(uploadedFile);
      setEditorKey(Date.now());
      await new Promise((resolve) => setTimeout(resolve, 500)); // ⏳ Espera inicial de 10 segundos
      await waitForFileAvailable(config.document.url, 10);
      renderWithOnlyOffice(config);
    } catch (error) {
      console.error("❌ Error al procesar archivo:", error);
      alert("No se pudo cargar el documento.");
    }
  };

  const uploadTemplate = async () => {
    if (!file) {
      alert("Por favor carga un archivo antes de subir la plantilla.");
      return;
    }
    if (!templateName) {
      alert("Por favor ingresa un nombre para la plantilla.");
      return;
    }

    // Crear el JSON para enviar al backend
    const templateData = {
      nombrePlantilla: templateName,
      variables: variables.map((variable) => ({
        nombre: variable,
        etiqueta: `{{${variable}}}`,
      })),
      tablas: tables.map((table, index) => ({
        nombre: table.name || `Tabla ${index + 1}`,
        encabezado: {
          filas: table.encabezado?.filas || 0,
          columnas: table.encabezado?.columnas || 0,
          detalles: table.encabezado?.detalles || [],
        },
        cuerpo: {
          filas: table.cuerpo?.filas || 0,
          columnas: table.cuerpo?.columnas || 0,
          detalles: table.cuerpo?.detalles || [],
        },
      })),
    };

    const formData = new FormData();
    formData.append("templateData", JSON.stringify(templateData)); // Datos JSON
    formData.append("file", file); // Archivo original

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/upload-template`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Plantilla subida correctamente.");
      } else {
        alert("Error al subir la plantilla.");
      }
    } catch (error) {
      console.error("Error al subir la plantilla:", error);
      alert("Error al conectar con el servidor.");
    }
  };

  const renderDocx = (uploadedFile) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target.result;
      const container = document.createElement("div");
      await renderAsync(arrayBuffer, container);
      setDocxPreview(container.innerHTML);
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const extractVariablesAndTables = (uploadedFile) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const htmlContent = result.value; // HTML del documento

        // Extraer variables
        const textContent = await mammoth.extractRawText({ arrayBuffer });
        const text = textContent.value;
        const matches = text.match(/{{\s*[\wáéíóúüñÁÉÍÓÚÜÑ._-]+\s*}}/g) || [];
        setVariables(matches.map((v) => v.replace(/[{}]/g, "").trim()));

        console.log("Variables extraídas:", matches);

        // Extraer tablas
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");
        const tableElements = doc.querySelectorAll("table");

        console.log("Tablas detectadas en el documento:", tableElements.length);

        const extractedTables = Array.from(tableElements).map((table, index) => {
          console.log(`Procesando tabla ${index + 1}`);

          const rows = Array.from(table.rows);
          console.log(`Filas en la tabla ${index + 1}:`, rows);

          let header = [];
          let body = [];
          let bodyColumns = 0; // Para contar las columnas del cuerpo

          rows.forEach((row, rowIndex) => {
            const cells = Array.from(row.cells).map((cell) =>
              cell.textContent.trim()
            );

            console.log(`Fila ${rowIndex + 1}:`, cells);

            if (cells.every((cell) => cell === "")) {
              // Si todas las celdas están vacías, pertenece al cuerpo
              body.push(cells);
              bodyColumns = cells.length || bodyColumns;
            } else {
              // Si contiene texto, pertenece al encabezado
              header.push({
                cells: cells,
                colspan: cells.length === 1 ? bodyColumns : null,
              });
            }
          });

          console.log(`Encabezado de la tabla ${index + 1}:`, header);
          console.log(`Cuerpo de la tabla ${index + 1}:`, body);

          return {
            nombre: `Tabla ${index + 1}`,
            encabezado: {
              filas: header.length,
              columnas: bodyColumns,
              detalles: header,
            },
            cuerpo: {
              filas: body.length,
              columnas: bodyColumns,
              detalles: body,
            },
          };
        });

        console.log("Tablas extraídas:", extractedTables);
        setTables(extractedTables);
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };


  const handleFileDrop = (e) => {
    e.preventDefault();
    const uploadedFile = e.dataTransfer.files[0];
    handleFileChange(uploadedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const renderWithOnlyOffice = async () => {
    console.log("🚀 Cargando documento de prueba público...");

    const config = {
      document: {
        fileType: "doc", // ⚠️ Nota: este es un .doc, no .docx
        title: "archivo-de-prueba.doc",
        key: `test-${Date.now()}`,
        url: "https://sample-files.com/downloads/documents/docx/sample-files.com-basic-text.docx"
      },
      documentType: "word",
      editorConfig: {
        mode: "edit",
        user: {
          id: "tester",
          name: "Prueba pública"
        },
        events: {
          onReady: () => {
            console.log("🟢 Editor listo (evento onReady)");
          },
          onDocumentStateChange: (event) => {
            console.log("✏️ Cambió el estado del documento:", event);
          },
          onError: (error) => {
            console.error("🚨 Error interno en OnlyOffice:", error);
          },
          onRequestClose: () => {
            console.log("❌ Cierre solicitado");
          }
        }
      }
    };

    const container = document.getElementById("onlyoffice-editor");
    if (!container) {
      console.error("❌ No se encontró el contenedor #onlyoffice-editor");
      return;
    }

    // Verificación HEAD
    try {
      const headResponse = await fetch(config.document.url, { method: "HEAD" });
      const status = headResponse.status;
      const type = headResponse.headers.get("Content-Type");
      const size = headResponse.headers.get("Content-Length");
      console.log(`📡 HEAD Response: ${status} | Content-Type: ${type} | Size: ${size} bytes`);
    } catch (err) {
      console.error("❌ Error en HEAD request:", err);
      return;
    }

    // Verificación binaria
    try {
      const buffer = await fetch(config.document.url).then((res) => res.arrayBuffer());
      const firstBytes = new Uint8Array(buffer.slice(0, 8));
      console.log(`📄 Descargado. Bytes: ${buffer.byteLength}`);
      console.log("🔍 Primeros 8 bytes:", Array.from(firstBytes).map(b => b.toString(16).padStart(2, "0")).join(" "));
    } catch (err) {
      console.error("❌ Error al descargar archivo:", err);
      return;
    }

    // Limpiar y renderizar
    container.innerHTML = "";
    try {
      const editor = new window.DocsAPI.DocEditor("onlyoffice-editor", config);
      console.log("✅ Editor instanciado correctamente.");
      console.log("🧠 Métodos del editor:", Object.keys(editor));
    } catch (e) {
      console.error("❌ Excepción al instanciar DocsAPI.DocEditor:", e);
    }
  };



  return (
    <div className="document-uploader">
      <div className="upload-preview-container">
        <div
          className="preview-area upload-area"
          onClick={() => document.getElementById("fileInput").click()}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          style={{ padding: 0 }}
        >
          <div
            id="onlyoffice-editor"
            key={editorKey}
            style={{ height: "100vh", width: "10px" }}
          ></div>
        </div>
        <div className="variables-area">
          <div className="mb-4">
            <h3>Nombre de la Plantilla</h3>
            <input
              type="text"
              className="form-control"
              placeholder="Ingresa el nombre de la plantilla"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>
          <h3>Variables Detectadas</h3>
          {variables.length > 0 ? (
            <ul>
              {variables.map((variable, index) => (
                <li key={index}>{variable}</li>
              ))}
            </ul>
          ) : (
            <p>No se encontraron variables</p>
          )}
          <h3>Tablas Detectadas</h3>
          {tables.length > 0 ? (
            tables.map((table, index) => (
              <div key={index} className="table-preview">
                <input
                  type="text"
                  placeholder={`Nombre de la Tabla ${index + 1}`}
                  className="table-name-input"
                  onChange={(e) => {
                    const newTables = [...tables];
                    newTables[index].name = e.target.value; // Agrega un campo 'name' a la tabla
                    setTables(newTables);
                  }}
                />
                <table className="extracted-table">
                  <thead>
                    {table.encabezado?.detalles.length > 0 &&
                      table.encabezado.detalles.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.cells.map((cell, cellIndex) => (
                            <th
                              key={cellIndex}
                              colSpan={row.colspan && row.cells.length === 1 ? row.colspan : 1}
                            >
                              {cell}
                            </th>
                          ))}
                        </tr>
                      ))}
                  </thead>
                  <tbody>
                    {table.cuerpo?.detalles.length > 0 ? (
                      table.cuerpo.detalles.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>{cell}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={table.encabezado?.columnas || 1}>
                          No hay datos en el cuerpo de la tabla.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p>No se encontraron tablas</p>
          )}
        </div>
      </div>
      <div>
        <Button
          variant="outline-success"
          className="btn mt-3"
          onClick={uploadTemplate}
        >
          Subir Plantilla
        </Button>
      </div>
      <input
        id="fileInput"
        type="file"
        accept=".docx"
        style={{ display: "none" }}
        onChange={(e) => handleFileChange(e.target.files[0])}
      />
    </div>
  );
};

export default DocumentUploader;
