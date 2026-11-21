
import express from 'express';

import {
  crearReserva,
  obtenerDisponibilidad,
  obtenerReservas,
  obtenerReserva,
  actualizarReserva,
  cancelarReserva
} from '../controllers/reserva.controller.js';

const router = express.Router();

// Consultar disponibilidad
router.get('/disponibilidad', obtenerDisponibilidad);

// Registrar reserva
router.post('/', crearReserva);

// Consultar todas las reservas
router.get('/', obtenerReservas);

// Consultar una reserva por ID
router.get('/:id', obtenerReserva);

// Actualizar reserva
router.put('/:id', actualizarReserva);

// Cancelar reserva
router.delete('/:id', cancelarReserva);

export default router;
