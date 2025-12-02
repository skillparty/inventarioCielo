const express = require('express');
const router = express.Router();
const db = require('../database/db');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const multer = require('multer');

// Configuración de multer para subida de archivos
const upload = multer({
  dest: path.join(__dirname, '../../../public/uploads/'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

// =====================================================
// GET - Obtener todos los responsables
// =====================================================
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM responsibles ORDER BY name ASC'
    );
    
    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// BULK UPLOAD - Carga masiva de responsables
// (IMPORTANTE: Estas rutas deben estar ANTES de /:id)
// =====================================================

/**
 * GET /api/responsibles/bulk/download-template
 * Descargar plantilla Excel para carga masiva de responsables
 */
router.get('/bulk/download-template', async (req, res, next) => {
  try {
    const templatePath = path.join(__dirname, '../../../public/templates/plantilla_responsables.xlsx');
    
    // Verificar que la plantilla existe
    try {
      await fs.promises.access(templatePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    res.download(templatePath, 'plantilla_responsables.xlsx', (err) => {
      if (err) {
        console.error('Error al descargar plantilla:', err);
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Error al descargar la plantilla'
          });
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/responsibles/bulk/upload
 * Subir archivo Excel para carga masiva de responsables
 */
router.post('/bulk/upload', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No se proporcionó ningún archivo'
    });
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
      await fs.promises.unlink(filePath);
      return res.status(400).json({
        success: false,
        message: 'El archivo está vacío'
      });
    }

    const results = {
      total: data.length,
      created: 0,
      skipped: 0,
      errors: []
    };

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y tiene header

      try {
        // Validar campos requeridos
        const name = row['Nombre'] || row['Responsable'];
        
        if (!name || name.trim() === '') {
          throw new Error('Nombre es requerido');
        }

        const email = row['Email'] || row['Correo'] || row['Correo electrónico'] || row['Correo electronico'] || null;
        const phone = row['Teléfono'] || row['Telefono'] || row['Celular'] || null;

        // Verificar si ya existe
        const existingCheck = await db.query(
          'SELECT id FROM responsibles WHERE name = $1',
          [name]
        );

        if (existingCheck.rows.length > 0) {
          results.skipped++;
          console.log(`⊘ Responsable ya existe: ${name}`);
          continue;
        }

        // Insertar responsable
        await db.query(
          'INSERT INTO responsibles (name, email, phone) VALUES ($1, $2, $3)',
          [name, email, phone]
        );

        results.created++;
        console.log(`✓ Responsable creado: ${name}`);

      } catch (error) {
        console.error(`✗ Error en fila ${rowNumber}:`, error.message);
        results.errors.push({
          row: rowNumber,
          data: row['Nombre'] || row['Responsable'] || 'Sin nombre',
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

    res.json({
      success: true,
      message: `Proceso completado: ${results.created} responsables creados, ${results.skipped} ya existían`,
      results
    });

  } catch (error) {
    // Eliminar archivo temporal en caso de error
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.warn('No se pudo eliminar archivo temporal:', unlinkError.message);
    }

    next(error);
  }
});

// =====================================================
// POST - Crear nuevo responsable
// =====================================================
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del responsable es requerido'
      });
    }
    
    const result = await db.query(
      'INSERT INTO responsibles (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email || null, phone || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Responsable creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Ya existe un responsable con ese nombre'
      });
    }
    next(error);
  }
});

// =====================================================
// PUT - Actualizar responsable
// =====================================================
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del responsable es requerido'
      });
    }
    
    const result = await db.query(
      'UPDATE responsibles SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, email || null, phone || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Responsable no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Responsable actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un responsable con ese nombre'
      });
    }
    next(error);
  }
});

// =====================================================
// DELETE - Eliminar responsable
// =====================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay activos asignados a este responsable
    const assetsCheck = await db.query(
      'SELECT COUNT(*) FROM assets WHERE responsible = (SELECT name FROM responsibles WHERE id = $1)',
      [id]
    );
    
    if (parseInt(assetsCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el responsable porque tiene activos asignados'
      });
    }
    
    const result = await db.query(
      'DELETE FROM responsibles WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Responsable no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Responsable eliminado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
