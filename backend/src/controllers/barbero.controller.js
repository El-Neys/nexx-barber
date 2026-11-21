
import mongoose from 'mongoose';
import Barbero from '../models/barbero.model.js';

// CREAR BARBERO
export const crearBarbero = async (req, res, next) => {
  try {
    const barbero = await Barbero.create(req.body);

    res.status(201).json({
      mensaje: 'Barbero creado correctamente',
      barbero
    });
  } catch (error) {
    next(error);
  }
};

// CONSULTAR TODOS LOS BARBEROS
export const obtenerBarberos = async (req, res, next) => {
  try {
    const filtro = req.query.incluirInactivos === 'true'
      ? {}
      : { activo: true };

    const barberos = await Barbero.find(filtro)
      .populate('servicios', 'nombre precio duracionMinutos')
      .sort({ nombre: 1 });

    res.status(200).json(barberos);
  } catch (error) {
    next(error);
  }
};

// CONSULTAR UN BARBERO
export const obtenerBarbero = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de barbero no válido'
      });
    }

    const barbero = await Barbero.findById(req.params.id)
      .populate('servicios', 'nombre precio duracionMinutos');

    if (!barbero) {
      return res.status(404).json({
        mensaje: 'Barbero no encontrado'
      });
    }

    res.status(200).json(barbero);
  } catch (error) {
    next(error);
  }
};

// ACTUALIZAR BARBERO
export const actualizarBarbero = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de barbero no válido'
      });
    }

    const camposPermitidos = [
      'nombre',
      'servicios',
      'horario',
      'activo'
    ];

    const datos = {};

    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        datos[campo] = req.body[campo];
      }
    }

    const barbero = await Barbero.findByIdAndUpdate(
      req.params.id,
      datos,
      {
        new: true,
        runValidators: true
      }
    ).populate('servicios', 'nombre precio duracionMinutos');

    if (!barbero) {
      return res.status(404).json({
        mensaje: 'Barbero no encontrado'
      });
    }

    res.status(200).json({
      mensaje: 'Barbero actualizado correctamente',
      barbero
    });
  } catch (error) {
    next(error);
  }
};

// DESACTIVAR BARBERO
export const eliminarBarbero = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de barbero no válido'
      });
    }

    const barbero = await Barbero.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!barbero) {
      return res.status(404).json({
        mensaje: 'Barbero no encontrado'
      });
    }

    res.status(200).json({
      mensaje: 'Barbero desactivado correctamente',
      barbero
    });
  } catch (error) {
    next(error);
  }
};
