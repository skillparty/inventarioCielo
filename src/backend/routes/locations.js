const express = require('express');
const router = express.Router();
const db = require('../database/db');

// =====================================================
// GET - Obtener todas las ubicaciones
// =====================================================
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM locations ORDER BY name ASC'
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
// POST - Crear nueva ubicación
// =====================================================
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la ubicación es requerido'
      });
    }
    
    const result = await db.query(
      'INSERT INTO locations (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Ubicación creada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Ya existe una ubicación con ese nombre'
      });
    }
    next(error);
  }
});

// =====================================================
// PUT - Actualizar ubicación
// =====================================================
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la ubicación es requerido'
      });
    }
    
    const result = await db.query(
      'UPDATE locations SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Ubicación actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una ubicación con ese nombre'
      });
    }
    next(error);
  }
});

// =====================================================
// DELETE - Eliminar ubicación
// =====================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay activos usando esta ubicación
    const assetsCheck = await db.query(
      'SELECT COUNT(*) FROM assets WHERE location = (SELECT name FROM locations WHERE id = $1)',
      [id]
    );
    
    if (parseInt(assetsCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar la ubicación porque tiene activos asignados'
      });
    }
    
    const result = await db.query(
      'DELETE FROM locations WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Ubicación eliminada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
