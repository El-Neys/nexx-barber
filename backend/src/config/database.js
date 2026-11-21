
import mongoose from 'mongoose';

const conectarDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        'La variable de entorno MONGODB_URI no está definida'
      );
    }

    await mongoose.connect(uri);

    console.log('MongoDB conectado correctamente');

  } catch (error) {
    console.error(
      'Error al conectar con MongoDB:',
      error.message
    );

    throw error;
  }
};

export default conectarDB;
