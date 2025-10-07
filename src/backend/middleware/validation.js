/**
 * Middleware de validación para endpoints de la API
 */

/**
 * Validar creación de activo
 */
const validateAssetCreation = (req, res, next) => {
  const { description, responsible, location } = req.body;
  const errors = [];

  // Validar description
  if (!description || typeof description !== 'string') {
    errors.push('El campo "description" es obligatorio y debe ser texto');
  } else if (description.trim().length < 10) {
    errors.push('La descripción debe tener al menos 10 caracteres');
  } else if (description.trim().length > 5000) {
    errors.push('La descripción no puede exceder 5000 caracteres');
  }

  // Validar responsible
  if (!responsible || typeof responsible !== 'string') {
    errors.push('El campo "responsible" es obligatorio y debe ser texto');
  } else if (responsible.trim().length < 3) {
    errors.push('El nombre del responsable debe tener al menos 3 caracteres');
  } else if (responsible.trim().length > 255) {
    errors.push('El nombre del responsable no puede exceder 255 caracteres');
  }

  // Validar location
  if (!location || typeof location !== 'string') {
    errors.push('El campo "location" es obligatorio y debe ser texto');
  } else if (location.trim().length < 3) {
    errors.push('La ubicación debe tener al menos 3 caracteres');
  } else if (location.trim().length > 255) {
    errors.push('La ubicación no puede exceder 255 caracteres');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors
    });
  }

  // Sanitizar datos (trim)
  req.body.description = description.trim();
  req.body.responsible = responsible.trim();
  req.body.location = location.trim();

  next();
};

/**
 * Validar actualización de activo
 */
const validateAssetUpdate = (req, res, next) => {
  const { description, responsible, location } = req.body;
  const errors = [];

  // Al menos un campo debe estar presente
  if (!description && !responsible && !location) {
    return res.status(400).json({
      success: false,
      message: 'Debe proporcionar al menos un campo para actualizar (description, responsible, location)'
    });
  }

  // Validar description si está presente
  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push('El campo "description" debe ser texto');
    } else if (description.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    } else if (description.trim().length > 5000) {
      errors.push('La descripción no puede exceder 5000 caracteres');
    }
  }

  // Validar responsible si está presente
  if (responsible !== undefined) {
    if (typeof responsible !== 'string') {
      errors.push('El campo "responsible" debe ser texto');
    } else if (responsible.trim().length < 3) {
      errors.push('El nombre del responsable debe tener al menos 3 caracteres');
    } else if (responsible.trim().length > 255) {
      errors.push('El nombre del responsable no puede exceder 255 caracteres');
    }
  }

  // Validar location si está presente
  if (location !== undefined) {
    if (typeof location !== 'string') {
      errors.push('El campo "location" debe ser texto');
    } else if (location.trim().length < 3) {
      errors.push('La ubicación debe tener al menos 3 caracteres');
    } else if (location.trim().length > 255) {
      errors.push('La ubicación no puede exceder 255 caracteres');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors
    });
  }

  // Sanitizar datos presentes
  if (description) req.body.description = description.trim();
  if (responsible) req.body.responsible = responsible.trim();
  if (location) req.body.location = location.trim();

  next();
};

/**
 * Validar ID numérico
 */
const validateNumericId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      message: 'ID inválido. Debe ser un número entero'
    });
  }

  req.params.id = parseInt(id);
  next();
};

/**
 * Validar parámetros de paginación
 */
const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  // Valores por defecto
  req.pagination = {
    page: 1,
    limit: 10
  };

  // Validar page
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "page" debe ser un número entero mayor a 0'
      });
    }
    req.pagination.page = pageNum;
  }

  // Validar limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro "limit" debe ser un número entre 1 y 100'
      });
    }
    req.pagination.limit = limitNum;
  }

  next();
};

/**
 * Validar parámetros de búsqueda
 */
const validateSearch = (req, res, next) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'El parámetro de búsqueda "q" es obligatorio y debe ser texto'
    });
  }

  if (q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'El término de búsqueda debe tener al menos 2 caracteres'
    });
  }

  req.query.q = q.trim();
  next();
};

/**
 * Validar asset_id format
 */
const validateAssetId = (req, res, next) => {
  const { assetId } = req.params;

  // Formato: AST-YYYY-NNNN
  const assetIdPattern = /^AST-\d{4}-\d{4}$/;

  if (!assetId || !assetIdPattern.test(assetId)) {
    return res.status(400).json({
      success: false,
      message: 'asset_id inválido. Formato esperado: AST-YYYY-NNNN (ejemplo: AST-2025-0001)'
    });
  }

  next();
};

module.exports = {
  validateAssetCreation,
  validateAssetUpdate,
  validateNumericId,
  validatePagination,
  validateSearch,
  validateAssetId
};
