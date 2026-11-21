
import cors from 'cors';
import express from 'express';
import env from './config/env.js';

import servicioRoutes from './routes/servicio.routes.js';
import barberoRoutes from './routes/barbero.routes.js';
import reservaRoutes from './routes/reserva.routes.js';

const app = express();

// Orígenes autorizados: desarrollo y producción
const origenesPermitidos = [
  'http://localhost:4200',
  process.env.FRONTEND_URL
].filter(Boolean);

// Configuración CORS
app.use(cors({
  origin: origenesPermitidos
}));

// Middleware para recibir JSON
app.use(express.json());

// Rutas de la API
app.use('/api/barberos', barberoRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/servicios', servicioRoutes);

// Ruta de comprobación del servidor
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'nexx-barber-api',
    timezone: env.timezone,
    time: new Date().toISOString()
  });
});

// Rutas inexistentes
app.use((req, res) => {
  res.status(404).json({
    mensaje: 'Ruta no encontrada'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);

  res.status(500).json({
    mensaje: 'Error interno del servidor'
  });
});

export default app;
