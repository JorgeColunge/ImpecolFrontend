import React, { useEffect, useState } from 'react';
import './ProductList.css';
import axios from 'axios';
import { Button, Card, Modal, Form, Collapse } from 'react-bootstrap';
import { BsPencilSquare, BsTrash, BsEye, BsGrid, BsClockHistory, BsDropletHalf, BsBookHalf, BsBodyText } from 'react-icons/bs';
import { saveProducts, getProducts } from './indexedDBHandler';
import 'bootstrap/dist/css/bootstrap.min.css';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // Nuevo estado para el modal de detalles
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // Nuevo estado para el producto seleccionado  
  const [newProduct, setNewProduct] = useState({
    name: '',
    description_type: '',
    safety_data_sheet: '',
    technical_sheet: '',
    health_registration: '',
    emergency_card: '',
    category: [] // Inicializa la categoría como un arreglo vacío
  });


  const categoryOptions = [
    "Hogar",
    "Empresarial",
    "Jardinería",
    "Horizontal"
  ];

  const [expandedCardId, setExpandedCardId] = useState(null);

  const toggleActions = (id) => {
    setExpandedCardId((prevId) => (prevId === id ? null : id));
  };

  const [showCategoryOptions, setShowCategoryOptions] = useState(false); // Controlar el colapso de categorías  

  const [safetyDataSheetFile, setSafetyDataSheetFile] = useState(null);
  const [technicalSheetFile, setTechnicalSheetFile] = useState(null);
  const [healthRegistrationFile, setHealthRegistrationFile] = useState(null);
  const [emergencyCardFile, setEmergencyCardFile] = useState(null);

  const [pendingAlert, setPendingAlert] = useState(false);

  const filteredProducts = products.filter((product) =>
    (product.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
    product.category.some(cat => (cat || '').toLowerCase().includes(searchText.toLowerCase()))
  );

  const prefirmarArchivo = async (fileUrl) => {
    console.log('Iniciando proceso para prefirmar archivo...');
    try {
      if (!fileUrl) {
        console.error('Error: La URL del archivo es inválida o no se proporcionó.');
        return null;
      }
      console.log('URL recibida para prefirmar:', fileUrl);

      // Decodificar la URL antes de enviarla
      const decodedUrl = decodeURIComponent(fileUrl);
      console.log('URL decodificada para prefirmar:', decodedUrl);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/PrefirmarArchivos`, { url: fileUrl });

      if (response.data && response.data.signedUrl) {
        console.log('URL prefirmada generada con éxito:', response.data.signedUrl);
        return response.data.signedUrl;
      } else {
        console.error('Error: Respuesta inesperada del servidor al generar la URL prefirmada.', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error al prefirmar archivo:', error.message, error.response?.data || error);
      alert('No se pudo generar la URL prefirmada. Por favor, verifica el archivo.');
      return null;
    }
  };

  const uploadFileToS3 = async (file, preSignedUrl) => {
    console.log('Iniciando subida de archivo a S3...');
    console.log('Archivo a cargar:', file?.name);
    console.log('URL prefirmada proporcionada:', preSignedUrl);

    if (!file || !preSignedUrl) {
      console.error('Error: Archivo o URL prefirmada no proporcionados.');
      return false;
    }

    try {
      const response = await axios.put(preSignedUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (response.status === 200) {
        console.log(`Archivo ${file.name} cargado con éxito a S3.`);
        return true;
      } else {
        console.error('Error: Respuesta inesperada al cargar archivo a S3.', response.status, response.data);
        return false;
      }
    } catch (error) {
      console.error(`Error al cargar el archivo ${file.name} a S3:`, error.message, error.response?.data || error);
      return false;
    }
  };

  // Función para manejar la vista de archivos con URL prefirmada
  const verArchivoPrefirmado = async (fileUrl) => {
    console.log('Intentando abrir archivo con URL prefirmada...');
    try {
      const signedUrl = await prefirmarArchivo(fileUrl);
      if (signedUrl) {
        console.log('Abriendo archivo en una nueva pestaña...');
        window.open(signedUrl, '_blank');
      } else {
        console.error('Error: No se pudo obtener la URL prefirmada para el archivo.');
      }
    } catch (error) {
      console.error('Error al intentar abrir archivo con URL prefirmada:', error.message);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (navigator.onLine) {
          console.log('🌐 Online: descargando productos...');
          const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/products`);

          // 🔧 normaliza category → array
          const normalized = data.map(p => ({
            ...p,
            category: Array.isArray(p.category)
              ? p.category
              : typeof p.category === 'string'
                ? p.category.split(',').map(c => c.trim())
                : []
          }));

          setProducts(normalized);
          await saveProducts(normalized);          // <—— NUEVO
        } else {
          console.log('📴 Offline: leyendo productos desde IndexedDB');
          const offlineProducts = await getProducts(); // <—— NUEVO
          setProducts(offlineProducts);
        }
      } catch (err) {
        console.error('❌ Error fetchProducts:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setNewProduct((prevProduct) => {
      const currentCategories = prevProduct.category || [];
      const updatedCategories = checked
        ? [...currentCategories, value] // Agrega categoría seleccionada
        : currentCategories.filter((cat) => cat !== value); // Elimina categoría deseleccionada

      console.log("Categorías actualizadas:", updatedCategories); // Depura las categorías seleccionadas
      return { ...prevProduct, category: updatedCategories };
    });
  };

  const handleShowModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      setNewProduct({
        ...product,
        category: Array.isArray(product.category)
          ? product.category
          : typeof product.category === 'string'
            ? product.category.split(',').map(cat => cat.trim()) // Convierte un string separado por comas a un arreglo
            : []
      });
    } else {
      setNewProduct({
        name: '',
        description_type: '',
        dose: '',
        residual_duration: '',
        safety_data_sheet: '',
        technical_sheet: '',
        health_registration: '',
        emergency_card: '',
        category: [] // Inicializa la categoría como un arreglo vacío
      });
    }
    setShowModal(true);
  };

  const handleShowDetailModal = (product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleAddOrEditProduct = async () => {
    console.log("Datos del nuevo producto antes de enviar:", newProduct);

    if (!newProduct.name || newProduct.name.trim() === '') {
      alert('El campo "Nombre" es obligatorio.');
      return;
    }

    if (!newProduct.category || newProduct.category.length === 0) {
      alert('Debes seleccionar al menos una categoría.');
      return;
    }

    let response; // Declara response aquí
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('description_type', newProduct.description_type);
      formData.append(
        'category',
        JSON.stringify(Array.isArray(newProduct.category) ? newProduct.category : [])
      );

      // Archivos opcionales
      if (safetyDataSheetFile) formData.append('safety_data_sheet', safetyDataSheetFile);
      if (technicalSheetFile) formData.append('technical_sheet', technicalSheetFile);
      if (healthRegistrationFile) formData.append('health_registration', healthRegistrationFile);
      if (emergencyCardFile) formData.append('emergency_card', emergencyCardFile);

      console.log("FormData enviado al servidor:");
      formData.forEach((value, key) => console.log(`${key}: ${value}`)); // Log de FormData

      response = editingProduct
        ? await axios.put(
          `${process.env.REACT_APP_API_URL}/api/products/${editingProduct.id}`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        : await axios.post(`${process.env.REACT_APP_API_URL}/api/products`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

      console.log("Respuesta del servidor al guardar producto:", response.data);

      // Lógica para actualizar productos en el estado
      if (editingProduct) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.id === editingProduct.id
              ? {
                ...response.data.product
              }
              : product
          )
        );

      } else {
        const newProduct = {
          ...response.data.product, // Usamos el producto directamente
          category: Array.isArray(response.data.product.category)
            ? response.data.product.category
            : typeof response.data.product.category === 'string'
              ? JSON.parse(response.data.product.category) // Convierte la cadena JSON a un arreglo
              : [],
          dose: response.data.product.dose || 'No especificada',
          residual_duration: response.data.product.residual_duration || 'No especificada',
        };

        setProducts((prevProducts) => [...prevProducts, newProduct]);
      }

      console.log("Estado de productos después de actualizar:", products);

      alert('Producto registrado correctamente.');
      setShowConfirmationModal(false);
      handleCloseModal();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      alert('Error al registrar el producto.');
    }
  };


  const deleteProduct = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/products/${id}`);
        setProducts(products.filter(product => product.id !== id));
        alert("Producto eliminado exitosamente.");
      } catch (error) {
        console.error("Error al eliminar producto:", error);
        alert("Hubo un error al eliminar el producto.");
      }
    }
  };

  if (loading) return <div>Cargando productos...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <Form.Group controlId="searchProducts" className="mb-0 flex-grow-1 me-3">
          <Form.Control
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Form.Group>
        <Button variant="success" onClick={() => handleShowModal()}>
          Agregar Producto
        </Button>
      </div>

      {pendingAlert && (
        <div className="alert alert-info">El registro del producto estará listo en breve</div>
      )}

      <div className="row">
        {filteredProducts.map((product, index) => (
          <div key={product.id} className="col-sm-6 col-md-4 col-lg-3 mb-4">
            <Card
              className="border"
              style={{
                cursor: "pointer",
                minHeight: "280px",
                height: "280px",
              }}
              onClick={() => handleShowDetailModal(product)} // Abre el modal de detalles al hacer clic en la tarjeta
            >
              <Card.Body>
                <div className="d-flex justify-content-center align-items-center mb-3">
                  <h5 className="fw-bold text-center">{product.name}</h5>
                </div>
                <hr />
                <div className="mt-2">
                  <BsGrid className="text-warning me-2" />
                  <span>
                    <strong>Categoría: </strong>
                    {Array.isArray(product.category) && product.category.length > 0
                      ? product.category
                        .map((cat) => cat.replace(/[\[\]"]/g, ""))
                        .join(", ") // Elimina corchetes y comillas y une con comas
                      : typeof product.category === "string"
                        ? product.category.replace(/[\[\]"]/g, "") // Elimina corchetes y comillas si es un string
                        : "Sin categoría"}
                  </span>
                </div>
              </Card.Body>
              <Card.Footer
                className="text-center position-relative"
                style={{ background: "#f9f9f9", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation(); // Evita abrir el modal de detalles
                  toggleActions(product.id);
                }}
              >
                <small className="text-success">
                  {expandedCardId === product.id ? "Cerrar Acciones" : "Acciones"}
                </small>
                {expandedCardId === product.id && (
                  <div className={`menu-actions ${expandedCardId === product.id ? "expand" : "collapse"}`}>
                    <button
                      className="btn d-block"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Editar Producto: ${product.name}`);
                      }}
                    >
                      <BsPencilSquare size={18} className="me-2" />
                      Editar
                    </button>
                    <button
                      className="btn d-block"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Eliminar Producto: ${product.name}`);
                      }}
                    >
                      <BsTrash size={18} className="me-2" />
                      Eliminar
                    </button>
                  </div>
                )}
              </Card.Footer>
            </Card>
          </div>
        ))}
      </div>

      {/* Modal para agregar/editar producto */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingProduct ? "Editar Producto" : "Agregar Producto"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formName" className="mb-3">
              <Form.Label>Nombre</Form.Label>
              <Form.Control type="text" name="name" value={newProduct.name} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group controlId="formDescriptionType" className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control type="text" name="description_type" value={newProduct.description_type} onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mt-3">
              <Form.Label style={{ fontWeight: "bold" }}>Categoría</Form.Label>
              <div className="d-flex flex-wrap">
                {categoryOptions.map((option, index) => (
                  <div key={index} className="col-4 mb-2">
                    <Form.Check
                      type="checkbox"
                      label={<span style={{ fontSize: "0.8rem" }}>{option}</span>}
                      value={option}
                      checked={newProduct.category.includes(option)}
                      onChange={(e) => handleCategoryChange(e)}
                    />
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group controlId="formSafetyDataSheet" className="mb-3 d-flex align-items-center flex-column">
              <div className="d-flex w-100 align-items-center">
                <Form.Label className="me-2">Hoja de Datos de Seguridad</Form.Label>
                <div className="ms-auto d-flex justify-content-end">
                  {/* Botón para cargar archivo */}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      setSafetyDataSheetFile(e.target.files[0]);
                      setNewProduct({ ...newProduct, safety_data_sheet: e.target.files[0]?.name || '' });
                    }}
                    style={{ display: 'none' }}
                    id="safetyDataSheetFileInput"
                  />
                  <Button variant="link" size="sm" onClick={() => document.getElementById('safetyDataSheetFileInput').click()}>
                    <BsPencilSquare style={{ color: 'green', fontSize: '1.2em' }} />
                  </Button>
                  {/* Botón para ver el archivo */}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      if (newProduct.safety_data_sheet) {
                        window.open(newProduct.safety_data_sheet, '_blank');
                      } else {
                        alert("No hay Hoja de Datos de Seguridad disponible.");
                      }
                    }}
                  >
                    <BsEye style={{ color: 'orange', fontSize: '1.2em' }} />
                  </Button>
                  {/* Botón para eliminar el archivo */}
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSafetyDataSheetFile(null);
                      setNewProduct({ ...newProduct, safety_data_sheet: '' });
                      alert("Hoja de Datos de Seguridad eliminada.");
                    }}
                  >
                    <BsTrash style={{ color: 'red', fontSize: '1.2em' }} />
                  </Button>
                </div>
              </div>
              {/* Mostrar nombre del archivo si existe */}
              <small className="text-muted mt-1">
                {newProduct.safety_data_sheet || 'Sin archivo seleccionado'}
              </small>
            </Form.Group>

            <Form.Group controlId="formTechnicalSheet" className="mb-3 d-flex align-items-center flex-column">
              <div className="d-flex w-100 align-items-center">
                <Form.Label className="me-2">Ficha Técnica</Form.Label>
                <div className="ms-auto d-flex justify-content-end">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      setTechnicalSheetFile(e.target.files[0]);
                      setNewProduct({ ...newProduct, technical_sheet: e.target.files[0]?.name || '' });
                    }}
                    style={{ display: 'none' }}
                    id="technicalSheetFileInput"
                  />
                  <Button variant="link" size="sm" onClick={() => document.getElementById('technicalSheetFileInput').click()}>
                    <BsPencilSquare style={{ color: 'green', fontSize: '1.2em' }} />
                  </Button>
                  <Button variant="link" size="sm" onClick={() => newProduct.technical_sheet && window.open(newProduct.technical_sheet, '_blank')}>
                    <BsEye style={{ color: 'orange', fontSize: '1.2em' }} />
                  </Button>
                  <Button variant="link" size="sm" onClick={() => {
                    setTechnicalSheetFile(null);
                    setNewProduct({ ...newProduct, technical_sheet: '' });
                  }}>
                    <BsTrash style={{ color: 'red', fontSize: '1.2em' }} />
                  </Button>
                </div>
              </div>
              <small className="text-muted mt-1">{newProduct.technical_sheet || 'Sin archivo seleccionado'}</small>
            </Form.Group>

            <Form.Group controlId="formHealthRegistration" className="mb-3 d-flex align-items-center flex-column">
              <div className="d-flex w-100 align-items-center">
                <Form.Label className="me-2">Registro Sanitario</Form.Label>
                <div className="ms-auto d-flex justify-content-end">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      setHealthRegistrationFile(e.target.files[0]);
                      setNewProduct({ ...newProduct, health_registration: e.target.files[0]?.name || '' });
                    }}
                    style={{ display: 'none' }}
                    id="healthRegistrationFileInput"
                  />
                  <Button variant="link" size="sm" onClick={() => document.getElementById('healthRegistrationFileInput').click()}>
                    <BsPencilSquare style={{ color: 'green', fontSize: '1.2em' }} />
                  </Button>
                  <Button variant="link" size="sm" onClick={() => newProduct.health_registration && window.open(newProduct.health_registration, '_blank')}>
                    <BsEye style={{ color: 'orange', fontSize: '1.2em' }} />
                  </Button>
                  <Button variant="link" size="sm" onClick={() => {
                    setHealthRegistrationFile(null);
                    setNewProduct({ ...newProduct, health_registration: '' });
                  }}>
                    <BsTrash style={{ color: 'red', fontSize: '1.2em' }} />
                  </Button>
                </div>
              </div>
              <small className="text-muted mt-1">{newProduct.health_registration || 'Sin archivo seleccionado'}</small>
            </Form.Group>

            <Form.Group controlId="formEmergencyCard" className="mb-3 d-flex align-items-center flex-column">
              <div className="d-flex w-100 align-items-center">
                <Form.Label className="me-2">Tarjeta de Emergencia</Form.Label>
                <div className="ms-auto d-flex justify-content-end">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      setEmergencyCardFile(e.target.files[0]);
                      setNewProduct({ ...newProduct, emergency_card: e.target.files[0]?.name || '' });
                    }}
                    style={{ display: 'none' }}
                    id="emergencyCardFileInput"
                  />
                  <Button variant="link" size="sm" onClick={() => document.getElementById('emergencyCardFileInput').click()}>
                    <BsPencilSquare style={{ color: 'green', fontSize: '1.2em' }} />
                  </Button>
                  <Button variant="link" size="sm" onClick={() => newProduct.emergency_card && window.open(newProduct.emergency_card, '_blank')}>
                    <BsEye style={{ color: 'orange', fontSize: '1.2em' }} />
                  </Button>
                  <Button variant="link" size="sm" onClick={() => {
                    setEmergencyCardFile(null);
                    setNewProduct({ ...newProduct, emergency_card: '' });
                  }}>
                    <BsTrash style={{ color: 'red', fontSize: '1.2em' }} />
                  </Button>
                </div>
              </div>
              <small className="text-muted mt-1">{newProduct.emergency_card || 'Sin archivo seleccionado'}</small>
            </Form.Group>

          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button
            variant="primary"
            onClick={() => setShowConfirmationModal(true)}
          >
            {editingProduct ? "Guardar Cambios" : "Registrar Producto"}
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal para ver detalles del producto */}
      <Modal show={showDetailModal} onHide={handleCloseDetailModal}>
        <Modal.Header closeButton>
          <Modal.Title>Detalles del Producto</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedProduct && (
            <>
              <p>
                <strong>
                  <i className="text-primary">
                    <BsBodyText className="text-center me-2" />
                  </i>
                  Nombre:
                </strong>{" "}
                {selectedProduct.name}
              </p>

              <p>
                <strong>
                  <BsGrid className="text-warning me-2" />
                  Categoría:
                </strong>{" "}
                {Array.isArray(selectedProduct.category) && selectedProduct.category.length > 0
                  ? selectedProduct.category.join(", ")
                  : "Sin categoría"}
              </p>

              <div className="d-flex justify-content-between align-items-center">
                <p>
                  <strong>
                    <BsBookHalf className="text-secondary me-2" />
                    Hoja de Datos de Seguridad:
                  </strong>
                </p>
                {selectedProduct.safety_data_sheet ? (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      if (selectedProduct.safety_data_sheet) {
                        verArchivoPrefirmado(selectedProduct.safety_data_sheet);
                      } else {
                        alert("No hay Hoja de Datos de Seguridad disponible.");
                      }
                    }}
                  >
                    <BsEye style={{ color: "orange", fontSize: "1.2em" }} />
                  </Button>
                ) : null}
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <p>
                  <strong>
                    <BsBookHalf className="text-secondary me-2" />
                    Ficha Técnica:
                  </strong>
                </p>
                {selectedProduct.technical_sheet ? (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      if (selectedProduct.technical_sheet) {
                        verArchivoPrefirmado(selectedProduct.technical_sheet);
                      } else {
                        alert("No hay Ficha Técnica disponible.");
                      }
                    }}
                  >
                    <BsEye style={{ color: "orange", fontSize: "1.2em" }} />
                  </Button>
                ) : null}
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <p>
                  <strong>
                    <BsBookHalf className="text-secondary me-2" />
                    Registro Sanitario:
                  </strong>
                </p>
                {selectedProduct.health_registration ? (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      if (selectedProduct.health_registration) {
                        verArchivoPrefirmado(selectedProduct.health_registration);
                      } else {
                        alert("No hay Registro Sanitario disponible.");
                      }
                    }}
                  >
                    <BsEye style={{ color: "orange", fontSize: "1.2em" }} />
                  </Button>
                ) : null}
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <p>
                  <strong>
                    <BsBookHalf className="text-secondary me-2" />
                    Tarjeta de Emergencia:
                  </strong>
                </p>
                {selectedProduct.emergency_card ? (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      if (selectedProduct.emergency_card) {
                        verArchivoPrefirmado(selectedProduct.emergency_card);
                      } else {
                        alert("No hay Tarjeta de Emergencia disponible.");
                      }
                    }}
                  >
                    <BsEye style={{ color: "orange", fontSize: "1.2em" }} />
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDetailModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal para confirmar el registro del producto */}
      <Modal show={showConfirmationModal} onHide={() => setShowConfirmationModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Estás seguro de que quieres registrar este producto?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmationModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleAddOrEditProduct(); // Llama a la función de registro
              setShowConfirmationModal(false); // Cierra el modal de confirmación
              handleCloseModal(); // Cierra el modal principal
            }}
          >
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}

export default ProductList;