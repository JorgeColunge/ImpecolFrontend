import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Login.css'; // Opcional: para agregar estilos personalizados

function Register() {
  const [document_type, setTypeDoc] = useState('');
  const [document_number, setId] = useState('');
  const [name, setName] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState([]);
  const [department, setDepartment] = useState('Nariño');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('Pasto');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/clients`, { document_number, document_type, name, email, phone, address, department, city, password, category});
      if (response.data.success) {
        setMessage("Usuario registrado exitosamente");
      } else {
        setMessage(response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Error desconocido";
      setMessage(`Error al registrar usuario: ${errorMessage}`);
    }    
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/rules/categories`); // Ruta para categorías
      setCategories(categoriesResponse.data); // Guardar las categorías en el estado        
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="row w-100"  style={{marginTop:'50px', marginBottom:'200px'}}>
        <div className="col-md-6 bg-light p-5 rounded-start shadow-lg">
          <div className="text-center mb-4">
            <img src="/images/Logo FumiPlagax.png" alt="Logo" width="150" /> {/* Ajusta el tamaño si es necesario */}
          </div>
          <form onSubmit={handleSubmit}>
          <div className="mb-3">
              <select
                className="form-control"
                value={document_type}
                onChange={(e) => setTypeDoc(e.target.value)} // Actualiza el estado con la selección
                required
              >
                <option value="" disabled>Selecciona el tipo de documento</option>
                <option value="NIT">NIT</option>
                <option value="Cedula">Cédula</option>
              </select>
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Número de documento"
                value={document_number}
                onChange={(e) => setId(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Nombres"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)} // Actualiza el estado con la selección
                required
              >
                <option value="">Seleccione una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Dirección"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <select
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)} // Actualiza el estado con la selección
                required
              >
                {[
                  "Amazonas",
                  "Antioquia",
                  "Arauca",
                  "Atlántico",
                  "Bolívar",
                  "Boyacá",
                  "Caldas",
                  "Caquetá",
                  "Casanare",
                  "Cauca",
                  "Cesar",
                  "Chocó",
                  "Córdoba",
                  "Cundinamarca",
                  "Guainía",
                  "Guaviare",
                  "Huila",
                  "La Guajira",
                  "Magdalena",
                  "Meta",
                  "Nariño",
                  "Norte de Santander",
                  "Putumayo",
                  "Quindío",
                  "Risaralda",
                  "San Andrés y Providencia",
                  "Santander",
                  "Sucre",
                  "Tolima",
                  "Valle del Cauca",
                  "Vaupés",
                  "Vichada",
                ].map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-success w-100 mb-3">Registrarse</button>
            {message && <p className="text-success text-center">{message}</p>}
          </form>
          <div className="text-center">
            <p className="mt-3">
              ¿Ya tienes una cuenta? <a href="/login" className="text-decoration-none text-success">Iniciar sesión aquí</a>
            </p>
          </div>
        </div>
        <div
          className="col-md-6 rounded-end"
          style={{
            backgroundImage: `url("/Fondo 1.jpg")`,
            backgroundSize: '230%',
            backgroundPosition: 'center',
          }}
        ></div>
      </div>
    </div>
  );
}

export default Register;