const express = require('express');
const router = express.Router();
const db = require('../database/db');

// =====================================================
// GET - Obtener todos los nombres de activos
// =====================================================
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM asset_names ORDER BY name ASC'
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
// GET - Obtener un nombre de activo por ID
// =====================================================
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM asset_names WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nombre de activo no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// POST - Crear nuevo nombre de activo
// =====================================================
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del activo es requerido'
      });
    }
    
    const result = await db.query(
      'INSERT INTO asset_names (name, description, counter) VALUES ($1, $2, 0) RETURNING *',
      [name, description || null]
    );
    
    res.status(201).json({
      success: true,
      message: 'Nombre de activo creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({
        success: false,
        message: 'Ya existe un nombre de activo con ese nombre'
      });
    }
    next(error);
  }
});

// =====================================================
// PUT - Actualizar nombre de activo
// =====================================================
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del activo es requerido'
      });
    }
    
    const result = await db.query(
      'UPDATE asset_names SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nombre de activo no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Nombre de activo actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un nombre de activo con ese nombre'
      });
    }
    next(error);
  }
});

// =====================================================
// DELETE - Eliminar nombre de activo
// =====================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Verificar si hay activos usando este nombre
    const assetNameResult = await db.query(
      'SELECT name FROM asset_names WHERE id = $1',
      [id]
    );
    
    if (assetNameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nombre de activo no encontrado'
      });
    }
    
    const assetName = assetNameResult.rows[0].name;
    
    // Contar activos que usan este nombre (con o sin número incremental)
    const assetsCheck = await db.query(
      'SELECT COUNT(*) FROM assets WHERE name LIKE $1',
      [`${assetName}%`]
    );
    
    if (parseInt(assetsCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el nombre de activo porque tiene activos asignados'
      });
    }
    
    const result = await db.query(
      'DELETE FROM asset_names WHERE id = $1 RETURNING *',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Nombre de activo eliminado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// =====================================================
// GET - Obtener siguiente número disponible para un nombre
// =====================================================
router.get('/:id/next-number', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Obtener el nombre base
    const nameResult = await db.query(
      'SELECT name, counter FROM asset_names WHERE id = $1',
      [id]
    );
    
    if (nameResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Nombre de activo no encontrado'
      });
    }
    
    const { name, counter } = nameResult.rows[0];
    const nextNumber = counter;
    const fullName = `${name} (${nextNumber})`;
    
    res.json({
      success: true,
      data: {
        baseName: name,
        nextNumber: nextNumber,
        fullName: fullName
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
