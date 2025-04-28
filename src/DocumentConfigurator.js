import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col, Card, Table } from "react-bootstrap";

const DocumentConfigurator = ({ selectedTemplateId, selectedEntity }) => {
  const [templateData, setTemplateData] = useState(null);
  const [variableMappings, setVariableMappings] = useState({});
  const [sourceOptions, setSourceOptions] = useState({});
  const [showSourceDropdown, setShowSourceDropdown] = useState({});
  const [fieldOptions, setFieldOptions] = useState({});
  const [selectedField, setSelectedField] = useState({});
  const [selectedSource, setSelectedSource] = useState({});
  const [intermediateSelection, setIntermediateSelection] = useState({});
  const [serviceTypeSelection, setServiceTypeSelection] = useState({});
  const [tableData, setTableData] = useState({});
  const [tableSourceOptions, setTableSourceOptions] = useState({});
  const [tableShowSourceDropdown, setTableShowSourceDropdown] = useState({});
  const [tableFieldOptions, setTableFieldOptions] = useState({});
  const [tableSelectedSource, setTableSelectedSource] = useState({});
  const [tableSelectedField, setTableSelectedField] = useState({});
  const [tableIntermediateSelection, setTableIntermediateSelection] = useState({});
  const [tableServiceTypeSelection, setTableServiceTypeSelection] = useState({});
  const [aiModels, setAiModels] = useState([]);
  const [showIaConfiguration, setShowIaConfiguration] = useState({});
  const [iaConfigurations, setIaConfigurations] = useState({});
  const [iaDynamicInputs, setIaDynamicInputs] = useState({});
  const [iaIntermediateSelection, setIaIntermediateSelection] = useState({});
  const [iaServiceTypeSelection, setIaServiceTypeSelection] = useState({});
  const [iaFieldOptions, setIaFieldOptions] = useState({});
  const [iaSelectedField, setIaSelectedField] = useState({});
  const [tableShowIaConfiguration, setTableShowIaConfiguration] = useState({});
  const [tableIaConfigurations, setTableIaConfigurations] = useState({});
  const [tableIaDynamicInputs, setTableIaDynamicInputs] = useState({});
  const [customizedValues, setCustomizedValues] = useState({});
  const [tableCustomizedValues, setTableCustomizedValues] = useState({});
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [nsSelections, setNsSelections] = useState({});

  // Mapear las columnas de "clients" a nombres en español
  const clientFields = [
    { label: "Nombre", value: "name" },
    { label: "Dirección", value: "address" },
    { label: "Teléfono", value: "phone" },
    { label: "Correo Electrónico", value: "email" },
    { label: "Representante", value: "representative" },
    { label: "Tipo de Documento", value: "document_type" },
    { label: "Número de Documento", value: "document_number" },
    { label: "Nombre de Contacto", value: "contact_name" },
    { label: "Teléfono de Contacto", value: "contact_phone" },
    { label: "RUT", value: "rut" },
    { label: "Latitud", value: "latitude" },
    { label: "Longitud", value: "longitude" },
    { label: "Departamento", value: "department" },
    { label: "Ciudad", value: "city" },
  ];

  const responsibleFields = [
    { label: "Nombre", value: "name" },
    { label: "Apellido", value: "lastname" },
    { label: "Teléfono", value: "phone" },
    { label: "Correo Electrónico", value: "email" },
    { label: "Foto", value: "image" },
    { label: "Documento", value: "id" },
  ];

  const stationFields = [
    { label: "Descripción", value: "description" },
    { label: "Categoría", value: "category" },
    { label: "Tipo", value: "type" },
    { label: "Método de Control", value: "control_method" },
    { label: "ID del Cliente", value: "client_id" },
    { label: "Código QR", value: "qr_code" },
  ];
  
  // Mapeo de columnas para "Mapas"
  const mapFields = [
    { label: "Descripción", value: "description" },
    { label: "Imagen", value: "image" },
  ];

  const serviceFields = [
    { label: "ID", value: "id" },
    { label: "Tipo de Servicio", value: "service_type" },
    { label: "Descripción", value: "description" },
    { label: "Plaga a Controlar", value: "pest_to_control" },
    { label: "Área de Intervención", value: "intervention_areas" },
    { label: "Responsable", value: "responsible" },
    { label: "Categoría", value: "category" },
    { label: "Cantidad por Mes", value: "quantity_per_month" },
    { label: "ID del Cliente", value: "client_id" },
    { label: "Valor", value: "value" },
    { label: "Compañero", value: "companion" },
    { label: "Creado Por", value: "created_by" },
    { label: "Fecha de Creación", value: "created_at" },
  ];  

  const rulesClient = [
    { label: "Norma", value: "rule" },
    { label: "Descripción", value: "description" },
  ];

  const procedures = [
    { label: "Procedimiento", value: "process" },
    { label: "Método de aplicación", value: "application" },
  ];

  const getInspectionFields = (serviceType) => {
    const commonFields = [
      { label: "ID", value: "id" },
      { label: "Fecha de la inspección", value: "date" },
      { label: "Hora de entrada", value: "time" },
      { label: "Duración de la inspección", value: "duration" },
      { label: "Observaciones", value: "observations" },
      { label: "ID del Servicio", value: "service_id" },
      { label: "Hora de Salida", value: "exit_time" },
      { label: "Tipo de Inspección", value: "inspection_type" },
      { label: "Subtipo de Inspección", value: "inspection_sub_type" },
      { label: "Nombre del Responsable", value: "findings_signatures_technician_name" },
      { label: "Cédula del Responsable", value: "findings_signatures_technician_id" },
      { label: "Firma del Técnico", value: "findings_signatures_technician_signature" },
      { label: "Firma del Cliente", value: "findings_signatures_client_signature" },
      { label: "Nombre del Cliente", value: "findings_signatures_client_name" },
      { label: "Cédula Cliente", value: "findings_signatures_client_id" },
      { label: "Cargo del cliente", value: "findings_signatures_client_position" },
      { label: "Hallazgos (Todo)", value: "findings_all" },
      { label: "Lugar Hallazgo", value: "findings_findingsByType_place" },
      { label: "Descripción Hallazgo", value: "findings_findingsByType_description" },
      { label: "Foto Hallazgo", value: "findings_findingsByType_photo" },
      { label: "Nombre del Producto", value: "findings_productsByType_product" },
      { label: "Dosificación", value: "findings_productsByType_dosage" },
      { label: "Fecha de vencimiento", value: "findings_productsByType_expirationDate" },
      { label: "Unidad del producto", value: "findings_productsByType_unity" },
      { label: "Producto servicio", value: "findings_productsByType_tipo" },
      { label: "Lote del producto", value: "findings_productsByType_batch" },
      { label: "Ingrediente Activo", value: "findings_productsByType_activeIngredient" },
      { label: "Categoría Producto", value: "findings_productsByType_category" },
      { label: "Hora de reingreso", value: "findings_productsByType_residualDuration" },
      { label: "Método de aplicación", value: "findings_productsByType_process" },
      { label: "Lugar Hallazgo Antes", value: "findings_findingsByType_placeAn" },
      { label: "Descripción Hallazgo Antes", value: "findings_findingsByType_descriptionAn" },
      { label: "Foto Hallazgo Antes", value: "findings_findingsByType_photoAn" },
      { label: "Lugar Hallazgo Durante", value: "findings_findingsByType_placeDu" },
      { label: "Descripción Hallazgo Durante", value: "findings_findingsByType_descriptionDu" },
      { label: "Foto Hallazgo Durante", value: "findings_findingsByType_photoDu" },
      { label: "Lugar Hallazgo Después", value: "findings_findingsByType_placeDe" },
      { label: "Descripción Hallazgo Después", value: "findings_findingsByType_descriptionDe" },
      { label: "Foto Hallazgo Después", value: "findings_findingsByType_photoDe" },
    ];
  
    const stationDesratizacion = [
      { label: "Finalidad Estación", value: "findings_stationsFindings_Roedores_purpose" },
      { label: "Cantidad Consumo Estación", value: "findings_stationsFindings_Roedores_consumptionAmount" },
      { label: "Cantidad de Capturas Estación", value: "findings_stationsFindings_Roedores_captureQuantity" },
      { label: "Estación Señalizada", value: "findings_stationsFindings_Roedores_marked" },
      { label: "Estado Físico Estación", value: "findings_stationsFindings_Roedores_physicalState" },
      { label: "Lugar del Daño", value: "findings_stationsFindings_Roedores_damageLocation" },
      { label: "¿Requiere Cambio?", value: "findings_stationsFindings_Roedores_requiresChange" },
      { label: "¿Prioridad de Cambio?", value: "findings_stationsFindings_Roedores_changePriority" },
      { label: "Descripción Hallazgo Estación", value: "findings_stationsFindings_Roedores_description" },
      { label: "Fotografía Hallazgo Estación", value: "findings_stationsFindings_Roedores_photo" },
    ];
  
    const stationDesinsectacion = [
      { label: "Cantidad de Capturas Estación", value: "findings_stationsFindings_Aéreas_captureQuantity" },
      { label: "Estado Físico Estación", value: "findings_stationsFindings_Aéreas_physicalState" },
      { label: "Lugar del Daño", value: "findings_stationsFindings_Aéreas_damageLocation" },
      { label: "¿Requiere Cambio?", value: "findings_stationsFindings_Aéreas_requiresChange" },
      { label: "¿Prioridad de Cambio?", value: "findings_stationsFindings_Aéreas_changePriority" },
      { label: "Descripción Estación", value: "findings_stationsFindings_Aéreas_description" },
      { label: "Fotografía Hallazgo Estación", value: "findings_stationsFindings_Aéreas_photo" },
    ];

    const allStation = [
      { label: "Finalidad Estación", value: "findings_stationsFindings_all_purpose" },
      { label: "Cantidad Consumo Estación", value: "findings_stationsFindings_all_consumptionAmount" },
      { label: "Cantidad de Capturas Estación", value: "findings_stationsFindings_all_captureQuantity" },
      { label: "Estación Señalizada", value: "findings_stationsFindings_all_marked" },
      { label: "Estado Físico Estación", value: "findings_stationsFindings_all_physicalState" },
      { label: "Lugar del Daño", value: "findings_stationsFindings_all_damageLocation" },
      { label: "¿Requiere Cambio?", value: "findings_stationsFindings_all_requiresChange" },
      { label: "¿Prioridad de Cambio?", value: "findings_stationsFindings_all_changePriority" },
      { label: "Descripción Hallazgo Estación", value: "findings_stationsFindings_all_description" },
      { label: "Fotografía Hallazgo Estación", value: "findings_stationsFindings_all_photo" },
    ];
  
    // Condicional para agregar campos de estaciones
    if (serviceType === "Desratización") {
      return [...commonFields, ...stationDesratizacion];
    } else if (serviceType === "Desinsectación") {
      return [...commonFields, ...stationDesinsectacion];
    } else if (serviceType === "all") {
      return [...commonFields,...allStation];
    } else {
      return commonFields; // Sin estaciones
    }
  };

  const addAiModel = () => {
    setAiModels((prevModels) => [...prevModels, { model: "", name: "", personality: "" }]);
  };
  
  const handleAiModelChange = (index, field, value) => {
    setAiModels((prevModels) => {
      const updatedModels = [...prevModels];
      updatedModels[index][field] = value;
      return updatedModels;
    });
  };
  
  const removeAiModel = (index) => {
    setAiModels((prevModels) => prevModels.filter((_, i) => i !== index));
  };  
  
  useEffect(() => {
    const fetchTemplateDetails = async () => {
      if (!selectedTemplateId) return;

      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/get-template/${selectedTemplateId}`
        );
        if (response.ok) {
          const data = await response.json();
          setTemplateData(data.plantilla);
          initializeMappings(data.plantilla.datos.variables);
          initializeTables(data.plantilla.datos.tablas || []);
        } else {
          console.error("Error al obtener detalles de la plantilla");
        }
      } catch (error) {
        console.error("Error al conectar con el servidor:", error);
      }
    };

    fetchTemplateDetails();
  }, [selectedTemplateId]);

  // Inicializa variables
  const initializeMappings = (variables) => {
    const mappings = {};
    variables.forEach((variable) => {
      mappings[variable.nombre] = "";
    });
    setVariableMappings(mappings);
  };

  // Inicializa tablas
  const initializeTables = (tables) => {
    const tablesState = {};
    tables.forEach((table) => {
      // Normalizar encabezado
      const normalizedHeaders = table.encabezado?.detalles.map((item) => {
        if (Array.isArray(item)) {
          return item; // Si ya es un array, lo deja intacto
        } else if (item?.cells) {
          return item.cells; // Si es un objeto, extrae los 'cells'
        } else {
          return []; // Default si no es ninguno
        }
      }) || [[]];
  
      tablesState[table.nombre] = {
        encabezado: normalizedHeaders,
        cuerpo: table.cuerpo?.detalles || [[]], // Garantiza que cuerpo siempre sea un array válido
      };
    });
    setTableData(tablesState);
  };
  

  const handleFuenteClick = (variable) => {
    setShowIaConfiguration((prev) => ({ ...prev, [variable]: false }));
    setCustomizedValues((prev) => {
      const updated = { ...prev };
      delete updated[variable]; // Eliminar campo personalizado
      return updated;
    });

    let options = [
      "Cliente",
      "Estaciones Aéreas",
      "Estaciones Roedores",
      "Mapas",
      "Servicios",
      "Inspecciones",
    ];
  
    if (selectedEntity === "servicio") {
      options = ["Servicio", "Inspecciones", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    } else if (selectedEntity === "inspeccion") {
      options = ["Inspección", "Servicio", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    }
  
    setSourceOptions((prev) => ({ ...prev, [variable]: options }));
    setShowSourceDropdown((prev) => ({ ...prev, [variable]: true }));
  };
  
  
  const handleIaClick = (variable) => {
    // Reiniciar configuraciones relacionadas con Fuente
    setShowSourceDropdown((prev) => ({ ...prev, [variable]: false }));
    setSelectedSource((prev) => ({ ...prev, [variable]: "" }));
    setFieldOptions((prev) => ({ ...prev, [variable]: [] }));
    setCustomizedValues((prev) => {
      const updated = { ...prev };
      delete updated[variable]; // Eliminar campo personalizado
      return updated;
    });
  
    // Activar configuraciones de IA
    setShowIaConfiguration((prev) => ({ ...prev, [variable]: true }));
    setIaConfigurations((prev) => ({
      ...prev,
      [variable]: {
        model: "",
        prompt: "",
      },
    }));
    setVariableMappings((prev) => ({
      ...prev,
      [variable]: "IA-ModeloIA-Prompt", // Asignar el nombre directamente
    }));
  };  

  const handleIaModelChange = (variable, value) => {
    setIaConfigurations((prev) => {
      const updatedConfig = {
        ...prev,
        [variable]: {
          ...prev[variable],
          model: value,
        },
      };
  
      // Buscar el nombre del modelo en la lista de modelos
      const modelName = aiModels.find((model) => model.model === value)?.name || "ModeloIA";
  
      // Obtener el prompt actual y procesarlo para incluir \n correctamente
      const currentPrompt = updatedConfig[variable]?.prompt || "Prompt";
      const processedPrompt = currentPrompt.replace(/\n/g, "\\n");
  
      // Actualizar el nombre de la variable con el modelo y el prompt procesado
      setVariableMappings((prevMappings) => ({
        ...prevMappings,
        [variable]: `IA-${modelName}-${processedPrompt}`,
      }));
  
      return updatedConfig;
    });
  };
   
  
  const handleIaPromptChange = (variable, value) => {
    setIaConfigurations((prev) => {
      const updatedConfig = {
        ...prev,
        [variable]: {
          ...prev[variable],
          prompt: value,
        },
      };
  
      // Obtener el modelo actual y su nombre
      const modelValue = updatedConfig[variable]?.model || "";
      const modelName = aiModels.find((model) => model.model === modelValue)?.name || "ModeloIA";
  
      // Actualizar el nombre de la variable con el nombre del modelo y el prompt (procesado para incluir \n)
      setVariableMappings((prevMappings) => ({
        ...prevMappings,
        [variable]: `IA-${modelName}-${value.replace(/\n/g, "\\n")}`,
      }));
  
      return updatedConfig;
    });
  };   
  
  const handleTableIaClick = (tableName, rowIndex, colIndex) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
  
    // Reiniciar configuraciones relacionadas con Fuente
    setTableShowSourceDropdown((prev) => ({ ...prev, [key]: false }));
    setTableSelectedSource((prev) => ({ ...prev, [key]: "" }));
    setTableFieldOptions((prev) => ({ ...prev, [key]: [] }));
    setTableSelectedField((prev) => ({ ...prev, [key]: "" }));
    setTableCustomizedValues((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  
    // Activar configuraciones de IA
    setTableShowIaConfiguration((prev) => ({ ...prev, [key]: true }));
    setTableIaConfigurations((prev) => ({
      ...prev,
      [key]: {
        model: "",
        prompt: "",
      },
    }));
  
    // Inicializar inputs dinámicos
    setTableIaDynamicInputs((prev) => ({
      ...prev,
      [key]: [],
    }));
  
    // Inicializar opciones de fuente
    let options = [
      "Cliente",
      "Estaciones Aéreas",
      "Estaciones Roedores",
      "Mapas",
      "Servicios",
      "Inspecciones",
    ];
  
    if (selectedEntity === "servicio") {
      options = ["Servicio", "Inspecciones", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    } else if (selectedEntity === "inspeccion") {
      options = ["Inspección", "Servicio", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    }
  
    setSourceOptions((prev) => ({
      ...prev,
      [key]: options,
    }));
  
    // Actualizar el valor de la celda al estado inicial "IA-ModeloIA-Prompt"
    setTableData((prevTables) => {
      const updatedTable = { ...prevTables[tableName] };
      if (updatedTable.cuerpo[rowIndex]) {
        updatedTable.cuerpo[rowIndex][colIndex] = "IA-ModeloIA-Prompt";
      }
      return { ...prevTables, [tableName]: updatedTable };
    });
  };  
  
  const handleAddTableIaInput = (tableName, rowIndex, colIndex) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
  
    setTableIaDynamicInputs((prev) => ({
      ...prev,
      [key]: [
        ...(prev[key] || []),
        { id: Date.now(), source: "", name: `Input ${Date.now()}` },
      ],
    }));
  
    // Inicializar opciones de fuente
    initializeTableSourceOptions(tableName, rowIndex, colIndex);
  };    

  const handleTableIaSourceSelect = (tableName, rowIndex, colIndex, inputId, source) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    
    // Actualizar la fuente seleccionada en los inputs dinámicos de la tabla
    setTableIaDynamicInputs((prev) => ({
      ...prev,
      [key]: prev[key].map((input) =>
        input.id === inputId ? { ...input, source } : input
      ),
    }));
  
    if (source === "Inspecciones") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: getInspectionFields("all"),
      }));
      setTableIntermediateSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "all", // Por defecto "all"
      }));
      setTableServiceTypeSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "all", // Por defecto "all"
      }));
    } else if (source === "Inspección") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: getInspectionFields(""),
      }));
      setTableIntermediateSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "all", // Fijar el período en "all"
      }));
      setTableServiceTypeSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "", // Reset tipo de servicio
      }));
    } else if (source === "Servicios") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: serviceFields,
      }));
      setTableIntermediateSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "",
      }));
      setTableServiceTypeSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "",
      }));
    } else if (source === "Servicio") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: serviceFields,
      }));
      setTableIntermediateSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "all", // Fijar el período en "all"
      }));
      setTableServiceTypeSelection((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: "", // Reset tipo de servicio
      }));
    } else if (source === "Cliente") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: clientFields,
      }));
    } else if (source === "Normativa Cliente") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: rulesClient,
      }));
    } else if (source === "Procedimiento") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: procedures,
      }));
    } else if (source === "Responsable" || source === "Acompañante") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: responsibleFields,
      }));
    } else if (source === "Estaciones Aéreas" || source === "Estaciones Roedores") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: stationFields,
      }));
    } else if (source === "Mapas") {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: mapFields,
      }));
    } else {
      setTableFieldOptions((prev) => ({
        ...prev,
        [`${key}-${inputId}`]: [], // Reset si no hay campos específicos
      }));
    }
  };  

  const handleCustomClick = (variable) => {
    // Desactivar configuraciones de Fuente e IA
    setShowSourceDropdown((prev) => ({ ...prev, [variable]: false }));
    setShowIaConfiguration((prev) => ({ ...prev, [variable]: false }));
    setSelectedSource((prev) => ({ ...prev, [variable]: "" }));
    setFieldOptions((prev) => ({ ...prev, [variable]: [] }));
  
    // Activar campo personalizado
    setCustomizedValues((prev) => ({ ...prev, [variable]: "" }));
  };  
  
  const handleCustomValueChange = (variable, value) => {
    setCustomizedValues((prev) => ({ ...prev, [variable]: value }));
    setVariableMappings((prevMappings) => ({
      ...prevMappings,
      [variable]: `${value}`,
    }));
  };  

  const handleTableCustomClick = (tableName, rowIndex, colIndex) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    
    // Desactivar Fuente e IA
    setTableShowSourceDropdown((prev) => ({ ...prev, [key]: false }));
    setTableShowIaConfiguration((prev) => ({ ...prev, [key]: false }));
    setTableSelectedSource((prev) => ({ ...prev, [key]: "" }));
    setTableFieldOptions((prev) => ({ ...prev, [key]: [] }));
  
    // Activar Personalizado
    setTableCustomizedValues((prev) => ({ ...prev, [key]: "" }));
  
    // Resetear valores de IA en la tabla
    setTableIaConfigurations((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  
    // Eliminar inputs dinámicos
    setTableIaDynamicInputs((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };
  
  const handleTableCustomValueChange = (tableName, rowIndex, colIndex, value) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    
    setTableCustomizedValues((prev) => ({ ...prev, [key]: value }));
  
    // Actualizar el valor en la tabla con el formato "Personalized-Valor"
    setTableData((prevTables) => {
      const updatedTable = { ...prevTables[tableName] };
      updatedTable.cuerpo[rowIndex][colIndex] = `${value}`;
      return { ...prevTables, [tableName]: updatedTable };
    });
  };
  
  const handleTableIaFieldSelect = (tableName, rowIndex, colIndex, inputId, field) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    const input = tableIaDynamicInputs[key]?.find((input) => input.id === inputId);
    const source = input?.source || "";
    const period = tableIntermediateSelection[key] || "all";
    const serviceType = tableServiceTypeSelection[key] || "all";
  
    let combinedValue = `${source}-${field}`;
  
    // Si la fuente es "Inspecciones" o "Servicios", incluir período y tipo
    if (source === "Inspecciones" || source === "Inspección" || source === "Servicios") {
      combinedValue = `${source}-${period}-${serviceType}-${field}`;
    }
    if (source === "Procedimiento") {
      combinedValue = `${source}-${serviceType}-${field}`;
    }
    
  
    // Actualizar el valor combinado del input
    setTableIaDynamicInputs((prev) => ({
      ...prev,
      [key]: prev[key].map((input) =>
        input.id === inputId
          ? { ...input, field, value: combinedValue } // Actualiza tanto `field` como `value`
          : input
      ),
    }));
  
    // Actualizar el prompt para incluir el nombre personalizado
    const customName = tableIaDynamicInputs[key]?.find((input) => input.id === inputId)?.name || combinedValue;
    setTableIaConfigurations((prev) => {
      const currentPrompt = prev[key]?.prompt || "";
      const updatedPrompt = `${currentPrompt}\nUsar {{${customName}}} para ...`;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          prompt: updatedPrompt,
        },
      };
    });
  
    // Actualizar el estado de campos seleccionados
    setTableSelectedField((prev) => ({
      ...prev,
      [`${key}-${inputId}`]: field,
    }));
  };  

  const handleTableIaModelChange = (tableName, rowIndex, colIndex, value) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
  
    // Buscar el nombre del modelo seleccionado
    const modelName = aiModels.find((model) => model.model === value)?.name || "ModeloIA";
  
    setTableIaConfigurations((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        model: value,
      },
    }));
  
    // Actualizar el valor en la tabla con el formato "IA-NombreModelo-Prompt"
    setTableData((prevTables) => {
      const updatedTable = { ...prevTables[tableName] };
      const currentPrompt = tableIaConfigurations[key]?.prompt || "Prompt";
      const processedPrompt = currentPrompt.replace(/\n/g, "\\n");
      updatedTable.cuerpo[rowIndex][colIndex] = `IA-${modelName}-${processedPrompt}`;
      return { ...prevTables, [tableName]: updatedTable };
    });
  };    

  const handleTableIaPromptChange = (tableName, rowIndex, colIndex, value) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
  
    // 1. Obtener modelo, prompt y ns actuales
    const currentConfig = tableIaConfigurations[key] || {};
    const currentModel = currentConfig.model || "";
    const processedPrompt = value.replace(/\n/g, "\\n");
    const ns = nsSelections?.[key] || "${ns}"; // <-- clave: usa el valor de ns seleccionado o el placeholder
  
    // 2. Construir valor final
    const finalValue = `IA-${currentModel}-${processedPrompt}-${ns}`;
  
    // 3. Actualizar configuraciones de IA
    setTableIaConfigurations((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        prompt: value,
      },
    }));
  
    // 4. Actualizar valor en la tabla
    setTableData((prevTables) => {
      const updatedTable = { ...prevTables[tableName] };
      const updatedBody = [...updatedTable.cuerpo];
      updatedBody[rowIndex][colIndex] = finalValue;
  
      return {
        ...prevTables,
        [tableName]: {
          ...updatedTable,
          cuerpo: updatedBody,
        },
      };
    });
  };   

  const initializeIaSourceOptions = (variable) => {
    let options = [
      "Cliente",
      "Estaciones Aéreas",
      "Estaciones Roedores",
      "Mapas",
      "Servicios",
      "Inspecciones"
    ];
  
    if (selectedEntity === "servicio") {
      options = ["Servicio", "Inspecciones", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    } else if (selectedEntity === "inspeccion") {
      options = ["Inspección", "Servicio", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    }
  
    setSourceOptions((prev) => ({ ...prev, [variable]: options }));
  };  
  
  const handleAddIaInput = (variable) => {
    initializeIaSourceOptions(variable); // Asegurar que las opciones estén configuradas
    setIaDynamicInputs((prev) => ({
      ...prev,
      [variable]: [
        ...(prev[variable] || []),
        { id: Date.now(), source: "", name: `Input ${Date.now()}` },
      ],
    }));
  };    

  const handleIaSourceSelect = (variable, id, source) => {
    setIaDynamicInputs((prev) => ({
      ...prev,
      [variable]: prev[variable].map((input) =>
        input.id === id ? { ...input, source } : input
      ),
    }));
  
    if (source === "Inspecciones") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: getInspectionFields(""),
      }));
      setIaIntermediateSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "",
      })); // Reset período
      setIaServiceTypeSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "",
      })); // Reset tipo de servicio
    } else if (source === "Inspección") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: getInspectionFields(""),
      }));
      setIaIntermediateSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "all", // Periodo por defecto es "all"
      })); 
      setIaServiceTypeSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "",
      })); // Permitir configurar tipo de servicio
    } else if (source === "Servicios") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: serviceFields,
      }));
      setIaIntermediateSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "",
      })); // Reset período
      setIaServiceTypeSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "",
      })); // Reset tipo de servicio
    } else if (source === "Servicio") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: serviceFields,
      }));
      setIaIntermediateSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "all", // Periodo por defecto es "all"
      })); // No se requiere configuración adicional del período
      setIaServiceTypeSelection((prev) => ({
        ...prev,
        [`${variable}-${id}`]: "",
      })); // Reset tipo de servicio
    } else if (source === "Cliente") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: clientFields,
      }));
    } else if (source === "Normativa Cliente") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: rulesClient,
      }));
    } else if (source === "Procedimiento") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: procedures,
      }));
    } else if (source === "Responsable" || source === "Acompañante") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: responsibleFields,
      }));
    } else if (source === "Estaciones Aéreas" || source === "Estaciones Roedores") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: stationFields,
      }));
    } else if (source === "Mapas") {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: mapFields,
      }));
    } else {
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: [],
      })); // Reset si no hay campos específicos
    }
  };  

  const handleDeleteIaInput = (variable, id) => {
    setIaDynamicInputs((prev) => ({
      ...prev,
      [variable]: prev[variable].filter((input) => input.id !== id),
    }));
  };  

  const handleIaIntermediateSelect = (variable, id, selection) => {
    setIaIntermediateSelection((prev) => ({
      ...prev,
      [`${variable}-${id}`]: selection,
    }));
  };
  
  const handleIaServiceTypeSelect = (variable, id, serviceType) => {
    setIaServiceTypeSelection((prev) => ({
      ...prev,
      [`${variable}-${id}`]: serviceType,
    }));
  
    const source = iaDynamicInputs[variable].find((input) => input.id === id)?.source;
  
    if (source === "Inspecciones") {
      const updatedFields = getInspectionFields(serviceType);
      setIaFieldOptions((prev) => ({
        ...prev,
        [`${variable}-${id}`]: updatedFields,
      }));
    }
  };  

  const handleIaFieldSelect = (variable, id, field) => {
    const input = iaDynamicInputs[variable]?.find((input) => input.id === id);
    const source = input?.source || "";
    const period = iaIntermediateSelection[`${variable}-${id}`] || "all";
    const serviceType = iaServiceTypeSelection[`${variable}-${id}`] || "all";
  
    let combinedValue = `${source}-${field}`;
  
    // Si la fuente es "Inspecciones" o "Servicios", incluir período y tipo
    if (source === "Inspecciones" || source === "Inspección" || source === "Servicios") {
      combinedValue = `${source}-${period}-${serviceType}-${field}`;
    }

    if (source === "Procedimiento") {
      combinedValue = `${source}-${serviceType}-${field}`;
    }
  
    // Actualizar el valor combinado del input
    setIaDynamicInputs((prev) => ({
      ...prev,
      [variable]: prev[variable].map((input) =>
        input.id === id ? { ...input, value: combinedValue } : input
      ),
    }));
  
    // Actualizar el prompt para incluir el nombre personalizado
    const customName = iaDynamicInputs[variable]?.find((input) => input.id === id)?.name || combinedValue;
    setIaConfigurations((prev) => {
      const currentPrompt = prev[variable]?.prompt || "";
      const updatedPrompt = `${currentPrompt}\nUsar {{${customName}}} para ...`;
      return {
        ...prev,
        [variable]: {
          ...prev[variable],
          prompt: updatedPrompt,
        },
      };
    });
  
    // Actualizar el estado de campos seleccionados
    setIaSelectedField((prev) => ({
      ...prev,
      [`${variable}-${id}`]: field,
    }));
  };
  
  const handleIaInputNameChange = (variable, id, name) => {
    setIaDynamicInputs((prev) => ({
      ...prev,
      [variable]: prev[variable].map((input) =>
        input.id === id ? { ...input, name } : input
      ),
    }));
  };

  const handleTableIaInputNameChange = (key, id, name) => {
    setTableIaDynamicInputs((prev) => {
      if (!prev[key]) {
        console.error(`La clave ${key} no existe en tableIaDynamicInputs`);
        return prev; // Retorna el estado actual si la clave no existe
      }
  
      return {
        ...prev,
        [key]: prev[key].map((input) =>
          input.id === id ? { ...input, name } : input
        ),
      };
    });
  };  

  const initializeTableSourceOptions = (tableName, rowIndex, colIndex) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    let options = [
      "Cliente",
      "Estaciones Aéreas",
      "Estaciones Roedores",
      "Mapas",
      "Servicios",
      "Inspecciones",
    ];
  
    // Personalizar opciones según la entidad seleccionada
    if (selectedEntity === "servicio") {
      options = ["Servicio", "Inspecciones", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    } else if (selectedEntity === "inspeccion") {
      options = ["Inspección", "Servicio", "Responsable", "Acompañante", "Cliente", "Normativa Cliente", "Procedimiento"];
    }
  
    // Actualizar las opciones en el estado `tableSourceOptions`
    setTableSourceOptions((prev) => ({ ...prev, [key]: options }));
  };     

  const handleTableFuenteClick = (tableName, rowIndex, colIndex) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
  
    // Llama a la función para inicializar las opciones de fuente
    initializeTableSourceOptions(tableName, rowIndex, colIndex);
  
    // Activa el desplegable de fuente
    setTableShowSourceDropdown((prev) => ({ ...prev, [key]: true }));
  
    // Reinicia configuraciones de IA si estaban activas
    setTableShowIaConfiguration((prev) => ({ ...prev, [key]: false }));
    setTableIaConfigurations((prev) => ({ ...prev, [key]: undefined }));
    setTableIaDynamicInputs((prev) => ({ ...prev, [key]: [] }));
    setTableCustomizedValues((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };
  
  const handleSourceSelect = (variable, source) => {
    setSelectedSource((prev) => ({ ...prev, [variable]: source }));
  
    if (source === "Inspecciones") {
      setFieldOptions((prev) => ({ ...prev, [variable]: getInspectionFields("") })); // Por defecto sin filtro
      setIntermediateSelection((prev) => ({ ...prev, [variable]: "" })); // Reset período
      setServiceTypeSelection((prev) => ({ ...prev, [variable]: "" })); // Reset subtipo
    } else if (source === "Inspección") {
      setFieldOptions((prev) => ({ ...prev, [variable]: getInspectionFields("") }));
      setServiceTypeSelection((prev) => ({ ...prev, [variable]: "" })); // Reset subtipo
    } else if (source === "Servicios") {
      // Opciones de campos para Servicios
      setFieldOptions((prev) => ({ ...prev, [variable]: serviceFields }));
      setIntermediateSelection((prev) => ({ ...prev, [variable]: "" })); // Reset período
      setServiceTypeSelection((prev) => ({ ...prev, [variable]: "" })); // Reset tipo de servicio
    } else if (source === "Servicio") {
      // Opciones de campos para Servicios
      setFieldOptions((prev) => ({ ...prev, [variable]: serviceFields }));
    } else if (source === "Cliente") {
      // Opciones de campos para Cliente
      setFieldOptions((prev) => ({ ...prev, [variable]: clientFields }));
    } else if (source === "Normativa Cliente") {
      // Opciones de campos para Cliente
      setFieldOptions((prev) => ({ ...prev, [variable]: rulesClient }));
    } else if (source === "Procedimiento") {
      // Opciones de campos para Cliente
      setFieldOptions((prev) => ({ ...prev, [variable]: procedures }));
    } else if (source === "Responsable") {
      // Opciones de campos para Responsable
      setFieldOptions((prev) => ({ ...prev, [variable]: responsibleFields }));
    } else if (source === "Acompañante") {
      // Opciones de campos para Acompañante
      setFieldOptions((prev) => ({ ...prev, [variable]: responsibleFields }));
    } else if (source === "Estaciones Aéreas" || source === "Estaciones Roedores") {
      // Opciones de campos para Estaciones
      setFieldOptions((prev) => ({ ...prev, [variable]: stationFields }));
    } else if (source === "Mapas") {
      // Opciones de campos para Mapas
      setFieldOptions((prev) => ({ ...prev, [variable]: mapFields }));
    } else {
      // Fuente sin campos específicos
      setFieldOptions((prev) => ({ ...prev, [variable]: [] }));
    }
  };

  const handleTableSourceSelect = (tableName, rowIndex, colIndex, source) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    setTableSelectedSource((prev) => ({ ...prev, [key]: source }));
  
    if (source === "Inspecciones") {
      setTableFieldOptions((prev) => ({ ...prev, [key]: getInspectionFields("all") })); // Inicializa con "all"
      setTableIntermediateSelection((prev) => ({ ...prev, [key]: "all" })); // Período predeterminado
      setTableServiceTypeSelection((prev) => ({ ...prev, [key]: "all" })); // Tipo predeterminado
    } else if (source === "Inspección") {
      setTableFieldOptions((prev) => ({ ...prev, [key]: getInspectionFields("") })); // Configura campos
      setTableIntermediateSelection((prev) => ({ ...prev, [key]: "all" })); // Período fijo en "all"
      setTableServiceTypeSelection((prev) => ({ ...prev, [key]: "" })); // Reset tipo de servicio
    } else if (source === "Servicios") {
      setTableFieldOptions((prev) => ({ ...prev, [key]: serviceFields }));
      setTableIntermediateSelection((prev) => ({ ...prev, [key]: "all" })); // Período predeterminado
      setTableServiceTypeSelection((prev) => ({ ...prev, [key]: "all" })); // Tipo predeterminado
    } else if (source === "Servicio") {
      setTableFieldOptions((prev) => ({ ...prev, [key]: serviceFields }));
      setTableIntermediateSelection((prev) => ({ ...prev, [key]: "all" })); // Período fijo en "all"
      setTableServiceTypeSelection((prev) => ({ ...prev, [key]: "" })); // Reset tipo de servicio
    } else if (source === "Cliente") {
      setTableFieldOptions((prev) => ({ ...prev, [key]: clientFields }));
    } else if (source === "Responsable" || source === "Acompañante") {
      setTableFieldOptions((prev) => ({ ...prev, [key]: responsibleFields }));
    } else if (source === "Mapas") {
      setTableFieldOptions((prev) => ({ ...prev, [key]: mapFields }));
    } else {
      setTableFieldOptions((prev) => ({ ...prev, [key]: [] })); // Fuente sin campos específicos
    }
  };  

  const handleTableIntermediateSelect = (tableName, rowIndex, colIndex, selection) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    setTableIntermediateSelection((prev) => ({ ...prev, [key]: selection }));
  
    // Actualizar campos si la fuente es "Inspecciones" o "Servicios"
    if (tableSelectedSource[key] === "Inspecciones" || tableSelectedSource[key] === "Servicios") {
      const serviceType = tableServiceTypeSelection[key] || "all";
      const updatedFields = getInspectionFields(serviceType);
      setTableFieldOptions((prev) => ({ ...prev, [key]: updatedFields }));
    }
  };
  
  const handleTableServiceTypeSelect = (tableName, rowIndex, colIndex, serviceType) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    setTableServiceTypeSelection((prev) => ({ ...prev, [key]: serviceType }));
  
    // Actualizar campos dinámicamente según tipo seleccionado
    if (tableSelectedSource[key] === "Inspecciones" || tableSelectedSource[key] === "Servicios") {
      const updatedFields = getInspectionFields(serviceType);
      setTableFieldOptions((prev) => ({ ...prev, [key]: updatedFields }));
    }
  };  
  
  const handleServiceTypeSelect = (variable, serviceType) => {
    setServiceTypeSelection((prev) => ({ ...prev, [variable]: serviceType }));
  
    // Actualizar dinámicamente los campos según el tipo de inspección seleccionado
    if (selectedSource[variable] === "Inspecciones") {
      const updatedFields = getInspectionFields(serviceType);
      setFieldOptions((prev) => ({ ...prev, [variable]: updatedFields }));
    } else if (selectedSource[variable] === "Inspección") {
      const updatedFields = getInspectionFields(serviceType);
      setFieldOptions((prev) => ({ ...prev, [variable]: updatedFields }));
    }
  };

  const handleTableFieldSelect = (tableName, rowIndex, colIndex, field) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    const source = tableSelectedSource[key] || "";
    const period = tableIntermediateSelection[key] || "all";
    const serviceType = tableServiceTypeSelection[key] || "all";
  
    let combinedValue = `${source}-${field}`;
  
    // Agregar período y tipo de servicio si la fuente es "Inspecciones" o "Servicios"
    if (source === "Inspecciones" || source === "Inspección" || source === "Servicios") {
      combinedValue = `${source}-${period}-${serviceType}-${field}`;
    }

    if (source === "Procedimiento") {
      combinedValue = `${source}-${serviceType}-${field}`;
    }
  
    setTableData((prevTables) => {
      const updatedTable = { ...prevTables[tableName] };
      updatedTable.cuerpo[rowIndex][colIndex] = combinedValue;
  
      return { ...prevTables, [tableName]: updatedTable };
    });
  
    setTableSelectedField((prev) => ({ ...prev, [key]: field }));
  };   
  
  const handleIntermediateSelect = (variable, selection) => {
    setIntermediateSelection((prev) => ({ ...prev, [variable]: selection }));
  };  

  const handleFieldSelect = (variable, field) => {
    const source = selectedSource[variable];
    const period = intermediateSelection[variable] || "all";
    const serviceType = serviceTypeSelection[variable] || "all";
    let combinedValue = `${source}-${field}`;
  
    // Incluir el período y tipo si la fuente es "Inspecciones" o "Servicios"
    if (source === "Inspecciones" || source === "Inspección" || source === "Servicios") {
      combinedValue = `${source}-${period}-${serviceType}-${field}`;
    }

    if (source === "Procedimiento") {
      combinedValue = `${source}-${serviceType}-${field}`;
    }
  
    setVariableMappings((prevMappings) => ({
      ...prevMappings,
      [variable]: combinedValue,
    }));
  
    setSelectedField((prev) => ({ ...prev, [variable]: field }));
  };  

  // Manejar cambios en la tabla
  const handleTableCellChange = (tableName, rowIndex, colIndex, value) => {
    setTableData((prevTables) => {
      const updatedTable = { ...prevTables[tableName] };
      updatedTable.cuerpo[rowIndex][colIndex] = value;

      return { ...prevTables, [tableName]: updatedTable };
    });
  };

  const handleDeleteTableIaInput = (tableName, rowIndex, colIndex, inputId) => {
    const key = `${tableName}_${rowIndex}_${colIndex}`;
    setTableIaDynamicInputs((prev) => ({
      ...prev,
      [key]: prev[key].filter((input) => input.id !== inputId),
    }));
  };  

  // Guardar configuración
  const handleSaveConfiguration = async () => {
    // Clonar el mapeo actual
    const updatedMappings = { ...variableMappings };
  
    // Verificar si hay inputs dinámicos antes de procesarlos
    if (iaDynamicInputs && Object.keys(iaDynamicInputs).length > 0) {
      Object.entries(iaDynamicInputs).forEach(([variable, inputs]) => {
        inputs.forEach((input) => {
          if (input.name && input.value) {
            updatedMappings[input.name] = input.value; // Agregar input al mapeo con su nombre y valor
          }
        });
      });
    }

    // Verificar si hay inputs dinámicos en la tabla antes de procesarlos
    if (tableIaDynamicInputs && Object.keys(tableIaDynamicInputs).length > 0) {
      Object.entries(tableIaDynamicInputs).forEach(([key, inputs]) => {
        inputs.forEach((input) => {
          if (input.name && input.value) {
            updatedMappings[input.name] = input.value; // Agregar input de la tabla al mapeo
          }
        });
      });
    }
  
    // Preparar las tablas con el tipo incluido
    const preparedTables = Object.entries(tableData).map(([tableName, tableInfo]) => ({
      nombre: tableName,
      tipo: tableInfo.tipo || "Estática",
      orientacion: tableInfo.orientacion || null,
      encabezado: tableInfo.encabezado,
      cuerpo: tableInfo.cuerpo,
    }));
  
    // Validar que los modelos de IA sean válidos
    const preparedAiModels = aiModels
      .filter((model) => model.model && model.name && model.personality) // Filtrar modelos completos
      .map((model) => ({
        model: model.model,
        name: model.name,
        personality: model.personality,
      }));
  
    const configuration = {
      templateId: selectedTemplateId,
      entity: selectedEntity,
      variables: updatedMappings,
      tablas: preparedTables,
      aiModels: preparedAiModels,
      document_name: documentName,
      document_type: documentType,
    };
  
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/save-configuration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(configuration),
      });
  
      if (!response.ok) {
        throw new Error(`Error al guardar configuración: ${response.statusText}`);
      }
  
      const data = await response.json();
  
      console.log("Configuración guardada en el servidor:", data);
      alert("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error al enviar la configuración:", error);
      alert("Ocurrió un error al guardar la configuración. Por favor, intenta nuevamente.");
    }
  };  

  if (!templateData) {
    return <p className="text-center mt-4">Selecciona una plantilla para comenzar la configuración.</p>;
  }

  return (
    
    <div className="document-configurator mt-4">
      <Card className="mt-4">
        <Card.Header>
          <h4 className="text-center">Información del Documento</h4>
        </Card.Header>
        <Card.Body>
          <Row className="align-items-center mb-3"  style={{height: 'auto'}}>
            <Col sm={6}>
              <Form.Label>Nombre del Documento</Form.Label>
              <Form.Control
                type="text"
                placeholder="Escribe el nombre del documento"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
              />
            </Col>
            <Col sm={6}>
              <Form.Label>Formato del Documento</Form.Label>
              <Form.Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value="">-- Selecciona el formato --</option>
                <option value="doc">DOC</option>
                <option value="pdf">PDF</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      <Card className="mt-4 mb-4">
        <Card.Header>
          <h4 className="text-center">Modelos de IA</h4>
        </Card.Header>
        <Card.Body>
          {aiModels.map((model, index) => (
            <Row key={index} className="align-items-center mb-3" style={{height: 'auto'}}>
              <Col sm={2}>
                <Form.Select
                  value={model.model}
                  onChange={(e) => handleAiModelChange(index, "model", e.target.value)}
                >
                  <option value="">-- Selecciona un modelo --</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  <option value="gpt-4">gpt-4</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="gpt-4-32k">gpt-4-32k</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                </Form.Select>
              </Col>
              <Col sm={2}>
                <Form.Control
                  type="text"
                  placeholder="Nombre del modelo"
                  value={model.name}
                  onChange={(e) => handleAiModelChange(index, "name", e.target.value)}
                />
              </Col>
              <Col sm={6}>
                <Form.Control
                  as="textarea"
                  placeholder="Personalidad"
                  rows={1} // Opcional: define la altura inicial del textarea
                  value={model.personality}
                  onChange={(e) => handleAiModelChange(index, "personality", e.target.value)}
                />
              </Col>
              <Col sm={2}>
                <Button className="w-100" variant="danger" onClick={() => removeAiModel(index)}>
                  Eliminar
                </Button>
              </Col>
            </Row>
          ))}
          <div className="text-center mt-3">
            <Button variant="success" onClick={addAiModel}>
              Agregar Modelo de IA
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h4 className="text-center">Variables</h4>
        </Card.Header>
        <Card.Body>
          {templateData.datos.variables.map((variable) => (
            <Row key={variable.nombre} className="align-items-center mb-3" style={{height:'auto'}}>
              <Col sm={4}>
                <Form.Label>
                  <strong>{variable.nombre}</strong>
                </Form.Label>
              </Col>
              <Col sm={4}>
              <Form.Control
                type="text"
                placeholder={`Dato para ${variable.nombre}`}
                value={variableMappings[variable.nombre] || ""}
                readOnly
                disabled
              />
              </Col>
              <Col sm={4} className="text-center">
                <Button
                  variant="info"
                  size="sm"
                  className="me-2"
                  onClick={() => handleFuenteClick(variable.nombre)}
                >
                  Fuente
                </Button>
                <Button
                  variant="warning"
                  size="sm"
                  className="me-2"
                  onClick={() => handleIaClick(variable.nombre)}
                >
                  IA
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCustomClick(variable.nombre)}
                >
                  Personalizado
                </Button>
              </Col>

              {/* Desplegable de fuente */}
              {showSourceDropdown[variable.nombre] && (
                <Col sm={12} className="mt-2">
                  <Form.Select
                    onChange={(e) => handleSourceSelect(variable.nombre, e.target.value)}
                    value={selectedSource[variable.nombre] || ""} // Mostrar la fuente seleccionada
                    >
                    <option value="">-- Selecciona una fuente --</option>
                    {sourceOptions[variable.nombre]?.map((option, index) => (
                        <option key={index} value={option}>
                        {option}
                        </option>
                    ))}
                  </Form.Select>
                </Col>
              )}

            {/* Selector intermedio si la fuente es "Servicios" o "Inspecciones" */}
            {(showSourceDropdown[variable.nombre] && selectedSource[variable.nombre] === "Servicios" || selectedSource[variable.nombre] === "Inspecciones") && (
            <>
                <Col sm={12} className="mt-2">
                <Form.Select
                    onChange={(e) =>
                    handleIntermediateSelect(variable.nombre, e.target.value)
                    }
                    value={intermediateSelection[variable.nombre] || ""}
                >
                    <option value="">-- Selecciona un período --</option>
                    <option value="all">Todos</option>
                    <option value="this_year">Este año</option>
                    <option value="last_3_months">Últimos 3 meses</option>
                    <option value="last_month">Último mes</option>
                    <option value="this_week">Esta semana</option>
                </Form.Select>
                </Col>
                <Col sm={12} className="mt-2">
                <Form.Select
                    onChange={(e) =>
                    handleServiceTypeSelect(variable.nombre, e.target.value)
                    }
                    value={serviceTypeSelection[variable.nombre] || ""}
                >
                    <option value="">-- Selecciona un tipo de servicio --</option>
                    <option value="all">Todos</option>
                    <option value="Desinsectación">Desinsectación</option>
                    <option value="Desratización">Desratización</option>
                    <option value="Desinfección">Desinfección</option>
                    <option value="Roceria">Roceria</option>
                    <option value="Limpieza y aseo de archivos">
                    Limpieza y aseo de archivos
                    </option>
                    <option value="Lavado shut basura">Lavado shut basura</option>
                    <option value="Encarpado">Encarpado</option>
                    <option value="Lavado de tanque">Lavado de tanque</option>
                    <option value="Inspección">Inspección</option>
                    <option value="Diagnostico">Diagnostico</option>
                </Form.Select>
                </Col>
            </>
            )}

            {(showSourceDropdown[variable.nombre] && selectedSource[variable.nombre] === "Inspección" || showSourceDropdown[variable.nombre] && selectedSource[variable.nombre] === "Procedimiento") && (
            <>
                <Col sm={12} className="mt-2">
                <Form.Select
                    onChange={(e) =>
                    handleServiceTypeSelect(variable.nombre, e.target.value)
                    }
                    value={serviceTypeSelection[variable.nombre] || ""}
                >
                    <option value="">-- Selecciona un tipo de servicio --</option>
                    <option value="all">Todos</option>
                    <option value="Desinsectación">Desinsectación</option>
                    <option value="Desratización">Desratización</option>
                    <option value="Desinfección">Desinfección</option>
                    <option value="Roceria">Roceria</option>
                    <option value="Limpieza y aseo de archivos">
                    Limpieza y aseo de archivos
                    </option>
                    <option value="Lavado shut basura">Lavado shut basura</option>
                    <option value="Encarpado">Encarpado</option>
                    <option value="Lavado de tanque">Lavado de tanque</option>
                    <option value="Inspección">Inspección</option>
                    <option value="Diagnostico">Diagnostico</option>
                </Form.Select>
                </Col>
            </>
            )}

              {/* Desplegable de campos específicos si selecciona "Cliente" */}
              {showSourceDropdown[variable.nombre] && fieldOptions[variable.nombre] && (
                <Col sm={12} className="mt-2">
                    <Form.Select
                    onChange={(e) => handleFieldSelect(variable.nombre, e.target.value)}
                    value={selectedField[variable.nombre] || ""}
                    >
                    <option value="">-- Selecciona un campo --</option>
                    {fieldOptions[variable.nombre]?.map((field) => (
                        <option key={field.value} value={field.value}>
                        {field.label}
                        </option>
                    ))}
                    </Form.Select>
                </Col>
                )}

                {/* Mostrar configuración de IA */}
                {showIaConfiguration[variable.nombre] && (
                <>
                  {/* Selector de modelo */}
                  <Col sm={12} className="mt-2">
                    <Form.Select
                      value={iaConfigurations[variable.nombre]?.model || ""}
                      onChange={(e) =>
                        handleIaModelChange(variable.nombre, e.target.value)
                      }
                    >
                      <option value="">-- Selecciona un modelo --</option>
                      {aiModels.map((model, index) => (
                        <option key={index} value={model.model}>
                          {model.name || model.model}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  {/* Textarea para el prompt */}
                  <Col sm={12} className="mt-2">
                  <Form.Control
                    as="textarea"
                    placeholder="Escribe aquí el prompt"
                    rows={3}
                    value={iaConfigurations[variable.nombre]?.prompt || ""}
                    onChange={(e) => handleIaPromptChange(variable.nombre, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault(); // Evitar el comportamiento predeterminado
                        const currentPrompt = iaConfigurations[variable.nombre]?.prompt || "";
                        const updatedPrompt = `${currentPrompt}\n`;

                        // Actualizar el estado del prompt directamente
                        handleIaPromptChange(variable.nombre, updatedPrompt);
                      }
                    }}
                  />
                  </Col>
                  {/* Botón para agregar inputs */}
                  <Col sm={12} className="text-center mt-3">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleAddIaInput(variable.nombre)}
                    >
                      Agregar Inputs
                    </Button>
                  </Col>
                  {/* Inputs dinámicos */}
                  {iaDynamicInputs[variable.nombre]?.map((input) => (
                  <Row className="mt-4 align-items-center" key={input.id} style={{ height: 'auto' }}>
                    <hr></hr>
                    {/* Nombre del input */}
                    <Col sm={6}>
                      <Form.Control
                        type="text"
                        placeholder="Nombre personalizado"
                        value={input.name}
                        onChange={(e) =>
                          handleIaInputNameChange(variable.nombre, input.id, e.target.value)
                        }
                      />
                    </Col>

                    {/* Valor generado automáticamente */}
                    <Col sm={6}>
                      <Form.Control
                        type="text"
                        placeholder="Valor generado automáticamente"
                        value={input.value || ""}
                        readOnly
                      />
                    </Col>

                    {/* Selector de fuente */}
                    <Col sm={6}>
                      <Form.Select
                        value={input.source}
                        onChange={(e) =>
                          handleIaSourceSelect(variable.nombre, input.id, e.target.value)
                        }
                      >
                        <option value="">-- Selecciona una fuente --</option>
                        {sourceOptions[variable.nombre]?.map((option, index) => (
                          <option key={index} value={option}>
                            {option}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>

                    {/* Selectores adicionales */}
                    {(input.source === "Servicios" || input.source === "Inspecciones") && (
                      <>
                        <Col sm={6} className="mt-2">
                          <Form.Select
                            value={iaIntermediateSelection[`${variable.nombre}-${input.id}`] || ""}
                            onChange={(e) =>
                              handleIaIntermediateSelect(variable.nombre, input.id, e.target.value)
                            }
                          >
                            <option value="">-- Selecciona un período --</option>
                            <option value="all">Todos</option>
                            <option value="this_year">Este año</option>
                            <option value="last_3_months">Últimos 3 meses</option>
                            <option value="last_month">Último mes</option>
                            <option value="this_week">Esta semana</option>
                          </Form.Select>
                        </Col>
                        <Col sm={6} className="mt-2">
                          <Form.Select
                            value={iaServiceTypeSelection[`${variable.nombre}-${input.id}`] || ""}
                            onChange={(e) =>
                              handleIaServiceTypeSelect(variable.nombre, input.id, e.target.value)
                            }
                          >
                            <option value="">-- Selecciona un tipo de servicio --</option>
                            <option value="all">Todos</option>
                            <option value="Desinsectación">Desinsectación</option>
                            <option value="Desratización">Desratización</option>
                            <option value="Desinfección">Desinfección</option>
                            <option value="Roceria">Roceria</option>
                          </Form.Select>
                        </Col>
                      </>
                    )}

                    {/* Selectores adicionales */}
                    {(input.source === "Inspección" || input.source === "Procedimiento") && (
                      <>
                        <Col sm={6} className="mt-2">
                          <Form.Select
                            value={iaServiceTypeSelection[`${variable.nombre}-${input.id}`] || ""}
                            onChange={(e) =>
                              handleIaServiceTypeSelect(variable.nombre, input.id, e.target.value)
                            }
                          >
                            <option value="">-- Selecciona un tipo de servicio --</option>
                            <option value="all">Todos</option>
                            <option value="Desinsectación">Desinsectación</option>
                            <option value="Desratización">Desratización</option>
                            <option value="Desinfección">Desinfección</option>
                            <option value="Roceria">Roceria</option>
                          </Form.Select>
                        </Col>
                      </>
                    )}

                    {/* Selector de campos */}
                    {iaFieldOptions[`${variable.nombre}-${input.id}`] && (
                      <Col sm={6} className="mt-2">
                        <Form.Select
                          value={iaSelectedField[`${variable.nombre}-${input.id}`] || ""}
                          onChange={(e) =>
                            handleIaFieldSelect(variable.nombre, input.id, e.target.value)
                          }
                        >
                          <option value="">-- Selecciona un campo --</option>
                          {/* Agregar la opción "Todo" */}
                          <option value="all">Todo</option>
                          
                          {/* Generar opciones dinámicas */}
                          {iaFieldOptions[`${variable.nombre}-${input.id}`]?.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    )}

                    {/* Botón de eliminar */}
                    <Col sm={12} className="text-center mt-2">
                      <Button
                        className="w-100"
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteIaInput(variable.nombre, input.id)}
                      >
                        Eliminar
                      </Button>
                    </Col>

                    
                  </Row>
                  
                ))}
                </>
              )}
              
              {customizedValues[variable.nombre] !== undefined && (
                  <Col sm={12} className="mt-2">
                    <Form.Control
                      type="text"
                      placeholder="Ingresa un valor personalizado"
                      value={customizedValues[variable.nombre] || ""}
                      onChange={(e) =>
                        handleCustomValueChange(variable.nombre, e.target.value)
                      }
                    />
                  </Col>
                )}
            </Row>
          ))}
        </Card.Body>
      </Card>

      {/* Nueva sección para Tablas */}
      {templateData.datos.tablas && (
        <Card className="mt-4">
          <Card.Header>
            <h4 className="text-center">Tablas</h4>
          </Card.Header>
          <Card.Body>
            {templateData.datos.tablas.map((table) => (
              <div key={table.nombre} className="mb-4">
                <Form.Group as={Row} className="mb-3" style={{ height: "auto" }}>
                <Col sm={2}>
                    <Form.Label>Tipo de Tabla</Form.Label>
                </Col>
                <Col sm={4}>
                    <Form.Select
                    onChange={(e) =>
                        setTableData((prevTables) => ({
                        ...prevTables,
                        [table.nombre]: {
                            ...prevTables[table.nombre],
                            tipo: e.target.value,
                            orientacion: e.target.value === "Dinámica" ? "Horizontal" : "", // Valor predeterminado
                        },
                        }))
                    }
                    value={tableData[table.nombre]?.tipo || "Estática"}
                    >
                    <option value="Estática">Estática</option>
                    <option value="Dinámica">Dinámica</option>
                    </Form.Select>
                </Col>

                {/* Selector de Orientación si es Dinámica */}
                {tableData[table.nombre]?.tipo === "Dinámica" && (
                    <>
                    <Col sm={2}>
                        <Form.Label>Orientación</Form.Label>
                    </Col>
                    <Col sm={4}>
                        <Form.Select
                        onChange={(e) =>
                            setTableData((prevTables) => ({
                            ...prevTables,
                            [table.nombre]: {
                                ...prevTables[table.nombre],
                                orientacion: e.target.value, // Guardar la orientación seleccionada
                            },
                            }))
                        }
                        value={tableData[table.nombre]?.orientacion || "Horizontal"}
                        >
                        <option value="Horizontal">Horizontal</option>
                        <option value="Vertical">Vertical</option>
                        </Form.Select>
                    </Col>
                    </>
                )}
                </Form.Group>
                <h5>{table.nombre}</h5>
                <Table bordered>
                  <thead>
                    <tr>
                     {tableData[table.nombre]?.encabezado[0]?.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData[table.nombre]?.cuerpo.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex} style={{ width: `${100 / row.length}%`, verticalAlign: "top" }}>
                          <div className="d-flex flex-column">
                            <div className="d-flex align-items-center">
                              <Form.Control
                                type="text"
                                value={tableData[table.nombre]?.cuerpo[rowIndex][colIndex] || ""}
                                readOnly
                              />
                              <Button
                                variant="info"
                                size="sm"
                                className="ms-2"
                                onClick={() =>
                                  handleTableFuenteClick(table.nombre, rowIndex, colIndex)
                                }
                              >
                                Fuente
                              </Button>
                              <Button
                                variant="warning"
                                size="sm"
                                className="ms-2"
                                onClick={() => handleTableIaClick(table.nombre, rowIndex, colIndex)}
                              >
                                IA
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                className="ms-2"
                                onClick={() => handleTableCustomClick(table.nombre, rowIndex, colIndex)}
                              >
                                Personalizado
                              </Button>
                            </div>
                        
                            {/* Selector de fuente */}
                            {tableShowSourceDropdown[`${table.nombre}_${rowIndex}_${colIndex}`] && (
                              <Form.Select
                                className="mt-2"
                                onChange={(e) =>
                                  handleTableSourceSelect(
                                    table.nombre,
                                    rowIndex,
                                    colIndex,
                                    e.target.value
                                  )
                                }
                                value={
                                  tableSelectedSource[`${table.nombre}_${rowIndex}_${colIndex}`] || ""
                                }
                              >
                                <option value="">-- Selecciona una fuente --</option>
                                {tableSourceOptions[`${table.nombre}_${rowIndex}_${colIndex}`]?.map(
                                  (option, index) => (
                                    <option key={index} value={option}>
                                      {option}
                                    </option>
                                  )
                                )}
                              </Form.Select>
                            )}
                        
                            {/* Selector intermedio para "Servicios" y "Inspecciones" */}
                            {(tableSelectedSource[`${table.nombre}_${rowIndex}_${colIndex}`] === "Servicios" ||
                              tableSelectedSource[`${table.nombre}_${rowIndex}_${colIndex}`] === "Inspecciones") && (
                              <>
                                {/* Selector de Período */}
                                <Form.Select
                                  className="mt-2"
                                  onChange={(e) =>
                                    handleTableIntermediateSelect(
                                      table.nombre,
                                      rowIndex,
                                      colIndex,
                                      e.target.value
                                    )
                                  }
                                  value={
                                    tableIntermediateSelection[`${table.nombre}_${rowIndex}_${colIndex}`] || ""
                                  }
                                >
                                  <option value="">-- Selecciona un período --</option>
                                  <option value="all">Todos</option>
                                  <option value="this_year">Este año</option>
                                  <option value="last_3_months">Últimos 3 meses</option>
                                  <option value="last_month">Último mes</option>
                                  <option value="this_week">Esta semana</option>
                                </Form.Select>
                        
                                {/* Selector de Tipo de Servicio */}
                                <Form.Select
                                  className="mt-2"
                                  onChange={(e) =>
                                    handleTableServiceTypeSelect(
                                      table.nombre,
                                      rowIndex,
                                      colIndex,
                                      e.target.value
                                    )
                                  }
                                  value={
                                    tableServiceTypeSelection[`${table.nombre}_${rowIndex}_${colIndex}`] || ""
                                  }
                                >
                                  <option value="">-- Selecciona un tipo de servicio --</option>
                                  <option value="all">Todos</option>
                                  <option value="Desinsectación">Desinsectación</option>
                                  <option value="Desratización">Desratización</option>
                                  <option value="Desinfección">Desinfección</option>
                                  <option value="Roceria">Roceria</option>
                                </Form.Select>
                              </>
                            )}

                            {/* Selector intermedio para "Inspección" */}
                            {(tableSelectedSource[`${table.nombre}_${rowIndex}_${colIndex}`] === "Inspección" || tableSelectedSource[`${table.nombre}_${rowIndex}_${colIndex}`] === "Procedimiento") && (
                              <>
                        
                                {/* Selector de Tipo de Servicio */}
                                <Form.Select
                                  className="mt-2"
                                  onChange={(e) =>
                                    handleTableServiceTypeSelect(
                                      table.nombre,
                                      rowIndex,
                                      colIndex,
                                      e.target.value
                                    )
                                  }
                                  value={
                                    tableServiceTypeSelection[`${table.nombre}_${rowIndex}_${colIndex}`] || ""
                                  }
                                >
                                  <option value="">-- Selecciona un tipo de servicio --</option>
                                  <option value="all">Todos</option>
                                  <option value="Desinsectación">Desinsectación</option>
                                  <option value="Desratización">Desratización</option>
                                  <option value="Desinfección">Desinfección</option>
                                  <option value="Roceria">Roceria</option>
                                </Form.Select>
                              </>
                            )}
                        
                            {/* Selector de campos */}
                            {tableShowSourceDropdown[`${table.nombre}_${rowIndex}_${colIndex}`] && tableFieldOptions[`${table.nombre}_${rowIndex}_${colIndex}`] && (
                              <Form.Select
                                className="mt-2"
                                onChange={(e) =>
                                  handleTableFieldSelect(
                                    table.nombre,
                                    rowIndex,
                                    colIndex,
                                    e.target.value
                                  )
                                }
                                value={
                                  tableSelectedField[`${table.nombre}_${rowIndex}_${colIndex}`] || ""
                                }
                              >
                                <option value="">-- Selecciona un campo --</option>
                                {tableFieldOptions[`${table.nombre}_${rowIndex}_${colIndex}`]?.map(
                                  (field) => (
                                    <option key={field.value} value={field.value}>
                                      {field.label}
                                    </option>
                                  )
                                )}
                              </Form.Select>
                            )}

                            {tableShowIaConfiguration[`${table.nombre}_${rowIndex}_${colIndex}`] && (
                              <>
                              {/* Selector de modelo */}
                              <Form.Select
                                className="mt-2"
                                value={tableIaConfigurations[`${table.nombre}_${rowIndex}_${colIndex}`]?.model || ""}
                                onChange={(e) =>
                                  handleTableIaModelChange(table.nombre, rowIndex, colIndex, e.target.value)
                                }
                              >
                                <option value="">-- Selecciona un modelo --</option>
                                {aiModels.map((model, index) => (
                                  <option key={index} value={model.model}>
                                    {model.name || model.model}
                                  </option>
                                ))}
                              </Form.Select>

                                {/* NUEVO: Selector Sí/No para incluir ${ns} */}
                                <Form.Select
                                  className="mt-2"
                                  value={tableIaConfigurations[`${table.nombre}_${rowIndex}_${colIndex}`]?.ns || ""}
                                  onChange={(e) => {
                                    const selectedNS = e.target.value.toUpperCase(); // Convertimos a mayúsculas
                                    const key = `${table.nombre}_${rowIndex}_${colIndex}`;
                                    const prevConfig = tableIaConfigurations[key] || {};
                                    const model = prevConfig.model || "";
                                    const prompt = (prevConfig.prompt || "").replace(/\n/g, "\\n");

                                    const modelName = aiModels.find((m) => m.model === model)?.name || "ModeloIA";
                                    const finalValue = `IA-${modelName}-${prompt}-${selectedNS}`;

                                    // Guardamos la configuración del campo ns
                                    setTableIaConfigurations((prev) => ({
                                      ...prev,
                                      [key]: {
                                        ...prev[key],
                                        ns: selectedNS,
                                      },
                                    }));

                                    // Actualizamos el valor visible en la celda de la tabla
                                    setTableData((prevTables) => {
                                      const updated = { ...prevTables };
                                      updated[table.nombre].cuerpo[rowIndex][colIndex] = finalValue;
                                      return updated;
                                    });

                                    // Acción personalizada
                                    if (selectedNS === "S") {
                                      console.log(`⚡ Acción para SÍ: ${key}`);
                                      // Aquí puedes agregar más lógica
                                    } else if (selectedNS === "N") {
                                      console.log(`🚫 Acción para NO: ${key}`);
                                      // Aquí puedes agregar más lógica
                                    }
                                  }}
                                >
                                  <option value="">-- ¿Incluir NS? --</option>
                                  <option value="S">Sí</option>
                                  <option value="N">No</option>
                                </Form.Select>

                                  {/* Textarea para el prompt */}
                                  <Form.Control
                                    as="textarea"
                                    className="mt-2"
                                    placeholder="Escribe aquí el prompt"
                                    rows={3}
                                    value={tableIaConfigurations[`${table.nombre}_${rowIndex}_${colIndex}`]?.prompt || ""}
                                    onChange={(e) => {
                                      const newPrompt = e.target.value;
                                      const key = `${table.nombre}_${rowIndex}_${colIndex}`;
                                      const prevConfig = tableIaConfigurations[key] || {};
                                      const model = prevConfig.model || "";
                                      const ns = prevConfig.ns || "";

                                      const modelName = aiModels.find((m) => m.model === model)?.name || "ModeloIA";
                                      const processedPrompt = newPrompt.replace(/\n/g, "\\n");
                                      const finalValue = `IA-${modelName}-${processedPrompt}-${ns}`;

                                      setTableIaConfigurations((prev) => ({
                                        ...prev,
                                        [key]: {
                                          ...prev[key],
                                          prompt: newPrompt,
                                        },
                                      }));

                                      setTableData((prevTables) => {
                                        const updated = { ...prevTables };
                                        updated[table.nombre].cuerpo[rowIndex][colIndex] = finalValue;
                                        return updated;
                                      });
                                    }}
                                  />

                                {/* Botón para agregar inputs */}
                                <Col sm={12} className="text-center mt-3">
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleAddTableIaInput(table.nombre, rowIndex, colIndex)}
                                  >
                                    Agregar Inputs
                                  </Button>
                                </Col>
                              </>
                            )}

                            {/* Inputs dinámicos */}
                            {tableIaDynamicInputs[`${table.nombre}_${rowIndex}_${colIndex}`]?.map((input) => (
                              <Row key={input.id} className="align-items-center mt-2" style={{ height: 'auto' }}>
                                <hr></hr>

                                {/* Nombre del input */}
                                <Col sm={12} className="mt-2">
                                  <Form.Control
                                    type="text"
                                    placeholder="Nombre personalizado"
                                    value={input.name}
                                    onChange={(e) =>
                                      handleTableIaInputNameChange(`${table.nombre}_${rowIndex}_${colIndex}`, input.id, e.target.value)
                                    }
                                  />
                                </Col>

                                {/* Valor generado automáticamente */}
                                <Col sm={12} className="mt-2">
                                  <Form.Control
                                    type="text"
                                    placeholder="Valor generado automáticamente"
                                    value={input.value || ""}
                                    readOnly
                                  />
                                </Col>

                                {/* Selector de fuente */}
                                <Col sm={12} className="mt-2">
                                <Form.Select
                              value={input.source}
                              onChange={(e) =>
                                handleTableIaSourceSelect(table.nombre, rowIndex, colIndex, input.id, e.target.value)
                              }
                            >
                              <option value="">-- Selecciona una fuente --</option>
                              {tableSourceOptions[`${table.nombre}_${rowIndex}_${colIndex}`]?.map((option, index) => (
                                <option key={index} value={option}>
                                  {option}
                                </option>
                              ))}
                            </Form.Select>
                                </Col>

                                {/* Selectores adicionales */}
                                {(input.source === "Servicios" || input.source === "Inspecciones") && (
                                  <>
                                    <Col sm={12} className="mt-2">
                                      <Form.Select
                                        value={tableIntermediateSelection[`${table.nombre}_${rowIndex}_${colIndex}`] || ""}
                                        onChange={(e) =>
                                          handleTableIntermediateSelect(table.nombre, rowIndex, colIndex, e.target.value)
                                        }
                                      >
                                        <option value="">-- Selecciona un período --</option>
                                        <option value="all">Todos</option>
                                        <option value="this_year">Este año</option>
                                        <option value="last_3_months">Últimos 3 meses</option>
                                        <option value="last_month">Último mes</option>
                                        <option value="this_week">Esta semana</option>
                                      </Form.Select>
                                    </Col>
                                    <Col sm={12} className="mt-2">
                                      <Form.Select
                                        value={tableServiceTypeSelection[`${table.nombre}_${rowIndex}_${colIndex}`] || ""}
                                        onChange={(e) =>
                                          handleTableServiceTypeSelect(table.nombre, rowIndex, colIndex, e.target.value)
                                        }
                                      >
                                        <option value="">-- Selecciona un tipo de servicio --</option>
                                        <option value="all">Todos</option>
                                        <option value="Desinsectación">Desinsectación</option>
                                        <option value="Desratización">Desratización</option>
                                        <option value="Desinfección">Desinfección</option>
                                        <option value="Roceria">Roceria</option>
                                      </Form.Select>
                                    </Col>
                                  </>
                                )}

                                 {/* Selectores adicionales */}
                                 {(input.source === "Inspección") && (
                                  <>
                                    <Col sm={12} className="mt-2">
                                      <Form.Select
                                        value={tableServiceTypeSelection[`${table.nombre}_${rowIndex}_${colIndex}`] || ""}
                                        onChange={(e) =>
                                          handleTableServiceTypeSelect(table.nombre, rowIndex, colIndex, e.target.value)
                                        }
                                      >
                                        <option value="">-- Selecciona un tipo de servicio --</option>
                                        <option value="all">Todos</option>
                                        <option value="Desinsectación">Desinsectación</option>
                                        <option value="Desratización">Desratización</option>
                                        <option value="Desinfección">Desinfección</option>
                                        <option value="Roceria">Roceria</option>
                                      </Form.Select>
                                    </Col>
                                  </>
                                )}

                                {/* Selector de campos */}
                                {tableFieldOptions[`${table.nombre}_${rowIndex}_${colIndex}-${input.id}`] && (
                                  <Col sm={12} className="mt-2">
                                    <Form.Select
                                      value={input.field || ""} // Usar directamente el valor de `input.field`
                                      onChange={(e) =>
                                        handleTableIaFieldSelect(table.nombre, rowIndex, colIndex, input.id, e.target.value)
                                      }
                                    >
                                      <option value="">-- Selecciona un campo --</option>
                                      {tableFieldOptions[`${table.nombre}_${rowIndex}_${colIndex}-${input.id}`]?.map((field) => (
                                        <option key={field.value} value={field.value}>
                                          {field.label}
                                        </option>
                                      ))}
                                    </Form.Select>
                                  </Col>
                                )}

                                {/* Botón de eliminar */}
                                <Col sm={12} className="text-center mt-2">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    className="w-100"
                                    onClick={() =>
                                      handleDeleteTableIaInput(table.nombre, rowIndex, colIndex, input.id)
                                    }
                                  >
                                    Eliminar
                                  </Button>
                                </Col>
                              </Row>
                            ))}

                            {/* Campo personalizado */}
                            {tableCustomizedValues[`${table.nombre}_${rowIndex}_${colIndex}`] !== undefined && (
                              <Form.Control
                                className="mt-2"
                                type="text"
                                placeholder="Ingresa un valor personalizado"
                                value={tableCustomizedValues[`${table.nombre}_${rowIndex}_${colIndex}`] || ""}
                                onChange={(e) =>
                                  handleTableCustomValueChange(table.nombre, rowIndex, colIndex, e.target.value)
                                }
                              />
                            )}

                          </div>
                        </td>                                                                       
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      <div className="text-center mt-4">
        <Button variant="success" onClick={handleSaveConfiguration}>
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};

export default DocumentConfigurator;
