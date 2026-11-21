
import mongoose from 'mongoose';

const conectarDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            throw new Error(
                'La variable MONGODB_URI no está definida en el archivo .env'
            );
        }

        await mongoose.connect(uri);

        console.log('MongoDB conectado correctamente');

    } catch (error) {
        console.error('Error al conectar con MongoDB:', error.message);
        throw error;
    }
};

export default conectarDB;
