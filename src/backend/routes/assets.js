const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { dbLogger } = require('../middleware/logger');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const {
  validateAssetCreation,
  validateAssetUpdate,
  validateNumericId,
  validatePagination,
  validateSearch,
  validateAssetId
} = require('../middleware/validation');
const {
  generateQRCode,
  generateQRDataURL,
  deleteQRCode,
  regenerateQRCode,
  getQRInfo
} = require('../utils/qrCode');

// =====================================================
// RUTAS DE LA API PARA ASSETS
// =====================================================

/**
 * GET /api/assets
 * Listar todos los activos con paginación opcional
 * Query params: page, limit
 */
router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const { page, limit } = req.pagination;
  const offset = (page - 1) * limit;

  dbLogger.logQuery('SELECT', 'assets', `page=${page}, limit=${limit}`);

  // Obtener total de registros
  const countResult = await db.query('SELECT COUNT(*) FROM assets');
  const total = parseInt(countResult.rows[0].count);

  // Obtener activos paginados
  const result = await db.query(
    'SELECT * FROM assets ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );

  dbLogger.logSuccess('SELECT', result);

  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  });
}));

/**
 * GET /api/assets/search
 * Buscar activos por término de búsqueda
 * Query params: q (requerido)
 * Busca en: asset_id, description, responsible, location
 */
router.get('/search', validateSearch, asyncHandler(async (req, res) => {
  const { q } = req.query;
  const searchTerm = `%${q}%`;

  dbLogger.logQuery('SEARCH', 'assets', `query="${q}"`);

  const result = await db.query(
    `SELECT * FROM assets 
     WHERE asset_id ILIKE $1 
        OR description ILIKE $1 
        OR responsible ILIKE $1 
        OR location ILIKE $1
     ORDER BY created_at DESC`,
    [searchTerm]
  );

  dbLogger.logSuccess('SEARCH', result);

  res.json({
    success: true,
    data: result.rows,
    count: result.rows.length,
    searchTerm: q
  });
}));

/**
 * GET /api/assets/qr/:assetId
 * Buscar activo por su asset_id (para lectura de QR)
 * Params: assetId (formato AST-YYYY-NNNN)
 */
router.get('/qr/:assetId', validateAssetId, asyncHandler(async (req, res) => {
  const { assetId } = req.params;

  dbLogger.logQuery('SELECT BY ASSET_ID', 'assets', `asset_id=${assetId}`);

  const result = await db.query(
    'SELECT * FROM assets WHERE asset_id = $1',
    [assetId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el ID: ${assetId}`);
  }

  dbLogger.logSuccess('SELECT BY ASSET_ID', result);

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * GET /api/assets/:id
 * Obtener un activo específico por ID interno
 * Params: id (número entero)
 */
router.get('/:id', validateNumericId, asyncHandler(async (req, res) => {
  const { id } = req.params;

  dbLogger.logQuery('SELECT BY ID', 'assets', `id=${id}`);

  const result = await db.query(
    'SELECT * FROM assets WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el ID: ${id}`);
  }

  dbLogger.logSuccess('SELECT BY ID', result);

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * POST /api/assets
 * Crear nuevo activo
 * Body: { description, responsible, location }
 */
router.post('/', validateAssetCreation, asyncHandler(async (req, res) => {
  const { description, responsible, location } = req.body;

  dbLogger.logQuery('INSERT', 'assets', 'Generando asset_id...');

  // Generar el próximo asset_id usando la función de PostgreSQL
  const assetIdResult = await db.query('SELECT generate_next_asset_id() as asset_id');
  const asset_id = assetIdResult.rows[0].asset_id;

  dbLogger.logQuery('INSERT', 'assets', `asset_id=${asset_id}`);

  // Generar y guardar código QR como archivo PNG
  const qrResult = await generateQRCode(asset_id);

  // Insertar activo en la base de datos
  const result = await db.query(
    `INSERT INTO assets (
      asset_id, description, responsible, location, qr_code_path
    ) VALUES ($1, $2, $3, $4, $5) 
    RETURNING *`,
    [asset_id, description, responsible, location, qrResult.filePath]
  );

  dbLogger.logSuccess('INSERT', result);

  res.status(201).json({
    success: true,
    message: 'Activo creado exitosamente',
    data: result.rows[0],
    qr: {
      filePath: qrResult.filePath,
      fileName: qrResult.fileName,
      dataURL: qrResult.dataURL // Base64 para mostrar inmediatamente
    }
  });
}));

/**
 * PUT /api/assets/:id
 * Actualizar activo
 * Params: id (número entero)
 * Body: { description?, responsible?, location? } - Al menos uno requerido
 */
router.put('/:id', validateNumericId, validateAssetUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, responsible, location } = req.body;

  // Construir query dinámica solo con campos proporcionados
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (description) {
    updates.push(`description = $${paramCount}`);
    params.push(description);
    paramCount++;
  }

  if (responsible) {
    updates.push(`responsible = $${paramCount}`);
    params.push(responsible);
    paramCount++;
  }

  if (location) {
    updates.push(`location = $${paramCount}`);
    params.push(location);
    paramCount++;
  }

  params.push(id);

  dbLogger.logQuery('UPDATE', 'assets', `id=${id}, fields=[${updates.join(', ')}]`);

  const result = await db.query(
    `UPDATE assets SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el ID: ${id}`);
  }

  dbLogger.logSuccess('UPDATE', result);

  res.json({
    success: true,
    message: 'Activo actualizado exitosamente',
    data: result.rows[0]
  });
}));

/**
 * DELETE /api/assets/:id
 * Eliminar un activo
 * Params: id (número entero)
 */
router.delete('/:id', validateNumericId, asyncHandler(async (req, res) => {
  const { id } = req.params;

  dbLogger.logQuery('DELETE', 'assets', `id=${id}`);

  const result = await db.query(
    'DELETE FROM assets WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el ID: ${id}`);
  }

  const deletedAsset = result.rows[0];

  // Eliminar archivo QR físico si existe
  try {
    await deleteQRCode(deletedAsset.asset_id);
  } catch (error) {
    // No es crítico si el QR no se puede eliminar
    console.warn(`Advertencia: No se pudo eliminar el QR ${deletedAsset.asset_id}:`, error.message);
  }

  dbLogger.logSuccess('DELETE', result);

  res.json({
    success: true,
    message: 'Activo eliminado exitosamente',
    data: deletedAsset
  });
}));

/**
 * POST /api/assets/:id/generate-qr
 * Generar código QR para un activo existente
 * Params: id (número entero)
 * Regenera el QR si ya existe
 */
router.post('/:id/generate-qr', validateNumericId, asyncHandler(async (req, res) => {
  const { id } = req.params;

  dbLogger.logQuery('SELECT FOR QR', 'assets', `id=${id}`);

  const result = await db.query(
    'SELECT asset_id, qr_code_path FROM assets WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el ID: ${id}`);
  }

  const { asset_id } = result.rows[0];

  // Regenerar código QR
  const qrResult = await regenerateQRCode(asset_id);

  // Actualizar ruta del QR en la base de datos si cambió
  await db.query(
    'UPDATE assets SET qr_code_path = $1 WHERE id = $2',
    [qrResult.filePath, id]
  );

  dbLogger.logSuccess('GENERATE QR', { rowCount: 1 });

  res.json({
    success: true,
    message: 'Código QR generado exitosamente',
    asset_id,
    qr: {
      filePath: qrResult.filePath,
      fileName: qrResult.fileName,
      dataURL: qrResult.dataURL
    }
  });
}));

module.exports = router;
