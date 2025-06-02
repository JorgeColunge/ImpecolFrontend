import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table, Button, Modal, Form, Dropdown } from "react-bootstrap";
import { Trash, Gear } from "react-bootstrap-icons";

const Actions = () => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dropdownPosition, setDropdownPosition] = useState(null);
    const [selectedAction, setSelectedAction] = useState(null);
    const [error, setError] = useState(null);

    /* --- Modal / formulario --- */
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);           // NUEVO
    const [editingId, setEditingId] = useState(null);            // NUEVO
    const [newAction, setNewAction] = useState({
        configuration_id: "",
        action_name: "",
        entity_type: "",
        action_type: "",
        code: {},
    });
    const [codeFields, setCodeFields] = useState({});

    const navigate = useNavigate();

    /* ============================ */
    /*        Cargar acciones       */
    /* ============================ */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(
                    `${process.env.REACT_APP_API_URL}/api/actions`
                );
                setActions(data.actions || []);
            } catch (err) {
                console.error(err);
                setError("Error al cargar las acciones");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ============================ */
    /*       Dropdown acciones      */
    /* ============================ */
    const handleDropdownClick = (e, action) => {
        e.stopPropagation();
        const rect = e.target.getBoundingClientRect();
        if (selectedAction?.id === action.id) {
            closeDropdown();
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

    /* ============================ */
    /*  Eliminar acción (ya existe) */
    /* ============================ */
    const handleDeleteAction = async () => {
        if (!selectedAction) return;
        if (!window.confirm("¿Eliminar esta acción?")) return;

        try {
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/actions/${selectedAction.id}`
            );
            setActions((prev) => prev.filter((a) => a.id !== selectedAction.id));
        } catch (err) {
            console.error(err);
            alert("Ocurrió un error al eliminar la acción.");
        } finally {
            closeDropdown();
        }
    };

    /* ============================ */
    /*  Ver configuración / Editar  */
    /* ============================ */
    const handleViewConfiguration = () => {
        const { configuration_id } = selectedAction;

        /* Si es una configuración existente (>0) → redirigimos */
        if (Number(configuration_id) > 0) {
            navigate(`/document-automation?configId=${configuration_id}`);
            return;
        }

        /* Si configuration_id <= 0 → abrimos modal para editar   */
        setIsEditing(true);
        setEditingId(selectedAction.id);

        // Precargar campos de la acción seleccionada
        setNewAction({
            configuration_id: String(configuration_id),
            action_name: selectedAction.action_name,
            entity_type: selectedAction.entity_type,
            action_type: selectedAction.action_type ?? "",
            code: selectedAction.code ?? {},
        });
        setCodeFields(selectedAction.code ?? {});
        setShowModal(true);
    };

    /* ============================ */
    /*        Crear nueva acción    */
    /* ============================ */
    const handleCreateAction = () => {
        setIsEditing(false);
        setEditingId(null);
        setNewAction({
            configuration_id: "",
            action_name: "",
            entity_type: "",
            action_type: "",
            code: {},
        });
        setCodeFields({});
        setShowModal(true);
    };

    /* ======== Handlers de forms ======== */
    const handleChange = ({ target: { name, value } }) =>
        setNewAction((prev) => ({ ...prev, [name]: value }));

    const handleCodeChange = ({ target: { name, value } }) =>
        setCodeFields((prev) => ({ ...prev, [name]: value }));

    /* ========= Guardar (POST / PUT) ======== */
    const handleSaveAction = async () => {
        const payload = { ...newAction, code: codeFields };

        try {
            if (isEditing) {
                /* PUT /api/actions/:id */
                const { data } = await axios.put(
                    `${process.env.REACT_APP_API_URL}/api/actions/${editingId}`,
                    payload
                );
                setActions((prev) =>
                    prev.map((a) => (a.id === editingId ? data.action : a))
                );
            } else {
                /* POST /api/actions */
                const { data } = await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/actions`,
                    payload
                );
                setActions((prev) => [...prev, data.action]);
            }
            setShowModal(false);
        } catch (err) {
            console.error(err);
            alert("Error al guardar la acción.");
        }
    };

    /* ========= JSX ========= */
    if (loading) return <div>Cargando acciones…</div>;

    return (
        <div className="container mt-4">
            {error && <p>{error}</p>}

            {/* ======= Tabla ======= */}
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
                                <div
                                    className="action-icon small-icon"
                                    onClick={(e) => handleDropdownClick(e, action)}
                                >
                                    ⋮
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* ======= Dropdown ======= */}
            {dropdownPosition && selectedAction && (
                <div
                    className="dropdown-menu acciones show"
                    style={{
                        position: "absolute",
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        zIndex: 1060,
                    }}
                >
                    <Dropdown.Item
                        onClick={() => {
                            closeDropdown();
                            handleDeleteAction();
                        }}
                    >
                        <Trash className="me-2 text-danger" /> Eliminar
                    </Dropdown.Item>
                    <Dropdown.Item
                        onClick={() => {
                            closeDropdown();
                            handleViewConfiguration();
                        }}
                    >
                        <Gear className="me-2" /> Ver Configuración
                    </Dropdown.Item>
                </div>
            )}

            {/* ======= Botones ======= */}
            <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                    variant="outline-success"
                    onClick={() => navigate("/document-automation")}
                >
                    Crear Configuración
                </Button>
                <Button variant="dark" onClick={() => navigate("/upload-document")}>
                    Cargar Plantilla
                </Button>
                <Button variant="success" onClick={handleCreateAction}>
                    Crear Acción
                </Button>
            </div>

            {/* ======= Modal Crear / Editar ======= */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {isEditing ? "Editar Acción" : "Crear Nueva Acción"}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        {/* ---------- Tipo de Acción ---------- */}
                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de Acción</Form.Label>
                            <Form.Select
                                name="configuration_id"
                                value={newAction.configuration_id}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione una opción</option>
                                <option value="0">Convertir a PDF</option>
                                <option value="-1">Enviar a WhatsApp</option>
                                <option value="-2">Enviar a Correo</option>
                            </Form.Select>
                        </Form.Group>

                        {/* ---------- Nombre ---------- */}
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre de la Acción</Form.Label>
                            <Form.Control
                                name="action_name"
                                value={newAction.action_name}
                                onChange={handleChange}
                            />
                        </Form.Group>

                        {/* ---------- Entidad ---------- */}
                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de Entidad</Form.Label>
                            <Form.Select
                                name="entity_type"
                                value={newAction.entity_type}
                                onChange={handleChange}
                            >
                                <option value="">Seleccione una opción</option>
                                <option value="inspections">Inspección</option>
                                <option value="services">Servicio</option>
                                <option value="clients">Cliente</option>
                                <option value="users">Usuarios</option>
                            </Form.Select>
                        </Form.Group>

                        {/* ---------- Campos dinámicos ---------- */}
                        {newAction.configuration_id === "-1" && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Método de Envío</Form.Label>
                                    <Form.Select
                                        name="method"
                                        value={codeFields.method || ""}
                                        onChange={handleCodeChange}
                                    >
                                        <option value="">Seleccione</option>
                                        <option value="link">Link</option>
                                        <option value="api">API</option>
                                    </Form.Select>
                                </Form.Group>

                                {codeFields.method === "link" && (
                                    <>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Número Remitente</Form.Label>
                                            <Form.Control
                                                name="number"
                                                value={codeFields.number || ""}
                                                onChange={handleCodeChange}
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mensaje</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                name="message"
                                                value={codeFields.message || ""}
                                                onChange={handleCodeChange}
                                            />
                                        </Form.Group>
                                    </>
                                )}

                                {codeFields.method === "api" && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>
                                            Playground (puede usar{" "}
                                            <code>{"{document_url}"}</code>)
                                        </Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="playground"
                                            value={codeFields.playground || ""}
                                            onChange={handleCodeChange}
                                        />
                                    </Form.Group>
                                )}
                            </>
                        )}

                        {newAction.configuration_id === "-2" && (
                            <>
                                <Form.Group className="mb-3">
                                    <Form.Label>Correo</Form.Label>
                                    <Form.Control
                                        name="email"
                                        value={codeFields.email || ""}
                                        onChange={handleCodeChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Contraseña de Aplicación Gmail</Form.Label>
                                    <Form.Control
                                        type="password"
                                        name="app_password"
                                        value={codeFields.app_password || ""}
                                        onChange={handleCodeChange}
                                    />
                                </Form.Group>
                            </>
                        )}
                    </Form>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="dark" onClick={() => setShowModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={handleSaveAction}>
                        {isEditing ? "Actualizar" : "Guardar Acción"}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Actions;
