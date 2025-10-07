/**
 * Middleware de manejo de errores centralizado
 */

/**
 * Clase de error personalizada para errores de API
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Manejador de errores 404 - Ruta no encontrada
 */
const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Manejador global de errores
 */
const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Status code por defecto
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let errors = err.errors || null;

  // Logging del error
  console.error(`\x1b[31m[ERROR ${timestamp}]\x1b[0m ${req.method} ${req.originalUrl}`);
  console.error(`Status: ${statusCode} - Message: ${message}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // Errores específicos de PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Violación de constraint unique
        statusCode = 409;
        message = 'Ya existe un registro con esos datos únicos';
        if (err.detail) {
          errors = [err.detail];
        }
        break;
      case '23503': // Violación de foreign key
        statusCode = 400;
        message = 'Referencia inválida a otro registro';
        break;
      case '23502': // Violación de not null
        statusCode = 400;
        message = 'Falta un campo obligatorio';
        break;
      case '22P02': // Invalid text representation
        statusCode = 400;
        message = 'Formato de datos inválido';
        break;
      case 'ECONNREFUSED':
        statusCode = 503;
        message = 'No se puede conectar a la base de datos';
        break;
      default:
        if (err.code.startsWith('23')) {
          statusCode = 400;
          message = 'Error de validación de datos';
        }
    }
  }

  // Error de validación de Express
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errors = Object.values(err.errors).map(e => e.message);
  }

  // Construir respuesta de error
  const errorResponse = {
    success: false,
    message,
    statusCode,
    timestamp
  };

  // Agregar errores si existen
  if (errors) {
    errorResponse.errors = errors;
  }

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.rawError = err.toString();
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Wrapper async para manejar errores en funciones async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiError,
  notFoundHandler,
  errorHandler,
  asyncHandler
};
