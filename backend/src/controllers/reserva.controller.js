
import mongoose from 'mongoose';
import Reserva from '../models/reserva.model.js';
import Barbero from '../models/barbero.model.js';
import Servicio from '../models/servicio.model.js';
import env from '../config/env.js';

const ZONA_HORARIA = env.timezone || 'America/Bogota';

// Obtener el día de la semana en la zona horaria configurada
const obtenerDiaSemana = (fecha) => {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    timeZone: ZONA_HORARIA
  })
    .format(fecha)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

// Obtener hora en formato HH:mm
const obtenerHora = (fecha) => {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA_HORARIA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(fecha);

  const hora = partes.find(p => p.type === 'hour').value;
  const minuto = partes.find(p => p.type === 'minute').value;

  return `${hora}:${minuto}`;
};

// Convertir minutos a HH:mm
const minutosAHora = (minutos) => {
  const hora = Math.floor(minutos / 60);
  const minuto = minutos % 60;

  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
};

// Obtener fecha YYYY-MM-DD en la zona horaria configurada
const obtenerFechaLocal = (fecha) => {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(fecha);

  const anio = partes.find(p => p.type === 'year').value;
  const mes = partes.find(p => p.type === 'month').value;
  const dia = partes.find(p => p.type === 'day').value;

  return `${anio}-${mes}-${dia}`;
};

// CREAR RESERVA
export const crearReserva = async (req, res, next) => {
  try {
    const {
      cliente,
      barbero: barberoId,
      servicio: servicioId,
      fechaHoraInicio
    } = req.body;

    // 1. Validar datos obligatorios
    if (
      !cliente?.nombre?.trim() ||
      !cliente?.telefono?.trim() ||
      !barberoId ||
      !servicioId ||
      !fechaHoraInicio
    ) {
      return res.status(400).json({
        mensaje: 'Todos los datos de la reserva son obligatorios'
      });
    }

    // 2. Validar identificadores
    if (
      !mongoose.isValidObjectId(barberoId) ||
      !mongoose.isValidObjectId(servicioId)
    ) {
      return res.status(400).json({
        mensaje: 'El ID del barbero o del servicio no es válido'
      });
    }

    // 3. Consultar barbero y servicio
    const barbero = await Barbero.findById(barberoId);
    const servicio = await Servicio.findById(servicioId);

    if (!barbero || !barbero.activo) {
      return res.status(404).json({
        mensaje: 'Barbero no encontrado o inactivo'
      });
    }

    if (!servicio || !servicio.activo) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado o inactivo'
      });
    }

    // 4. Comprobar que el barbero ofrezca el servicio
    const ofreceServicio = barbero.servicios.some(
      id => id.toString() === servicioId.toString()
    );

    if (!ofreceServicio) {
      return res.status(400).json({
        mensaje: 'El barbero no ofrece este servicio'
      });
    }

    // 5. Validar fecha de inicio
    const inicio = new Date(fechaHoraInicio);

    if (Number.isNaN(inicio.getTime())) {
      return res.status(400).json({
        mensaje: 'La fecha y hora de inicio no son válidas'
      });
    }

    if (inicio <= new Date()) {
      return res.status(400).json({
        mensaje: 'La reserva debe ser para una fecha futura'
      });
    }

    // 6. Calcular duración y finalización
    const duracion = servicio.duracionMinutos;

    if (!Number.isFinite(duracion) || duracion <= 0) {
      return res.status(400).json({
        mensaje: 'La duración del servicio no es válida'
      });
    }

    const fin = new Date(inicio.getTime() + duracion * 60000);

    // 7. Obtener día y horas de Colombia
    const diaSemana = obtenerDiaSemana(inicio);
    const horaInicio = obtenerHora(inicio);
    const horaFin = obtenerHora(fin);

    // 8. Comprobar los intervalos laborales del día
    const horariosDia = barbero.horario.filter(
      horario => horario.diaSemana === diaSemana
    );

    if (horariosDia.length === 0) {
      return res.status(400).json({
        mensaje: 'El barbero no trabaja ese día'
      });
    }

    const dentroDelHorario = horariosDia.some(horario =>
      horaInicio >= horario.horaInicio &&
      horaFin <= horario.horaFin
    );

    if (
      !dentroDelHorario ||
      fin.getTime() <= inicio.getTime()
    ) {
      return res.status(400).json({
        mensaje: 'La reserva está fuera del horario laboral o atraviesa la pausa de almuerzo'
      });
    }

    // 9. Comprobar reservas que se crucen
    const reservaExistente = await Reserva.findOne({
      barbero: barberoId,
      estado: { $ne: 'cancelada' },
      fechaHoraInicio: { $lt: fin },
      fechaHoraFin: { $gt: inicio }
    });

    if (reservaExistente) {
      return res.status(409).json({
        mensaje: 'El barbero ya tiene una reserva en ese horario'
      });
    }

    // 10. Crear reserva
    const reserva = await Reserva.create({
      cliente: {
        nombre: cliente.nombre.trim(),
        telefono: cliente.telefono.trim()
      },
      barbero: barberoId,
      servicio: servicioId,
      fechaHoraInicio: inicio,
      fechaHoraFin: fin,
      precio: servicio.precio,
      duracionMinutos: duracion,
      estado: 'pendiente'
    });

    res.status(201).json({
      mensaje: 'Reserva creada correctamente',
      reserva
    });

  } catch (error) {
    next(error);
  }
};

