import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Dropdown } from 'react-bootstrap';
import { PencilSquare, Trash, Gear } from 'react-bootstrap-icons';

const Actions = () => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dropdownPosition, setDropdownPosition] = useState(null);
    const [selectedAction, setSelectedAction] = useState(null);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [newAction, setNewAction] = useState({
        configuration_id: '',
        action_name: '',
        entity_type: '',
        action_type: '',
        code: {}
    });
    const [codeFields, setCodeFields] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchActions = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/actions`);
                setActions(response.data.actions || []);
            } catch (error) {
                console.error('Error al cargar las acciones:', error);
                setError('Error al cargar las acciones');
            } finally {
                setLoading(false);
            }
        };

        fetchActions();
    }, []);

    const handleDropdownClick = (e, action) => {
        e.stopPropagation();
        const rect = e.target.getBoundingClientRect();
        if (selectedAction?.id === action.id) {
            setDropdownPosition(null);
            setSelectedAction(null);
        } else {
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
            });
            setSelectedAction(action);
        }
    };

    const closeDropdown = () => {
        setDropdownPosition(null);
        setSelectedAction(null);
    };

    const handleDeleteAction = async () => {
        if (!selectedAction) return;

        const confirmDelete = window.confirm('¿Estás seguro de que deseas eliminar esta acción?');

        if (!confirmDelete) return;

        try {
            const response = await axios.delete(`${process.env.REACT_APP_API_URL}/api/actions/${selectedAction.id}`);

            if (response.data.success) {
                setActions((prev) => prev.filter((action) => action.id !== selectedAction.id));
            }
        } catch (error) {
            console.error('Error al eliminar la acción:', error);
            alert('Ocurrió un error al eliminar la acción.');
        } finally {
            closeDropdown();
        }
    };

    const handleViewConfiguration = () => {
        alert('Función para ver configuración');
    };

    const handleCreateAction = () => {
        setNewAction({ configuration_id: '', action_name: '', entity_type: '', action_type: '', code: {} });
        setCodeFields({});
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewAction(prev => ({ ...prev, [name]: value }));
    };

    const handleCodeChange = (e) => {
        const { name, value } = e.target;
        setCodeFields(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveAction = async () => {
        try {
            const payload = { ...newAction, code: codeFields };
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/actions`, payload);
            if (response.data.success) {
                setActions(prev => [...prev, response.data.action]);
                setShowModal(false);
            }
        } catch (error) {
            console.error('Error al guardar la acción:', error);
            alert('Error al guardar la acción');
        }
    };

    if (loading) return <div>Cargando acciones...</div>;

    return (
        <div className="container mt-4">
            {error && <p>{error}</p>}
            <Table striped hover responsive className="modern-table">
                <thead>
                    <tr>
                        <th className="text-center">ID</th>
                        <th className="text-center">Nombre</th>
                        <th className="text-center">Tipo de Entidad</th>
                        <th className="text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {actions.map((action) => (
                        <tr key={action.id}>
                            <td className="text-center">{action.id}</td>
                            <td className="text-center">{action.action_name}</td>
                            <td className="text-center">{action.entity_type}</td>
                            <td className="text-center">
                                <div className="action-icon small-icon" onClick={(e) => handleDropdownClick(e, action)}>⋮</div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {dropdownPosition && selectedAction && (
                <div
                    className="dropdown-menu acciones show"
                    style={{
                        position: 'absolute',
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        zIndex: 1060,
                    }}
                >
                    <Dropdown.Item onClick={() => { closeDropdown(); handleDeleteAction(); }}>
                        <Trash className="me-2 text-danger" /> Eliminar
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => { closeDropdown(); handleViewConfiguration(); }}>
                        <Gear className="me-2" /> Ver Configuración
                    </Dropdown.Item>
                </div>
            )}

            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button variant="outline-success" onClick={() => navigate('/document-automation')}>
                    Crear Configuración
                </Button>
                <Button variant="dark" onClick={() => navigate('/upload-document')}>
                    Cargar Plantilla
                </Button>
                <Button variant="success" onClick={handleCreateAction}>Crear Acción</Button>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Crear Nueva Acción</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de Acción</Form.Label>
                            <Form.Select name="configuration_id" value={newAction.configuration_id} onChange={handleChange}>
                                <option value="">Seleccione una opción</option>
                                <option value="0">Convertir a PDF</option>
                                <option value="-1">Enviar a WhatsApp</option>
                                <option value="-2">Enviar a Correo</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Acción</Form.Label>
                            <Form.Control name="action_name" value={newAction.action_name} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de Entidad</Form.Label>
                            <Form.Select name="entity_type" value={newAction.entity_type} onChange={handleChange}>
                                <option value="">Seleccione una opción</option>
                                <option value="inspections">Inspección</option>
                                <option value="services">Servicio</option>
                                <option value="clients">Cliente</option>
                                <option value="users">Usuarios</option>
                            </Form.Select>
                        </Form.Group>
                        {newAction.configuration_id === '-1' && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Método de Envío</Form.Label>
                                    <Form.Select name="method" onChange={handleCodeChange}>
                                        <option value="">Seleccione</option>
                                        <option value="link">Link</option>
                                        <option value="api">API</option>
                                    </Form.Select>
                                </Form.Group>
                                {codeFields.method === 'link' && (
                                    <>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Número Remitente</Form.Label>
                                            <Form.Control name="number" onChange={handleCodeChange} />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mensaje</Form.Label>
                                            <Form.Control name="message" as="textarea" rows={2} onChange={handleCodeChange} />
                                        </Form.Group>
                                    </>
                                )}
                                {codeFields.method === 'api' && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Playground (puede usar la etiqueta {`{document_url}`})</Form.Label>
                                        <Form.Control name="playground" as="textarea" rows={3} onChange={handleCodeChange} />
                                    </Form.Group>
                                )}
                            </>
                        )}
                        {newAction.configuration_id === '-2' && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Correo</Form.Label>
                                    <Form.Control name="email" onChange={handleCodeChange} />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contraseña de Aplicación Gmail</Form.Label>
                                    <Form.Control name="app_password" type="password" onChange={handleCodeChange} />
                                </Form.Group>
                            </>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="dark" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="success" onClick={handleSaveAction}>Guardar Acción</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Actions;