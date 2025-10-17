const express = require('express');
const router = express.Router();
const db = require('../database/db');

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