// CONSULTAR DISPONIBILIDAD
export const obtenerDisponibilidad = async (req, res, next) => {
  try {
    const {
      fecha,
      barbero: barberoId,
      servicio: servicioId
    } = req.query;

    // 1. Validar parámetros
    if (!fecha || !barberoId || !servicioId) {
      return res.status(400).json({
        mensaje: 'La fecha, el barbero y el servicio son obligatorios'
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return res.status(400).json({
        mensaje: 'La fecha debe tener el formato YYYY-MM-DD'
      });
    }

    if (
      !mongoose.isValidObjectId(barberoId) ||
      !mongoose.isValidObjectId(servicioId)
    ) {
      return res.status(400).json({
        mensaje: 'El ID del barbero o del servicio no es válido'
      });
    }

    // 2. Validar que la fecha exista
    const fechaLocal = new Date(`${fecha}T12:00:00-05:00`);

    if (
      Number.isNaN(fechaLocal.getTime()) ||
      obtenerFechaLocal(fechaLocal) !== fecha
    ) {
      return res.status(400).json({
        mensaje: 'La fecha indicada no es válida'
      });
    }

    // 3. Consultar barbero y servicio
    const barbero = await Barbero.findById(barberoId);
    const servicio = await Servicio.findById(servicioId);

    if (!barbero || !barbero.activo) {
      return res.status(404).json({
        mensaje: 'Barbero no encontrado o inactivo'
      });
    }

    if (!servicio || !servicio.activo) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado o inactivo'
      });
    }

    const ofreceServicio = barbero.servicios.some(
      id => id.toString() === servicioId.toString()
    );

    if (!ofreceServicio) {
      return res.status(400).json({
        mensaje: 'El barbero no ofrece este servicio'
      });
    }

    // 4. Obtener jornada laboral del día
    const diaSemana = obtenerDiaSemana(fechaLocal);

    const horariosDia = barbero.horario.filter(
      horario => horario.diaSemana === diaSemana
    );

    if (horariosDia.length === 0) {
      return res.status(200).json({
        fecha,
        horariosDisponibles: [],
        mensaje: 'El barbero no trabaja ese día'
      });
    }

    // 5. Obtener reservas del día
    // Colombia utiliza UTC-5.
    const inicioDia = new Date(`${fecha}T00:00:00-05:00`);

    const siguienteDia = new Date(
      inicioDia.getTime() + 24 * 60 * 60 * 1000
    );

    const reservas = await Reserva.find({
      barbero: barberoId,
      estado: { $ne: 'cancelada' },
      fechaHoraInicio: { $lt: siguienteDia },
      fechaHoraFin: { $gt: inicioDia }
    }).select('fechaHoraInicio fechaHoraFin');

    // 6. Generar horarios disponibles
    const duracion = servicio.duracionMinutos;

    if (!Number.isFinite(duracion) || duracion <= 0) {
      return res.status(400).json({
        mensaje: 'La duración del servicio no es válida'
      });
    }

    const ahora = new Date();
    const horariosDisponibles = [];

    for (const horario of horariosDia) {
      const [horaInicio, minutoInicio] = horario.horaInicio
        .split(':')
        .map(Number);

      const [horaFin, minutoFin] = horario.horaFin
        .split(':')
        .map(Number);

      const inicioMinutos = horaInicio * 60 + minutoInicio;
      const finMinutos = horaFin * 60 + minutoFin;

      // Intervalos de 30 minutos
      for (
        let minuto = inicioMinutos;
        minuto + duracion <= finMinutos;
        minuto += 30
      ) {
        const hora = minutosAHora(minuto);

        const inicioCandidato = new Date(
          `${fecha}T${hora}:00-05:00`
        );

        const finCandidato = new Date(
          inicioCandidato.getTime() + duracion * 60000
        );

        // No ofrecer horas que ya pasaron
        if (inicioCandidato <= ahora) {
          continue;
        }

        // Comprobar que no exista una reserva cruzada
        const ocupado = reservas.some(reserva =>
          inicioCandidato < reserva.fechaHoraFin &&
          finCandidato > reserva.fechaHoraInicio
        );

        if (!ocupado) {
          horariosDisponibles.push(hora);
        }
      }
    }

    res.status(200).json({
      fecha,
      barbero: barbero.nombre,
      servicio: servicio.nombre,
      duracionMinutos: duracion,
      horariosDisponibles
    });

  } catch (error) {
    next(error);
  }
};

