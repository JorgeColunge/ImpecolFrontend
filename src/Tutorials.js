import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Card, Button, Row, Col, Modal, Form, InputGroup } from "react-bootstrap";
import { PlusCircle, PencilSquare, Trash, Search } from "react-bootstrap-icons";
import "./Tutorials.css"

const ALLOWED_ROLES = ["Administrador", "Superadministrador", "Supervisor Técnico", "SST"];
const userRole = JSON.parse(localStorage.getItem("user_info"))?.rol ?? "";
const CAN_MANAGE = ALLOWED_ROLES.includes(userRole);

const YT_THUMB = (url) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : "";
};

export default function Tutorials() {
    const [tutorials, setTutorials] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* vídeo */
    const [showVideo, setShowVideo] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");

    /* crear / editar */
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: "", youtube_url: "", description: "" });

    /* acciones desplegables */
    const [expandedCardId, setExpandedCardId] = useState(null);
    const dropdownRef = useRef(null);

    /* ───────── cargar ───────── */
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/tutorials`);
                setTutorials(data.tutorials || []);
            } catch (e) { console.error(e); setError("No se pudieron cargar los tutoriales"); }
            finally { setLoading(false); }
        })();
    }, []);

    /* ───────── click-fuera para colapsar ───────── */
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setExpandedCardId(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    /* ───────── helpers ───────── */
    const openVideo = (url) => { setVideoUrl(url); setShowVideo(true); };
    const toggleActions = id => setExpandedCardId(p => (p === id ? null : id));

    const handleInput = ({ target: { name, value } }) => setFormData(p => ({ ...p, [name]: value }));

    /* guardar (POST / PUT) */
    const saveTutorial = async () => {
        try {
            if (isEditing) {
                const { data } = await axios.put(`${process.env.REACT_APP_API_URL}/api/tutorials/${editingId}`, formData);
                setTutorials(p => p.map(t => t.id === editingId ? data.tutorial : t));
            } else {
                const { data } = await axios.post(`${process.env.REACT_APP_API_URL}/api/tutorials`, formData);
                setTutorials(p => [data.tutorial, ...p]);
            }
            closeForm();
        } catch (e) { console.error(e); alert("Error al guardar tutorial"); }
    };

    const deleteTutorial = async (id) => {
        if (!window.confirm("¿Eliminar tutorial?")) return;
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/api/tutorials/${id}`);
            setTutorials(p => p.filter(t => t.id !== id));
        } catch (e) { console.error(e); alert("Error al eliminar"); }
    };

    const openEdit = (t) => {
        setIsEditing(true);
        setEditingId(t.id);
        setFormData({ title: t.title, youtube_url: t.youtube_url, description: t.description });
        setShowForm(true);
    };
    const openCreate = () => { setIsEditing(false); setEditingId(null); setFormData({ title: "", youtube_url: "", description: "" }); setShowForm(true); };
    const closeForm = () => { setShowForm(false); setIsEditing(false); setEditingId(null); };

    /* ───────── UI ───────── */
    if (loading) return <p>Cargando tutoriales…</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="container mt-4">
            <Row className="align-items-center mb-4" style={{ minHeight: 0, height: 'auto' }}>
                {/* ---------- Buscador ---------- */}
                <Col xs={12} md={9}>
                    <InputGroup className="mb-3 mb-md-0">
                        <InputGroup.Text><Search /></InputGroup.Text>
                        <Form.Control
                            placeholder="Buscar por título o descripción…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </InputGroup>
                </Col>

                {/* ---------- Botón Crear ---------- */}
                {ALLOWED_ROLES.includes(userRole) && (
                    <Col xs={12} md={3} className="text-md-end pb-2">
                        <div className="d-flex justify-content-start justify-content-md-end">
                            <Button
                                variant="success"
                                onClick={openCreate}
                                className="w-100 w-md-auto"
                            >
                                <PlusCircle className="me-2" /> Crear
                            </Button>
                        </div>
                    </Col>
                )}
            </Row>
            <Row xs={1} sm={2} md={3} lg={4} className="g-4" style={{ minHeight: 0, height: 'auto' }}>
                {tutorials
                    .filter(t => {
                        if (!search.trim()) return true;                   // sin filtro
                        const q = search.toLowerCase();
                        return t.title.toLowerCase().includes(q) ||
                            (t.description ?? "").toLowerCase().includes(q);
                    })
                    .map(t => (
                        <Col key={t.id}>
                            <Card className="h-100 shadow-sm">
                                <Card.Img variant="top" src={YT_THUMB(t.youtube_url)} style={{ cursor: "pointer" }} onClick={() => openVideo(t.youtube_url)} />
                                <Card.Body style={{ cursor: "pointer" }} onClick={() => openVideo(t.youtube_url)}>
                                    <Card.Title>{t.title}</Card.Title>
                                    <Card.Text className="text-muted" style={{ fontSize: "0.9rem" }}>{t.description}</Card.Text>
                                </Card.Body>
                                {/* ---------- Footer acciones ---------- */}
                                {CAN_MANAGE && (
                                    <Card.Footer
                                        className="text-center position-relative"
                                        style={{ background: "#f9f9f9", cursor: "pointer" }}
                                        onClick={(e) => { e.stopPropagation(); toggleActions(t.id); }}
                                        ref={expandedCardId === t.id ? dropdownRef : null}
                                    >
                                        <small className="text-success">
                                            {expandedCardId === t.id ? "Cerrar Acciones" : "Acciones"}
                                        </small>

                                        {expandedCardId === t.id && (
                                            <div className="menu-actions expand">
                                                <button className="btn d-block" onClick={(e) => { e.stopPropagation(); openEdit(t); }}>
                                                    <PencilSquare size={18} className="me-2" /> Editar
                                                </button>
                                                <button className="btn d-block" onClick={(e) => { e.stopPropagation(); deleteTutorial(t.id); }}>
                                                    <Trash size={18} className="me-2" /> Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </Card.Footer>
                                )}
                            </Card>
                        </Col>
                    ))}
            </Row>

            <Modal
                show={showVideo}
                onHide={() => setShowVideo(false)}
                size="xl"
                centered
                dialogClassName="custom-video-modal"
                contentClassName="border-0 bg-transparent"
                backdropClassName="custom-video-backdrop"
            >
                <Modal.Body className="p-0 d-flex justify-content-center align-items-center">
                    <div className="w-100" style={{ maxWidth: '900px' }}>
                        <div className="ratio ratio-16x9">
                            {showVideo && (
                                <iframe
                                    src={videoUrl.replace("watch?v=", "embed/")}
                                    title="YouTube video"
                                    allowFullScreen
                                    className="w-100"
                                    style={{ border: "none" }}
                                />
                            )}
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {/* ---------- modal crear/editar ---------- */}
            <Modal show={showForm} onHide={closeForm} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? "Editar Tutorial" : "Nuevo Tutorial"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Link de YouTube</Form.Label>
                            <Form.Control name="youtube_url" value={formData.youtube_url} onChange={handleInput} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Título</Form.Label>
                            <Form.Control name="title" value={formData.title} onChange={handleInput} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleInput} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="dark" onClick={closeForm}>Cancelar</Button>
                    <Button variant="success" onClick={saveTutorial}>{isEditing ? "Actualizar" : "Guardar"}</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
