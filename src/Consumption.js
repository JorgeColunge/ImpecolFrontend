import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { Bar } from 'react-chartjs-2';
import {
    Card,
    Button,
    Form,
    Row,
    Col,
    Container,
} from 'react-bootstrap';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Consumption = () => {
    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    const [consumptions, setConsumptions] = useState([]);
    const [totalSpent, setTotalSpent] = useState(0);
    const [currency, setCurrency] = useState('USD');
    const [exchangeRate, setExchangeRate] = useState(1);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const maxMonth = new Date().getMonth() + 1;
    const maxYear = new Date().getFullYear();

    const modelColors = {
        'gpt-3.5-turbo': 'rgba(75, 192, 192, 0.6)',
        'gpt-4': 'rgba(153, 102, 255, 0.6)',
        'gpt-4-32k': 'rgba(255, 99, 132, 0.6)',
        'gpt-4-turbo': 'rgba(225, 197, 10, 0.6)',
        'gpt-4o': 'rgba(17, 165, 228, 0.6)',
        'gpt-4o-mini': 'rgba(10, 222, 3, 0.6)',
    };

    useEffect(() => {
        console.log('[MONEDA CAMBIADA]', currency);
        if (currency === 'USD') {
            setExchangeRate(1);
        } else {
            fetchExchangeRateFromPublicAPI(currency);
        }
    }, [currency]);

    useEffect(() => {
        console.log('[FECHA CAMBIADA]', { currentMonth, currentYear });
        if (currency === 'USD') {
            console.log('[DISPARANDO fetchConsumptions] - USD directo');
            fetchConsumptions();
        } else {
            console.log('[SOLICITANDO NUEVA TASA DE CAMBIO]');
            fetchExchangeRateFromPublicAPI(currency);
        }
    }, [currentMonth, currentYear]);

    useEffect(() => {
        if (exchangeRate > 0) {
            console.log('[TASA DE CAMBIO LISTA]', exchangeRate);
            fetchConsumptions();
        } else {
            console.log('[TASA DE CAMBIO NO VÁLIDA]', exchangeRate);
        }
    }, [exchangeRate]);

    const fetchExchangeRateFromPublicAPI = async (currencyCode) => {
        try {
            console.log('[OBTENIENDO TASA DE CAMBIO] para', currencyCode);
            const response = await axios.get('https://open.er-api.com/v6/latest/USD');
            console.log('[RESPUESTA API CAMBIO]', response.data);

            if (response.data && response.data.result === 'success') {
                const rate = response.data.rates[currencyCode];
                if (rate) {
                    console.log(`[TASA OBTENIDA] 1 USD = ${rate} ${currencyCode}`);
                    setExchangeRate(rate);
                } else {
                    console.warn('[TASA NO ENCONTRADA EN RESPUESTA]');
                    setExchangeRate(1);
                }
            } else {
                console.error('[ERROR EN API]', response.data);
                setExchangeRate(1);
            }
        } catch (error) {
            console.error('[ERROR AL OBTENER TASA DE CAMBIO]', error);
            setExchangeRate(1);
        }
    };

    const fetchConsumptions = async () => {
        console.log('[LLAMADA A fetchConsumptions] usando tasa', exchangeRate);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/consumptions`, {
                params: { month: currentMonth, year: currentYear },
            });

            const data = Array.isArray(response.data) ? response.data : [];
            console.log('[DATOS RECIBIDOS]', data);

            if (data.length === 0) {
                console.warn('[NO HAY DATOS]');
                setChartData({ labels: [], datasets: [] });
                setConsumptions([]);
                setTotalSpent(0);
            } else {
                console.log('[GENERANDO CHART Y TOTAL]');
                generateChartData(data);
                setConsumptions(data);
                calculateTotalSpent(data);
            }
        } catch (error) {
            console.error('[ERROR AL CONSULTAR CONSUMOS]', error);
        }
    };

    const adjustPrecision = (value) => {
        if (value >= 0.1) return value.toFixed(2);
        if (value >= 0.01) return value.toFixed(3);
        return value.toFixed(6);
    };

    const calculateTotalSpent = (data) => {
        const total = data.reduce((acc, item) => acc + parseFloat(item.total_sales_value), 0);
        setTotalSpent(adjustPrecision(total * exchangeRate));
    };

    const generateChartData = (data) => {
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const consumptionPerDay = {};
        const models = new Set();

        for (let day = 1; day <= daysInMonth; day++) {
            consumptionPerDay[day] = {};
        }

        data.forEach((item) => {
            const day = moment.utc(item.query_day).local().date();
            const model = item.model;
            models.add(model);
            if (!consumptionPerDay[day][model]) consumptionPerDay[day][model] = 0;
            consumptionPerDay[day][model] += parseFloat(item.total_sales_value) * exchangeRate;
        });

        const datasets = Array.from(models).map((model) => {
            const dailyData = Array.from({ length: daysInMonth }, (_, i) => consumptionPerDay[i + 1][model] || 0);
            return {
                label: `Consumo ${model}`,
                data: dailyData,
                backgroundColor: modelColors[model] || 'rgb(85, 230, 56)',
                borderColor: modelColors[model] || 'rgb(85, 230, 56)',
                borderWidth: 1,
            };
        });

        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        setChartData({ labels: days, datasets });
    };

    const handlePreviousMonth = () => {
        if (currentMonth === 1) {
            setCurrentMonth(12);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === maxMonth && currentYear === maxYear) return;
        if (currentMonth === 12) {
            setCurrentMonth(1);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
    };

    const currencySymbol = currency === 'COP' ? '$' : 'USD $';

    return (
        <Container fluid className="px-2 py-0">
            <Card className="p-4 shadow">
                <Row className="mb-3" style={{ minHeight: 0, height: 'auto' }}>
                    <Col md={6}>
                        <h4>Consumo de - {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                    </Col>
                    <Col md={6} className="text-end">
                        <h5>Total Gastado:</h5>
                        <h3>{currencySymbol} {totalSpent}</h3>
                    </Col>
                </Row>
                <Row className="mb-4" style={{ minHeight: 0, height: 'auto' }}>
                    <Col md={4}>
                        <Button variant="outline-success" className="w-100" onClick={handlePreviousMonth}>Mes Anterior</Button>
                    </Col>
                    <Col md={4}>
                        <Button variant="outline-success" className="w-100" onClick={handleNextMonth}>Mes Siguiente</Button>
                    </Col>
                    <Col md={4}>
                        <Form.Select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-100"
                        >
                            <option value="USD">Dólares</option>
                            <option value="COP">Pesos Colombianos</option>
                        </Form.Select>
                    </Col>
                </Row>
                <Row style={{ minHeight: 0, height: 'auto' }}>
                    <Col md={8}>
                        {chartData.datasets.length > 0 ? (
                            <div style={{ height: '400px' }}>
                                <Bar
                                    data={chartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: { beginAtZero: true, stacked: true },
                                            x: { stacked: true }
                                        },
                                        plugins: {
                                            legend: { display: true },
                                            title: {
                                                display: true,
                                                text: `Consumo en ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })}`
                                            }
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <p>No hay datos disponibles para este mes.</p>
                        )}
                    </Col>
                    <Col md={4}>
                        {consumptions.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                <h5 className="mb-3">Lista de Registros</h5>
                                <ul className="list-group">
                                    {consumptions.map((c, idx) => (
                                        <li key={idx} className="list-group-item d-flex justify-content-between">
                                            <span>{moment.utc(c.query_day).local().format('YYYY-MM-DD')}</span>
                                            <span>{c.model}</span>
                                            <span>{currencySymbol} {adjustPrecision(c.total_sales_value * exchangeRate)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p>No se encontraron registros para este mes.</p>
                        )}
                    </Col>
                </Row>
            </Card>
        </Container>
    );
};

export default Consumption;
