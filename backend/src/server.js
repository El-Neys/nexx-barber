import dns from 'node:dns';
import app from './app.js';
import env from './config/env.js';
import conectarDB from './config/database.js';

// DNS públicos: soluciona "querySrv ECONNREFUSED" con mongodb+srv://
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

const iniciar = async () => {
  try {
    await conectarDB();
    app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de NEXX Barber funcionando correctamente'
    });
});
    app.listen(env.port, () => {
      console.log(`Servidor corriendo en http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

iniciar();