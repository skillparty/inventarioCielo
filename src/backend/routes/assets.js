const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { dbLogger } = require('../middleware/logger');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');
const {
  validateAssetCreation,
  validateAssetUpdate,
  validatePagination,
  validateSearch
} = require('../middleware/validation');
const {
  generateQRCode,
  deleteQRCode
} = require('../utils/qrCode');
const {
  generateBarTenderLabel,
  deleteBartenderLabel
} = require('../utils/bartenderGenerator');
const {
  generatePDFLabel,
  deletePDFLabel
} = require('../utils/pdfLabelGenerator');
const {
  generateBatchPDF
} = require('../utils/batchPdfGenerator');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Configurar multer para subida de archivos
const upload = multer({
  dest: path.join(__dirname, '../../../public/uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Genera un número de serie único con formato: 3 letras + 4 números (ej: ABC1234)
 */
async function generateSerialNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let serialNumber;
  let exists = true;
  
  // Intentar hasta encontrar un número de serie único
  while (exists) {
    // Generar 3 letras aleatorias
    let randomLetters = '';
    for (let i = 0; i < 3; i++) {
      randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generar 4 números aleatorios
    const randomNumbers = Math.floor(1000 + Math.random() * 9000); // Número entre 1000 y 9999
    
    serialNumber = `${randomLetters}${randomNumbers}`;
    
    // Verificar si ya existe
    const result = await db.query(
      'SELECT serial_number FROM assets WHERE serial_number = $1',
      [serialNumber]
    );
    
    exists = result.rows.length > 0;
  }
  
  return serialNumber;
}

// =====================================================
// RUTAS DE LA API PARA ASSETS (SERIAL_NUMBER COMO PRIMARY KEY)
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
 * Busca en: serial_number, description, responsible, location, category
 */
router.get('/search', validateSearch, asyncHandler(async (req, res) => {
  const { q } = req.query;
  const searchTerm = `%${q}%`;

  dbLogger.logQuery('SEARCH', 'assets', `query="${q}"`);

  const result = await db.query(
    `SELECT * FROM assets 
     WHERE serial_number ILIKE $1 
        OR description ILIKE $1 
        OR responsible ILIKE $1 
        OR location ILIKE $1
        OR category ILIKE $1
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
 * GET /api/assets/qr/:serialNumber
 * Buscar activo por su serial_number (para lectura de QR)
 * Params: serialNumber
 */
router.get('/qr/:serialNumber', asyncHandler(async (req, res) => {
  const { serialNumber } = req.params;

  dbLogger.logQuery('SELECT BY QR', 'assets', `serial_number="${serialNumber}"`);

  const result = await db.query(
    'SELECT * FROM assets WHERE serial_number = $1',
    [serialNumber]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el número de serie: ${serialNumber}`);
  }

  dbLogger.logSuccess('SELECT BY QR', result);

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * GET /api/assets/:serial_number
 * Obtener un activo específico por número de serie
 * Params: serial_number
 */
router.get('/:serial_number', asyncHandler(async (req, res) => {
  const { serial_number } = req.params;

  dbLogger.logQuery('SELECT BY SERIAL', 'assets', `serial_number="${serial_number}"`);

  const result = await db.query(
    'SELECT * FROM assets WHERE serial_number = $1',
    [serial_number]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el número de serie: ${serial_number}`);
  }

  dbLogger.logSuccess('SELECT BY SERIAL', result);

  res.json({
    success: true,
    data: result.rows[0]
  });
}));

/**
 * POST /api/assets
 * Crear nuevo activo (o múltiples si se especifica quantity)
 * Body: { asset_name_id?, name?, description, responsible, location, category?, value?, status?, quantity? }
 * El serial_number se genera automáticamente (formato: ABC1234)
 * Si se proporciona asset_name_id, se genera el nombre con contador incremental
 */
router.post('/', validateAssetCreation, asyncHandler(async (req, res) => {
  let { serial_number, asset_name_id, name, description, responsible, location, category, value, status, quantity } = req.body;

  console.log('📝 Datos recibidos:', { asset_name_id, name, description, responsible, location, category, value, status, quantity });

  // Validar cantidad (por defecto 1)
  const cantidadActivos = quantity && quantity > 1 ? Math.min(parseInt(quantity), 50) : 1;
  
  // Array para almacenar los activos creados
  const activosCreados = [];
  
  // Crear los activos (uno o múltiples)
  for (let i = 0; i < cantidadActivos; i++) {
    let currentSerialNumber;
    let currentName = name;
    
    // Siempre generar serial_number único automáticamente
    currentSerialNumber = await generateSerialNumber();
    console.log(`✅ Número de serie generado automáticamente: ${currentSerialNumber} (${i + 1}/${cantidadActivos})`);

    // Si se proporciona asset_name_id, generar nombre con contador incremental
    if (asset_name_id) {
      const assetNameResult = await db.query(
        'SELECT name, counter FROM asset_names WHERE id = $1',
        [asset_name_id]
      );

      if (assetNameResult.rows.length === 0) {
        throw new ApiError(404, 'El nombre de activo seleccionado no existe');
      }

      const baseName = assetNameResult.rows[0].name;
      const currentCounter = assetNameResult.rows[0].counter;

      // Generar nombre completo con contador
      currentName = `${baseName} (${currentCounter})`;

      // Incrementar contador en asset_names
      await db.query(
        'UPDATE asset_names SET counter = counter + 1 WHERE id = $1',
        [asset_name_id]
      );

      console.log(`✅ Nombre generado con contador: ${currentName}`);
    }

    dbLogger.logQuery('INSERT', 'assets', `serial_number="${currentSerialNumber}"`);

    // Generar y guardar código QR como archivo PNG (usando el serial_number)
    const qrResult = await generateQRCode(currentSerialNumber);

    // Generar asset_id con formato: AST-YYYY-NNNN (usando MAX id para evitar conflictos)
    const year = new Date().getFullYear();
    const maxIdResult = await db.query('SELECT COALESCE(MAX(id), 0) as max_id FROM assets');
    const nextId = parseInt(maxIdResult.rows[0].max_id) + i + 1;
    const asset_id = `AST-${year}-${String(nextId).padStart(4, '0')}`;

    // Insertar activo en la base de datos
    console.log('💾 Intentando insertar:', { currentSerialNumber, asset_id, currentName, description, responsible, location });
    
    try {
      const result = await db.query(
        `INSERT INTO assets (
          serial_number, asset_id, name, description, responsible, location, qr_code_path, category, value, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *`,
        [currentSerialNumber, asset_id, currentName || null, description, responsible, location, qrResult.filePath, category || null, value || 0, status || 'Activo']
      );

      dbLogger.logSuccess('INSERT', result);
      console.log('✅ Activo insertado correctamente:', result.rows[0].serial_number);
    
      // Guardar activo creado
      activosCreados.push({
        ...result.rows[0],
        qr: {
          filePath: qrResult.filePath,
          fileName: qrResult.fileName,
          dataURL: qrResult.dataURL
        }
      });
    } catch (insertError) {
      console.error('❌ Error al insertar activo:', insertError.message);
      console.error('📊 Código de error:', insertError.code);
      console.error('📊 Detalle:', insertError.detail);
      throw new ApiError(409, `Error al crear activo: ${insertError.message}. Serial: ${currentSerialNumber}, AssetID: ${asset_id}`);
    }
  }

  // Respuesta según cantidad creada
  if (cantidadActivos === 1) {
    res.status(201).json({
      success: true,
      message: `Activo creado exitosamente con número de serie: ${activosCreados[0].serial_number}`,
      data: activosCreados[0],
      qr: activosCreados[0].qr
    });
  } else {
    res.status(201).json({
      success: true,
      message: `${cantidadActivos} activos creados exitosamente`,
      data: activosCreados.map(a => ({ ...a, qr: undefined })), // No enviar base64 de todos los QRs (muy pesado)
      count: cantidadActivos,
      qr: activosCreados[0].qr // Solo enviar el QR del primero
    });
  }
}));

/**
 * PUT /api/assets/:serial_number
 * Actualizar activo
 * Params: serial_number
 * Body: { name?, description?, responsible?, location?, category?, value?, status? } - Al menos uno requerido
 * NOTA: El serial_number NO se puede cambiar (es PRIMARY KEY)
 */
router.put('/:serial_number', validateAssetUpdate, asyncHandler(async (req, res) => {
  const { serial_number } = req.params;
  const { name, description, responsible, location, category, value, status } = req.body;

  // Construir query dinámica solo con campos proporcionados
  const updates = [];
  const params = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    params.push(name);
    paramCount++;
  }

  if (description !== undefined) {
    updates.push(`description = $${paramCount}`);
    params.push(description);
    paramCount++;
  }

  if (responsible !== undefined) {
    updates.push(`responsible = $${paramCount}`);
    params.push(responsible);
    paramCount++;
  }

  if (location !== undefined) {
    updates.push(`location = $${paramCount}`);
    params.push(location);
    paramCount++;
  }

  if (category !== undefined) {
    updates.push(`category = $${paramCount}`);
    params.push(category);
    paramCount++;
  }

  if (value !== undefined) {
    updates.push(`value = $${paramCount}`);
    params.push(value);
    paramCount++;
  }

  if (status !== undefined) {
    updates.push(`status = $${paramCount}`);
    params.push(status);
    paramCount++;
  }

  if (updates.length === 0) {
    throw new ApiError(400, 'Debe proporcionar al menos un campo para actualizar');
  }

  params.push(serial_number);

  dbLogger.logQuery('UPDATE', 'assets', `serial_number="${serial_number}", fields=[${updates.join(', ')}]`);

  const result = await db.query(
    `UPDATE assets SET ${updates.join(', ')} WHERE serial_number = $${paramCount} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el número de serie: ${serial_number}`);
  }

  dbLogger.logSuccess('UPDATE', result);

  res.json({
    success: true,
    message: 'Activo actualizado exitosamente',
    data: result.rows[0]
  });
}));

/**
 * DELETE /api/assets/:serial_number
 * Eliminar activo
 * Params: serial_number
 */
router.delete('/:serial_number', asyncHandler(async (req, res) => {
  const { serial_number } = req.params;

  dbLogger.logQuery('DELETE', 'assets', `serial_number="${serial_number}"`);

  // Obtener info del activo antes de eliminar (para borrar QR)
  const assetResult = await db.query(
    'SELECT * FROM assets WHERE serial_number = $1',
    [serial_number]
  );

  if (assetResult.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el número de serie: ${serial_number}`);
  }

  const asset = assetResult.rows[0];

  // Eliminar el archivo QR si existe
  if (asset.qr_code_path) {
    await deleteQRCode(asset.qr_code_path);
  }

  // Eliminar el activo de la base de datos
  await db.query('DELETE FROM assets WHERE serial_number = $1', [serial_number]);

  dbLogger.logSuccess('DELETE', { rowCount: 1 });

  res.json({
    success: true,
    message: `Activo "${serial_number}" eliminado exitosamente`
  });
}));

/**
 * POST /api/assets/:serial_number/generate-qr
 * Generar/Regenerar código QR para un activo
 * Params: serial_number
 */
router.post('/:serial_number/generate-qr', asyncHandler(async (req, res) => {
  const { serial_number } = req.params;

  dbLogger.logQuery('GENERATE QR', 'assets', `serial_number="${serial_number}"`);

  // Verificar que el activo existe
  const result = await db.query(
    'SELECT * FROM assets WHERE serial_number = $1',
    [serial_number]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el número de serie: ${serial_number}`);
  }

  const asset = result.rows[0];

  // Generar nuevo QR
  const qrResult = await generateQRCode(serial_number);

  // Actualizar la ruta del QR en la base de datos
  await db.query(
    'UPDATE assets SET qr_code_path = $1 WHERE serial_number = $2',
    [qrResult.filePath, serial_number]
  );

  dbLogger.logSuccess('GENERATE QR', { serial_number });

  res.json({
    success: true,
    message: 'Código QR generado exitosamente',
    serial_number: serial_number,
    qr: {
      filePath: qrResult.filePath,
      fileName: qrResult.fileName,
      dataURL: qrResult.dataURL
    }
  });
}));

/**
 * POST /api/assets/:serial_number/generate-label
 * Generar archivo PDF (WePrint compatible) para un activo
 * Params: serial_number
 */
router.post('/:serial_number/generate-label', asyncHandler(async (req, res) => {
  const { serial_number } = req.params;

  dbLogger.logQuery('GENERATE LABEL', 'assets', `serial_number="${serial_number}"`);

  // Verificar que el activo existe
  const result = await db.query(
    'SELECT * FROM assets WHERE serial_number = $1',
    [serial_number]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el número de serie: ${serial_number}`);
  }

  const asset = result.rows[0];

  // Generar código QR si no existe
  if (!asset.qr_code_path) {
    const qrResult = await generateQRCode(serial_number);
    await db.query(
      'UPDATE assets SET qr_code_path = $1 WHERE serial_number = $2',
      [qrResult.filePath, serial_number]
    );
  }

  // Generar archivo PDF para WePrint
  const labelResult = await generatePDFLabel(asset);

  dbLogger.logSuccess('GENERATE LABEL', { serial_number });

  res.json({
    success: true,
    message: 'Etiqueta PDF generada exitosamente',
    serial_number: serial_number,
    label: {
      filePath: labelResult.filePath,
      fileName: labelResult.fileName,
      downloadUrl: `/api/assets/${serial_number}/download-label`
    }
  });
}));

/**
 * GET /api/assets/:serial_number/download-label
 * Descargar archivo PDF para un activo
 * Params: serial_number
 */
router.get('/:serial_number/download-label', asyncHandler(async (req, res) => {
  const { serial_number } = req.params;

  // Verificar que el activo existe
  const result = await db.query(
    'SELECT * FROM assets WHERE serial_number = $1',
    [serial_number]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, `No se encontró ningún activo con el número de serie: ${serial_number}`);
  }

  const asset = result.rows[0];

  // Generar la etiqueta PDF si no existe
  const labelResult = await generatePDFLabel(asset);

  // Enviar archivo para descarga
  res.download(labelResult.fullPath, labelResult.fileName, (err) => {
    if (err) {
      console.error('Error al descargar etiqueta:', err);
      throw new ApiError(500, 'Error al descargar el archivo de etiqueta');
    }
  });
}));

/**
 * POST /api/assets/batch/generate-labels
 * Generar PDF con múltiples etiquetas para impresión por lotes
 * Body: { serialNumbers: ["ABC1234", "DEF5678", ...] }
 */
router.post('/batch/generate-labels', asyncHandler(async (req, res) => {
  const { serialNumbers } = req.body;

  if (!serialNumbers || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
    throw new ApiError(400, 'Se requiere un array de serial numbers');
  }

  if (serialNumbers.length > 100) {
    throw new ApiError(400, 'El límite máximo es 100 etiquetas por batch');
  }

  dbLogger.logQuery('BATCH GENERATE LABELS', 'assets', `count=${serialNumbers.length}`);

  // Obtener todos los activos
  const placeholders = serialNumbers.map((_, i) => `$${i + 1}`).join(',');
  const result = await db.query(
    `SELECT * FROM assets WHERE serial_number IN (${placeholders})`,
    serialNumbers
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'No se encontraron activos con los números de serie proporcionados');
  }

  // Verificar QR codes y generar los faltantes
  for (const asset of result.rows) {
    if (!asset.qr_code_path) {
      const qrResult = await generateQRCode(asset.serial_number);
      await db.query(
        'UPDATE assets SET qr_code_path = $1 WHERE serial_number = $2',
        [qrResult.filePath, asset.serial_number]
      );
      asset.qr_code_path = qrResult.filePath;
    }
  }

  // Generar PDF batch
  const batchId = `${result.rows.length}labels`;
  const batchResult = await generateBatchPDF(result.rows, batchId);

  dbLogger.logSuccess('BATCH GENERATE LABELS', { count: result.rows.length });

  res.json({
    success: true,
    message: `PDF con ${result.rows.length} etiquetas generado exitosamente`,
    batch: {
      filePath: batchResult.filePath,
      fileName: batchResult.fileName,
      labelCount: batchResult.labelCount,
      pageCount: batchResult.pageCount,
      downloadUrl: `/api/assets/batch/download-labels/${batchResult.fileName}`
    }
  });
}));

/**
 * GET /api/assets/batch/download-labels/:filename
 * Descargar archivo PDF batch
 * Params: filename
 */
router.get('/batch/download-labels/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;

  // Validar nombre de archivo para evitar path traversal
  if (!/^batch_[a-zA-Z0-9_]+\.pdf$/.test(filename)) {
    throw new ApiError(400, 'Nombre de archivo inválido');
  }

  const { BATCH_LABELS_DIR } = require('../utils/batchPdfGenerator');
  const path = require('path');
  const filePath = path.join(BATCH_LABELS_DIR, filename);

  // Verificar que el archivo existe
  try {
    await require('fs').promises.access(filePath);
  } catch (error) {
    throw new ApiError(404, 'Archivo no encontrado');
  }

  // Enviar archivo para descarga
  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Error al descargar PDF batch:', err);
      throw new ApiError(500, 'Error al descargar el archivo');
    }
  });
}));