// CONSULTAR TODAS LAS RESERVAS
export const obtenerReservas = async (req, res, next) => {
  try {
    const reservas = await Reserva.find()
      .populate('barbero', 'nombre')
      .populate('servicio', 'nombre precio duracionMinutos')
      .sort({ fechaHoraInicio: 1 });

    res.status(200).json(reservas);

  } catch (error) {
    next(error);
  }
};

// CONSULTAR UNA RESERVA
export const obtenerReserva = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de reserva no válido'
      });
    }

    const reserva = await Reserva.findById(req.params.id)
      .populate('barbero', 'nombre')
      .populate('servicio', 'nombre precio duracionMinutos');

    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Reserva no encontrada'
      });
    }

    res.status(200).json(reserva);

  } catch (error) {
    next(error);
  }
};

// ACTUALIZAR RESERVA
export const actualizarReserva = async (req, res, next) => {
  try {
    // 1. Validar ID
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        mensaje: 'ID de reserva no válido'
      });
    }

    // 2. Buscar reserva existente
    const reservaActual = await Reserva.findById(id);

    if (!reservaActual) {
      return res.status(404).json({
        mensaje: 'Reserva no encontrada'
      });
    }

    if (reservaActual.estado === 'cancelada') {
      return res.status(400).json({
        mensaje: 'No se puede modificar una reserva cancelada'
      });
    }

    // 3. Validar datos del cliente
    const cliente = req.body.cliente ?? reservaActual.cliente;

    if (
      typeof cliente?.nombre !== 'string' ||
      !cliente.nombre.trim() ||
      typeof cliente?.telefono !== 'string' ||
      !cliente.telefono.trim()
    ) {
      return res.status(400).json({
        mensaje: 'El nombre y el teléfono del cliente son obligatorios'
      });
    }

    // 4. Obtener identificadores actualizados
    const barberoId = req.body.barbero ?? reservaActual.barbero;
    const servicioId = req.body.servicio ?? reservaActual.servicio;

    if (
      !mongoose.isValidObjectId(barberoId) ||
      !mongoose.isValidObjectId(servicioId)
    ) {
      return res.status(400).json({
        mensaje: 'El ID del barbero o del servicio no es válido'
      });
    }

    // 5. Obtener fecha de inicio
    const inicio = new Date(
      req.body.fechaHoraInicio ?? reservaActual.fechaHoraInicio
    );

    if (Number.isNaN(inicio.getTime())) {
      return res.status(400).json({
        mensaje: 'La fecha y hora de inicio no son válidas'
      });
    }

    if (inicio <= new Date()) {
      return res.status(400).json({
        mensaje: 'La reserva debe ser para una fecha futura'
      });
    }

    // 6. Consultar barbero y servicio
    const barbero = await Barbero.findById(barberoId);
    const servicio = await Servicio.findById(servicioId);

    if (!barbero || !barbero.activo) {
      return res.status(404).json({
        mensaje: 'Barbero no encontrado o inactivo'
      });
    }

    if (!servicio || !servicio.activo) {
      return res.status(404).json({
        mensaje: 'Servicio no encontrado o inactivo'
      });
    }

    // 7. Comprobar que el barbero ofrezca el servicio
    const ofreceServicio = barbero.servicios.some(
      id => id.toString() === servicioId.toString()
    );

    if (!ofreceServicio) {
      return res.status(400).json({
        mensaje: 'El barbero no ofrece este servicio'
      });
    }

    // 8. Calcular duración, precio y finalización
    // Estos valores siempre salen de MongoDB.
    const duracion = servicio.duracionMinutos;

    if (!Number.isFinite(duracion) || duracion <= 0) {
      return res.status(400).json({
        mensaje: 'La duración del servicio no es válida'
      });
    }

    const fin = new Date(
      inicio.getTime() + duracion * 60000
    );

    // 9. Comprobar jornada laboral
    const diaSemana = obtenerDiaSemana(inicio);
    const horaInicio = obtenerHora(inicio);
    const horaFin = obtenerHora(fin);

    const horariosDia = barbero.horario.filter(
      horario => horario.diaSemana === diaSemana
    );

    if (horariosDia.length === 0) {
      return res.status(400).json({
        mensaje: 'El barbero no trabaja ese día'
      });
    }

    const dentroDelHorario = horariosDia.some(horario =>
      horaInicio >= horario.horaInicio &&
      horaFin <= horario.horaFin
    );

    if (!dentroDelHorario || fin <= inicio) {
      return res.status(400).json({
        mensaje: 'La reserva está fuera del horario laboral o atraviesa la pausa de almuerzo'
      });
    }

    // 10. Comprobar cruces con otras reservas
    // Se excluye la reserva que estamos modificando.
    const reservaExistente = await Reserva.findOne({
      _id: { $ne: reservaActual._id },
      barbero: barberoId,
      estado: { $ne: 'cancelada' },
      fechaHoraInicio: { $lt: fin },
      fechaHoraFin: { $gt: inicio }
    });

    if (reservaExistente) {
      return res.status(409).json({
        mensaje: 'El barbero ya tiene una reserva en ese horario'
      });
    }

    // 11. Guardar actualización
    const reserva = await Reserva.findByIdAndUpdate(
      id,
      {
        cliente: {
          nombre: cliente.nombre.trim(),
          telefono: cliente.telefono.trim()
        },
        barbero: barberoId,
        servicio: servicioId,
        fechaHoraInicio: inicio,
        fechaHoraFin: fin,
        precio: servicio.precio,
        duracionMinutos: duracion
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      mensaje: 'Reserva actualizada correctamente',
      reserva
    });

  } catch (error) {
    next(error);
  }
};

// CANCELAR RESERVA
export const cancelarReserva = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: 'ID de reserva no válido'
      });
    }

    const reserva = await Reserva.findByIdAndUpdate(
      req.params.id,
      { estado: 'cancelada' },
      { new: true }
    );

    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Reserva no encontrada'
      });
    }

    res.status(200).json({
      mensaje: 'Reserva cancelada correctamente',
      reserva
    });

  } catch (error) {
    next(error);
  }
};
