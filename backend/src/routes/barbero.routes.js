
import express from 'express';

import {
  crearBarbero,
  obtenerBarberos,
  obtenerBarbero,
  actualizarBarbero,
  eliminarBarbero
} from '../controllers/barbero.controller.js';

const router = express.Router();

// Registrar barbero
router.post('/', crearBarbero);

// Consultar todos los barberos
router.get('/', obtenerBarberos);

// Consultar un barbero por ID
router.get('/:id', obtenerBarbero);

// Actualizar barbero
router.put('/:id', actualizarBarbero);

// Desactivar barbero
router.delete('/:id', eliminarBarbero);

export default router;
