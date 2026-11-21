import mongoose from 'mongoose';

const servicioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    precio: { type: Number, required: true, min: 0 },
    duracionMinutos: { type: Number, required: true, min: 5 },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Servicio', servicioSchema);