require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const assetsRoutes = require('./routes/assets');
const db = require('./database/db');
const { requestLogger } = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// =====================================================
// CONFIGURACIÓN DE MIDDLEWARES
// =====================================================

// CORS configurado para localhost y desarrollo
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// Parser de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (códigos QR)
app.use('/qr_codes', express.static(path.join(__dirname, '../../public/qr_codes')));

// Logger de peticiones HTTP
app.use(requestLogger);

// =====================================================
// RUTAS DE LA API
// =====================================================

app.use('/api/assets', assetsRoutes);

// =====================================================
// RUTAS DE SISTEMA
// =====================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'Backend funcionando correctamente',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Test de conexión a la base de datos
app.get('/api/db-test', async (req, res, next) => {
  try {
    const result = await db.query('SELECT NOW() as timestamp, version() as version');
    res.json({
      success: true,
      status: 'ok',
      message: 'Conexión a la base de datos exitosa',
      database: {
        timestamp: result.rows[0].timestamp,
        version: result.rows[0].version
      }
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// MANEJADORES DE ERROR
// =====================================================

// Manejador 404 - Ruta no encontrada
app.use(notFoundHandler);

// Manejador global de errores
app.use(errorHandler);

// =====================================================
// INICIALIZACIÓN DEL SERVIDOR
// =====================================================

// Verificar conexión a la base de datos al iniciar
const testDatabaseConnection = async () => {
  try {
    await db.query('SELECT 1');
    console.log('✅ Conexión a PostgreSQL establecida');
  } catch (error) {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
    console.error('💡 Verifica que PostgreSQL esté corriendo y las credenciales en .env sean correctas');
    process.exit(1);
  }
};

// Iniciar servidor
const startServer = async () => {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log('');
      console.log('================================================');
      console.log(`🚀 Servidor Express iniciado exitosamente`);
      console.log(`================================================`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`📊 API: http://localhost:${PORT}/api/assets`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  DB Test: http://localhost:${PORT}/api/db-test`);
      console.log('================================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Manejo de promesas rechazadas sin catch
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Iniciar
startServer();
