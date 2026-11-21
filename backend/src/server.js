
import dns from 'node:dns';
import app from './app.js';
import env from './config/env.js';
import conectarDB from './config/database.js';

// Configuración DNS para resolución IPv4
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const iniciar = async () => {
  try {
    await conectarDB();

    app.listen(env.port, '0.0.0.0', () => {
      console.log(
        `Servidor corriendo en el puerto ${env.port}`
      );
      console.log(`Entorno: ${env.nodeEnv}`);
    });

  } catch (error) {
    console.error(
      'No se pudo iniciar el servidor:',
      error.message
    );

    process.exit(1);
  }
};

iniciar();
