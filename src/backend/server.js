require('dotenv').config();
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const assetsRoutes = require('./routes/assets');
const locationsRoutes = require('./routes/locations');
const responsiblesRoutes = require('./routes/responsibles');
const assetNamesRoutes = require('./routes/assetNames');
const db = require('./database/db');
const { requestLogger } = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración HTTPS (en desarrollo y producción para soportar acceso a cámara desde dispositivos móviles)
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../../key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../../cert.pem'))
};

// =====================================================
// CONFIGURACIÓN DE MIDDLEWARES
// =====================================================

// CORS configurado para permitir acceso desde cualquier dispositivo en la red local
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman) y cualquier localhost
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168')) {
      callback(null, true);
    } else {
      callback(null, true); // En desarrollo, permitir todo
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true,
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Agregar headers CORS manualmente como backup
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  
  // Manejar preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Parser de JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos (códigos QR y etiquetas)
app.use('/qr_codes', express.static(path.join(__dirname, '../../public/qr_codes')));
app.use('/labels', express.static(path.join(__dirname, '../../public/labels')));
app.use('/assets', express.static(path.join(__dirname, '../../public/assets')));

// Logger de peticiones HTTP
app.use(requestLogger);

// =====================================================
// RUTAS DE LA API (ANTES del frontend estático)
// =====================================================

app.use('/api/assets', assetsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/responsibles', responsiblesRoutes);
app.use('/api/asset-names', assetNamesRoutes);

// Definir rutas del frontend (necesarias más abajo)
const frontendBuildPath = path.join(__dirname, '../../build');
const frontendPublicPath = path.join(__dirname, '../../public');

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

// Crear backup de la base de datos
app.post('/api/db-backup', async (req, res, next) => {
  const { spawn } = require('child_process');
  const fs = require('fs');
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, '../../backups');
    const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);

    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'inventario_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    };

    // Usar pg_dump para crear backup
    const pg_dump = spawn('pg_dump', [
      '-h', dbConfig.host,
      '-p', dbConfig.port.toString(),
      '-U', dbConfig.user,
      '-d', dbConfig.database,
      '-F', 'p', // Plain text format
      '-f', backupFile
    ], {
      env: {
        ...process.env,
        PGPASSWORD: dbConfig.password
      }
    });

    let errorOutput = '';

    pg_dump.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pg_dump.on('close', (code) => {
      if (code !== 0) {
        console.error('Error en pg_dump:', errorOutput);
        return res.status(500).json({
          success: false,
          message: 'Error al crear backup de la base de datos',
          error: errorOutput
        });
      }

      const stats = fs.statSync(backupFile);
      res.json({
        success: true,
        message: 'Backup creado exitosamente',
        backup: {
          filename: path.basename(backupFile),
          filepath: backupFile,
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
          timestamp: new Date().toISOString()
        }
      });
    });

    pg_dump.on('error', (err) => {
      console.error('Error ejecutando pg_dump:', err);
      res.status(500).json({
        success: false,
        message: 'Error al ejecutar pg_dump. Verifica que PostgreSQL esté instalado.',
        error: err.message
      });
    });

  } catch (error) {
    next(error);
  }
});

// =====================================================
// SERVIR FRONTEND ESTÁTICO (SOLO en producción o con build)
// =====================================================

// En modo desarrollo, el frontend es servido por React Dev Server en puerto 3000/7030
// Solo servir archivos estáticos si existe el build (modo producción o Electron)
if (NODE_ENV === 'production' || require('fs').existsSync(frontendBuildPath)) {
  if (require('fs').existsSync(frontendBuildPath)) {
    console.log('📦 Sirviendo frontend desde build/');
    app.use(express.static(frontendBuildPath));
    
    // Ruta catch-all: devolver index.html para SPA routing
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
  } else if (NODE_ENV === 'production') {
    // En producción sin build, devolver error
    app.get('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Frontend no encontrado. Ejecuta "npm run build" para compilar el frontend.',
        statusCode: 404,
        timestamp: new Date().toISOString()
      });
    });
  }
} else {
  console.log('📦 Modo desarrollo: Frontend servido por React Dev Server');
}

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

    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIP = 'localhost';
    
    // Obtener la IP local de la red
    for (const name of Object.keys(networkInterfaces)) {
      for (const iface of networkInterfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address;
          break;
        }
      }
    }

    // Usar HTTPS siempre (requerido para acceso a cámara desde dispositivos móviles)
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('================================================');
      console.log(`🚀 Servidor HTTPS Express iniciado exitosamente`);
      console.log(`================================================`);
      console.log(`🔒 URL Local: https://localhost:${PORT}`);
      console.log(`📱 URL Red Local: https://${localIP}:${PORT}`);
      console.log(`🌍 Entorno: ${NODE_ENV}`);
      console.log(`📊 API: https://${localIP}:${PORT}/api/assets`);
      console.log(`❤️  Health: https://${localIP}:${PORT}/api/health`);
      console.log('================================================');
      console.log('⚠️  IMPORTANTE: Acepta el certificado autofirmado en tu navegador');
      console.log('📱 Para usar la cámara desde tu celular, acepta el certificado');
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
