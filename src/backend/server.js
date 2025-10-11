require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const assetsRoutes = require('./routes/assets');
const db = require('./database/db');
const { requestLogger } = require('./middleware/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuración HTTPS
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../../key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../../cert.pem'))
};

// =====================================================
// CONFIGURACIÓN DE MIDDLEWARES
// =====================================================

// CORS configurado para permitir acceso desde cualquier dispositivo en la red local
const corsOptions = {
  origin: true, // Permite cualquier origen en desarrollo
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

// Servir el frontend de React desde el build
const frontendBuildPath = path.join(__dirname, '../frontend/build');
const frontendPublicPath = path.join(__dirname, '../../public');

// Si existe el build de React, servirlo
if (require('fs').existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
} else {
  // Si no existe el build, servir desde public como fallback
  app.use(express.static(frontendPublicPath));
}

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
// MANEJADORES DE ERROR
// =====================================================

// Ruta catch-all: devolver index.html para todas las rutas que no sean API
// Esto permite que React Router maneje las rutas del frontend
app.get('*', (req, res) => {
  if (require('fs').existsSync(path.join(frontendBuildPath, 'index.html'))) {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  } else {
    res.status(404).json({
      success: false,
      message: 'Frontend no encontrado. Ejecuta "npm run build" para compilar el frontend.',
      statusCode: 404,
      timestamp: new Date().toISOString()
    });
  }
});

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

    // Crear servidor HTTPS
    const httpsServer = https.createServer(httpsOptions, app);

    // Escuchar en 0.0.0.0 para permitir acceso desde otros dispositivos en la red
    httpsServer.listen(PORT, '0.0.0.0', () => {
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
