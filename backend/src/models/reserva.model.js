
import mongoose from 'mongoose';

const reservaSchema = new mongoose.Schema(
  {
    cliente: {
      nombre: {
        type: String,
        required: true,
        trim: true
      },

      telefono: {
        type: String,
        required: true,
        trim: true
      }
    },

    barbero: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Barbero',
      required: true
    },

    servicio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Servicio',
      required: true
    },

    fechaHoraInicio: {
      type: Date,
      required: true
    },

    fechaHoraFin: {
      type: Date,
      required: true,
      validate: {
        validator: function (valor) {
          return valor > this.fechaHoraInicio;
        },
        message: 'La fecha de finalización debe ser posterior al inicio'
      }
    },

    precio: {
      type: Number,
      required: true,
      min: 0
    },

    duracionMinutos: {
      type: Number,
      required: true,
      min: 5
    },

    estado: {
      type: String,
      enum: [
        'pendiente',
        'confirmada',
        'cancelada',
        'completada'
      ],
      default: 'pendiente'
    }
  },
  {
    timestamps: true
  }
);

// Facilita las búsquedas de reservas por barbero y fecha
reservaSchema.index({
  barbero: 1,
  fechaHoraInicio: 1
});

const Reserva = mongoose.model('Reserva', reservaSchema);

export default Reserva;
