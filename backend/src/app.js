
import cors from 'cors';
import express from 'express';
import env from './config/env.js';
import servicioRoutes from './routes/servicio.routes.js';
import barberoRoutes from './routes/barbero.routes.js';
import reservaRoutes from './routes/reserva.routes.js';

const app = express();
// Permitir solicitudes desde Angular
app.use(cors({
  origin: 'http://localhost:4200'
}));

// Middleware para recibir JSON
app.use(express.json());
app.use('/api/barberos', barberoRoutes);
app.use('/api/reservas', reservaRoutes);

// Ruta de comprobación
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'nexx-barber-api',
    timezone: env.timezone,
    time: new Date().toISOString()
  });
});

// Rutas del módulo de servicios
app.use('/api/servicios', servicioRoutes);

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
