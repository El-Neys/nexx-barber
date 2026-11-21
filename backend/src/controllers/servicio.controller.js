import mongoose from 'mongoose';
import Servicio from '../models/servicio.model.js';

export const obtenerServicios = async (req, res, next) => {
  try {
    const servicios = await Servicio.find().sort({ nombre: 1 });
    res.json(servicios);
  } catch (error) {
    next(error);
  }
};

export const obtenerServicioPorId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID no válido' });
    }

    const servicio = await Servicio.findById(id);

    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    next(error);
  }
};

export const crearServicio = async (req, res, next) => {
  try {
    const servicio = await Servicio.create(req.body);
    res.status(201).json(servicio);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: error.message });
    }
    next(error);
  }
};

export const actualizarServicio = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID no válido' });
    }

    const servicio = await Servicio.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ mensaje: error.message });
    }
    next(error);
  }
};

export const eliminarServicio = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ mensaje: 'ID no válido' });
    }

    const servicio = await Servicio.findByIdAndDelete(id);

    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }

    res.json({ mensaje: 'Servicio eliminado' });
  } catch (error) {
    next(error);
  }
};