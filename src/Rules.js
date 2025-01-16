import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Button, Modal, Form, Dropdown } from 'react-bootstrap';
import { PencilSquare, Trash } from 'react-bootstrap-icons';
import './Rules.css';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newRule, setNewRule] = useState({ category: '', rule: '', description: '' });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState(''); // Nueva categoría
  const [isEditing, setIsEditing] = useState(false); // Nuevo estado para saber si estamos editando
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRulesAndCategories = async () => {
        setLoading(true);
        try {
          const rulesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rules`);
          const categoriesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rules/categories`);
          console.log('Rules:', rulesResponse.data); // Verifica si las normas tienen categorías correctas
          console.log('Categories:', categoriesResponse.data); // Verifica los datos de categorías
          setRules(rulesResponse.data);
          setCategories(categoriesResponse.data);
        } catch (error) {
          console.error('Error al cargar las normas y categorías:', error);
          setError('Error al cargar las normas y categorías');
        } finally {
          setLoading(false);
        }
      };      
    fetchRulesAndCategories();
  }, []);   

  const handleShowModal = () => {
    setNewRule({ category: '', norma: '', description: '' }); // Limpia los campos
    setIsEditing(false); // Indica que estamos en modo agregar
    setShowModal(true);
  };
  
  const handleEditModal = (rule) => {
    setNewRule({
      category: rule.category,
      rule: rule.rule, // Aseguramos que el campo `rule` se prellene correctamente
      description: rule.description,
    });
    setIsEditing(true); // Indica que estamos en modo edición
    setSelectedRule(rule); // Establece la norma seleccionada para editar
    setShowModal(true);
  };    
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRule(null); // Limpia la norma seleccionada
  };  

  const handleEditRule = async () => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/rules/${selectedRule.id}`, newRule);
      setRules((prevRules) => prevRules.map((rule) => (rule.id === selectedRule.id ? response.data : rule)));
      setShowModal(false);
      setSelectedRule(null);
      alert('Norma actualizada exitosamente.');
    } catch (error) {
      alert('Error al actualizar la norma');
    }
  };  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewRule({ ...newRule, [name]: value });
  };

  const handleAddRule = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/rules`, {
        rule: newRule.rule || 'Norma',
        description: newRule.description || 'Descripción',
        categoryId: newRule.category, // Enviar el ID de la categoría
      });
  
      setRules((prevRules) => [...prevRules, response.data]); // Agrega la nueva norma
      setShowModal(false);
    } catch (error) {
      alert('Error al agregar norma');
    }
  };  

  const deleteRule = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/rules/${id}`);
      setRules((prevRules) => prevRules.filter((rule) => rule.id !== id));
      alert('Norma eliminada exitosamente.');
    } catch (error) {
      alert('Error al eliminar la norma');
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.name : 'Sin categoría';
  };  

  const handleDropdownClick = (e, rule) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    if (selectedRule?.id === rule.id) {
      setDropdownPosition(null);
      setSelectedRule(null);
    } else {
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
      setSelectedRule(rule);
    }
  };

  const closeDropdown = () => {
    setDropdownPosition(null);
    setSelectedRule(null);
  };
  const handleShowCategoryModal = () => {
    setNewCategory(''); // Limpia el campo
    setShowCategoryModal(true);
  };
  
  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
  };
  
  const handleAddCategory = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/rules/categories`, {
        category: newCategory.trim(),
      });
  
      if (response.data.success) {
        // Llama a la función fetchCategories para actualizar la lista completa
        await fetchCategories();
  
        alert('Categoría agregada exitosamente');
        setNewCategory(''); // Limpia el campo de entrada
        setShowCategoryModal(false); // Cierra el modal
      } else {
        alert(response.data.message || 'Error al agregar la categoría');
      }
    } catch (error) {
      alert('Error al agregar la categoría');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/rules/categories`);
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error al cargar las categorías:', error);
      setCategories([]); // Asegúrate de que el array no sea `undefined`
    }
  };  

    if (loading) return <div>Cargando normas...</div>;
    
  return (
    <div className="container mt-4">
      {error && <p>{error}</p>}
      <Table striped hover responsive className="modern-table">
  <thead>
    <tr>
      <th className="text-center category-column">Categoría</th>
      <th className="text-center">Norma</th>
      <th className="text-center description-column">Descripción</th>
      <th className="text-center actions-column">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {rules.map((rule) => (
      <tr key={rule.id}>
<td className="text-center category-column">
  {getCategoryName(rule.category)}
</td>
        <td className="text-center align-middle">{rule.rule || 'N/A'}</td>
        <td className="text-center">{rule.description || 'N/A'}</td>
        <td className="text-center align-middle actions-column">
          <div className="action-icon small-icon" onClick={(e) => handleDropdownClick(e, rule)}>⋮</div>
        </td>
      </tr>
    ))}
  </tbody>
</Table>

      {dropdownPosition && selectedRule && (
        <div
          className="dropdown-menu acciones show"
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 1060,
          }}
        >
<Dropdown.Item
  onClick={() => {
    closeDropdown();
    handleEditModal(selectedRule); // Llama a handleEditModal con los datos de la norma
  }}
>
  <PencilSquare className="me-2" /> Editar
</Dropdown.Item>
          <Dropdown.Item
            onClick={() => {
              closeDropdown();
              deleteRule(selectedRule.id);
            }}
          >
            <Trash className="me-2 text-danger" /> Eliminar
          </Dropdown.Item>
        </div>
      )}

<div className="d-flex justify-content-end gap-2 mt-2 mb-2">
<Button variant="primary" onClick={handleShowCategoryModal}>
  Agregar Categoría
</Button>
  <Button variant="success" onClick={handleShowModal}>
    Agregar Norma
  </Button>
</div>

      <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
        <Modal.Title>{isEditing ? 'Editar Norma' : 'Registrar Nueva Norma'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
          <Form.Group controlId="formRuleCategory" className="mb-3">
  <Form.Label>Categoría</Form.Label>
  <Form.Control
    as="select"
    name="category"
    value={newRule.category}
    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
  >
    <option value="">Seleccione una categoría</option>
    {categories.map((category) => (
      <option key={category.id} value={category.id}>
        {category.name}
      </option>
    ))}
  </Form.Control>
</Form.Group>

            <Form.Group controlId="formRuleRule" className="mb-3">
  <Form.Label>Norma</Form.Label>
  <Form.Control
    type="text"
    name="rule"
    value={newRule.rule} // Se asegura de que el valor venga de newRule.rule
    onChange={handleInputChange}
  />
</Form.Group>

            <Form.Group controlId="formRuleDescription" className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={newRule.description}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="dark" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="success" onClick={isEditing ? handleEditRule : handleAddRule}>
  {isEditing ? 'Actualizar Norma' : 'Registrar Norma'}
</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showCategoryModal} onHide={handleCloseCategoryModal} centered>
  <Modal.Header closeButton>
    <Modal.Title>Agregar Categoría</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group controlId="formCategoryName" className="mb-3">
        <Form.Label>Nombre de la Categoría</Form.Label>
        <Form.Control
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Ingrese el nombre de la categoría"
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="dark" onClick={handleCloseCategoryModal}>
      Cancelar
    </Button>
    <Button variant="success" onClick={handleAddCategory}>
      Guardar Categoría
    </Button>
  </Modal.Footer>
</Modal>
    </div>
  );
};

export default Rules;