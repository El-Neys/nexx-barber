
import mongoose from 'mongoose';

const horarioSchema = new mongoose.Schema(
  {
    diaSemana: {
      type: String,
      required: true,
      enum: [
        'lunes',
        'martes',
        'miercoles',
        'jueves',
        'viernes',
        'sabado',
        'domingo'
      ]
    },

    horaInicio: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    },

    horaFin: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/
    }
  },
  { _id: false }
);

const barberoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true
    },

    servicios: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Servicio',
        required: true
      }
    ],

    horario: {
      type: [horarioSchema],
      default: []
    },

    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Barbero = mongoose.model('Barbero', barberoSchema);

export default Barbero;
