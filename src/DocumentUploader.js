import React, { useState } from "react";
import { renderAsync } from "docx-preview"; // Para renderizar la vista previa
import { Button } from "react-bootstrap";
import mammoth from "mammoth"; // Para extraer texto del documento
import "./DocumentUploader.css";

const DocumentUploader = () => {
  const [file, setFile] = useState(null);
  const [docxPreview, setDocxPreview] = useState("");
  const [variables, setVariables] = useState([]);
  const [tables, setTables] = useState([]);
  const [templateName, setTemplateName] = useState(""); // Estado para el nombre de la plantilla

  const handleFileChange = (uploadedFile) => {
    if (!uploadedFile) return;

    if (
      uploadedFile.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      setFile(uploadedFile);
      renderDocx(uploadedFile);
      extractVariablesAndTables(uploadedFile);
    } else {
      alert("Por favor selecciona un archivo .docx");
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

  return (
    <div className="document-uploader">
      <div className="upload-preview-container">
        <div
          className={`preview-area upload-area ${
            docxPreview ? "preview-loaded" : ""
          }`}
          onClick={() => document.getElementById("fileInput").click()}
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
        >
          {docxPreview ? (
            <div
              className="docx-preview"
              dangerouslySetInnerHTML={{ __html: docxPreview }}
            ></div>
          ) : (
            <p>Haz clic o arrastra un archivo .docx aquí</p>
          )}
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