// =====================================================
// CARGA MASIVA DE ACTIVOS
// =====================================================

/**
 * GET /api/assets/bulk/download-template
 * Descargar plantilla Excel para carga masiva
 */
router.get('/bulk/download-template', asyncHandler(async (req, res) => {
  const templatePath = path.join(__dirname, '../../../public/templates/plantilla_activos.xlsx');
  
  // Verificar que la plantilla existe
  try {
    await fs.promises.access(templatePath);
  } catch (error) {
    throw new ApiError(404, 'Plantilla no encontrada');
  }

  res.download(templatePath, 'plantilla_activos.xlsx', (err) => {
    if (err) {
      console.error('Error al descargar plantilla:', err);
      throw new ApiError(500, 'Error al descargar la plantilla');
    }
  });
}));

/**
 * POST /api/assets/bulk/upload
 * Subir archivo Excel para carga masiva de activos
 */
router.post('/bulk/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No se proporcionó ningún archivo');
  }

  const filePath = req.file.path;
  
  try {
    // Leer archivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      throw new ApiError(400, 'El archivo está vacío');
    }

    dbLogger.logQuery('BULK UPLOAD', 'assets', `count=${data.length}`);

    const results = {
      total: data.length,
      created: 0,
      errors: []
    };

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y tiene header

      try {
        // Validar campos requeridos
        if (!row['Nombre']) {
          throw new Error('Nombre es requerido');
        }
        if (!row['Ubicación'] && !row['Ubicacion']) {
          throw new Error('Ubicación es requerida');
        }
        if (!row['Responsable']) {
          throw new Error('Responsable es requerido');
        }

        // Generar número de serie único
        const serialNumber = await generateSerialNumber();

        // Generar QR Code
        const qrResult = await generateQRCode(serialNumber);

        // Insertar activo
        const result = await db.query(
          `INSERT INTO assets (
            serial_number, name, description, responsible, location, qr_code_path, category, value, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
          RETURNING *`,
          [
            serialNumber,
            row['Nombre'] || null,
            row['Observación o nota'] || row['Observacion o nota'] || row['Observación'] || row['Observacion'] || null,
            row['Responsable'] || null,
            row['Ubicación'] || row['Ubicacion'] || null,
            qrResult.filePath,
            row['Categoría'] || row['Categoria'] || null,
            row['Valor'] ? parseFloat(row['Valor']) : null,
            row['Estado'] || 'Activo'
          ]
        );

        results.created++;
        console.log(`✓ Activo creado: ${serialNumber} - ${row['Nombre']}`);

      } catch (error) {
        console.error(`✗ Error en fila ${rowNumber}:`, error.message);
        results.errors.push({
          row: rowNumber,
          data: row['Nombre'] || 'Sin nombre',
          error: error.message
        });
      }
    }

    // Eliminar archivo temporal
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.warn('No se pudo eliminar archivo temporal:', unlinkError.message);
    }

    dbLogger.logSuccess('BULK UPLOAD', { 
      total: results.total, 
      created: results.created, 
      errors: results.errors.length 
    });

    res.json({
      success: true,
      message: `Proceso completado: ${results.created} de ${results.total} activos creados`,
      results
    });

  } catch (error) {
    // Eliminar archivo temporal en caso de error
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.warn('No se pudo eliminar archivo temporal:', unlinkError.message);
    }

    throw error;
  }
}));

module.exports = router;
