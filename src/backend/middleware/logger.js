/**
 * Middleware de logging para operaciones de la API
 */

/**
 * Logger de peticiones HTTP
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Capturar el tiempo de inicio
  req.startTime = Date.now();

  // Hook para capturar cuando la respuesta termine
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;
    const statusColor = statusCode >= 500 ? '\x1b[31m' : 
                        statusCode >= 400 ? '\x1b[33m' : 
                        statusCode >= 300 ? '\x1b[36m' : 
                        '\x1b[32m';
    
    console.log(
      `[${timestamp}] ${method} ${url} - Status: ${statusColor}${statusCode}\x1b[0m - ${duration}ms`
    );
  });

  next();
};

/**
 * Logger de operaciones de base de datos
 */
const dbLogger = {
  logQuery: (operation, table, details = '') => {
    const timestamp = new Date().toISOString();
    console.log(`[DB ${timestamp}] ${operation} en ${table} ${details}`);
  },

  logSuccess: (operation, result) => {
    const timestamp = new Date().toISOString();
    const affectedRows = result.rowCount || 0;
    console.log(`\x1b[32m[DB SUCCESS ${timestamp}]\x1b[0m ${operation} - ${affectedRows} fila(s) afectada(s)`);
  },

  logError: (operation, error) => {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m[DB ERROR ${timestamp}]\x1b[0m ${operation} - ${error.message}`);
  }
};

/**
 * Logger de operaciones de archivos
 */
const fileLogger = {
  logWrite: (filePath) => {
    const timestamp = new Date().toISOString();
    console.log(`[FILE ${timestamp}] Escribiendo archivo: ${filePath}`);
  },

  logRead: (filePath) => {
    const timestamp = new Date().toISOString();
    console.log(`[FILE ${timestamp}] Leyendo archivo: ${filePath}`);
  },

  logDelete: (filePath) => {
    const timestamp = new Date().toISOString();
    console.log(`[FILE ${timestamp}] Eliminando archivo: ${filePath}`);
  },

  logError: (operation, filePath, error) => {
    const timestamp = new Date().toISOString();
    console.error(`\x1b[31m[FILE ERROR ${timestamp}]\x1b[0m ${operation} en ${filePath} - ${error.message}`);
  }
};

module.exports = {
  requestLogger,
  dbLogger,
  fileLogger
};
