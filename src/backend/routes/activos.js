const express = require('express');
const router = express.Router();
const db = require('../database/db');
const QRCode = require('qrcode');

// Obtener todos los activos
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM activos ORDER BY fecha_registro DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener activos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener activos', 
      error: error.message 
    });
  }
});

// Obtener un activo por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT * FROM activos WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Activo no encontrado' 
      });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener activo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener activo', 
      error: error.message 
    });
  }
});

// Buscar activo por código QR
router.get('/qr/:codigo_qr', async (req, res) => {
  try {
    const { codigo_qr } = req.params;
    const result = await db.query(
      'SELECT * FROM activos WHERE codigo_qr = $1',
      [codigo_qr]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Activo no encontrado con ese código QR' 
      });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al buscar activo por QR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al buscar activo', 
      error: error.message 
    });
  }
});

// Crear nuevo activo
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      categoria,
      ubicacion,
      estado,
      numero_serie,
      valor,
      responsable
    } = req.body;

    // Generar código QR único
    const codigo_qr = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await db.query(
      `INSERT INTO activos (
        nombre, descripcion, categoria, ubicacion, estado, 
        numero_serie, valor, responsable, codigo_qr
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [nombre, descripcion, categoria, ubicacion, estado, numero_serie, valor, responsable, codigo_qr]
    );

    // Generar imagen QR
    const qrImage = await QRCode.toDataURL(codigo_qr);

    res.status(201).json({ 
      success: true, 
      message: 'Activo creado exitosamente',
      data: result.rows[0],
      qrImage
    });
  } catch (error) {
    console.error('Error al crear activo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear activo', 
      error: error.message 
    });
  }
});

// Actualizar activo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      categoria,
      ubicacion,
      estado,
      numero_serie,
      valor,
      responsable
    } = req.body;

    const result = await db.query(
      `UPDATE activos SET 
        nombre = $1, descripcion = $2, categoria = $3, 
        ubicacion = $4, estado = $5, numero_serie = $6, 
        valor = $7, responsable = $8, fecha_actualizacion = NOW()
      WHERE id = $9 
      RETURNING *`,
      [nombre, descripcion, categoria, ubicacion, estado, numero_serie, valor, responsable, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Activo no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Activo actualizado exitosamente',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Error al actualizar activo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar activo', 
      error: error.message 
    });
  }
});

// Eliminar activo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM activos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Activo no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Activo eliminado exitosamente',
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Error al eliminar activo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar activo', 
      error: error.message 
    });
  }
});

// Generar código QR para un activo existente
router.get('/:id/qr', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'SELECT codigo_qr FROM activos WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Activo no encontrado' 
      });
    }

    const qrImage = await QRCode.toDataURL(result.rows[0].codigo_qr);

    res.json({ 
      success: true, 
      qrImage,
      codigo_qr: result.rows[0].codigo_qr
    });
  } catch (error) {
    console.error('Error al generar QR:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar código QR', 
      error: error.message 
    });
  }
});

module.exports = router;
