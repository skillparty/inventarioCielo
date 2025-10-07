/**
 * Utilidades para generación y gestión de códigos QR
 */

const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const { fileLogger } = require('../middleware/logger');

// Directorio donde se guardarán los códigos QR
const QR_CODES_DIR = path.join(__dirname, '../../../public/qr_codes');

/**
 * Asegurar que el directorio de QR codes existe
 */
const ensureQRDirectory = async () => {
  try {
    await fs.access(QR_CODES_DIR);
  } catch (error) {
    // El directorio no existe, crearlo
    fileLogger.logWrite(QR_CODES_DIR);
    await fs.mkdir(QR_CODES_DIR, { recursive: true });
    console.log(`✓ Directorio creado: ${QR_CODES_DIR}`);
  }
};

/**
 * Generar código QR y guardarlo como archivo PNG
 * @param {string} assetId - ID del activo (AST-YYYY-NNNN)
 * @returns {Promise<Object>} - Objeto con rutas y URL base64
 */
const generateQRCode = async (assetId) => {
  try {
    await ensureQRDirectory();

    const fileName = `${assetId}.png`;
    const filePath = path.join(QR_CODES_DIR, fileName);
    const relativePath = `/qr_codes/${fileName}`;

    // Opciones para el QR
    const qrOptions = {
      errorCorrectionLevel: 'H', // Alta corrección de errores
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',  // Color del QR
        light: '#FFFFFF'  // Color de fondo
      }
    };

    fileLogger.logWrite(filePath);

    // Generar y guardar el archivo PNG
    await QRCode.toFile(filePath, assetId, qrOptions);

    // También generar versión base64 para respuesta inmediata
    const dataURL = await QRCode.toDataURL(assetId, qrOptions);

    console.log(`✓ QR generado: ${fileName}`);

    return {
      success: true,
      filePath: relativePath,
      fullPath: filePath,
      fileName,
      dataURL
    };
  } catch (error) {
    fileLogger.logError('generateQRCode', assetId, error);
    throw new Error(`Error al generar código QR: ${error.message}`);
  }
};

/**
 * Generar código QR solo como base64 (sin guardar archivo)
 * @param {string} assetId - ID del activo
 * @returns {Promise<string>} - Data URL del QR
 */
const generateQRDataURL = async (assetId) => {
  try {
    const qrOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      width: 300
    };

    const dataURL = await QRCode.toDataURL(assetId, qrOptions);
    return dataURL;
  } catch (error) {
    throw new Error(`Error al generar código QR: ${error.message}`);
  }
};

/**
 * Verificar si existe un archivo QR para un activo
 * @param {string} assetId - ID del activo
 * @returns {Promise<boolean>}
 */
const qrExists = async (assetId) => {
  try {
    const fileName = `${assetId}.png`;
    const filePath = path.join(QR_CODES_DIR, fileName);
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Eliminar archivo QR de un activo
 * @param {string} assetId - ID del activo
 * @returns {Promise<boolean>}
 */
const deleteQRCode = async (assetId) => {
  try {
    const fileName = `${assetId}.png`;
    const filePath = path.join(QR_CODES_DIR, fileName);

    fileLogger.logDelete(filePath);
    await fs.unlink(filePath);
    
    console.log(`✓ QR eliminado: ${fileName}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // El archivo no existe, no es un error
      return false;
    }
    fileLogger.logError('deleteQRCode', assetId, error);
    throw new Error(`Error al eliminar código QR: ${error.message}`);
  }
};

/**
 * Regenerar código QR (eliminar el anterior y crear uno nuevo)
 * @param {string} assetId - ID del activo
 * @returns {Promise<Object>}
 */
const regenerateQRCode = async (assetId) => {
  try {
    // Intentar eliminar el QR anterior si existe
    await deleteQRCode(assetId);
    
    // Generar nuevo QR
    return await generateQRCode(assetId);
  } catch (error) {
    throw new Error(`Error al regenerar código QR: ${error.message}`);
  }
};

/**
 * Obtener información de un archivo QR
 * @param {string} assetId - ID del activo
 * @returns {Promise<Object>}
 */
const getQRInfo = async (assetId) => {
  try {
    const fileName = `${assetId}.png`;
    const filePath = path.join(QR_CODES_DIR, fileName);
    const relativePath = `/qr_codes/${fileName}`;

    const stats = await fs.stat(filePath);

    return {
      exists: true,
      fileName,
      filePath: relativePath,
      fullPath: filePath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        exists: false,
        fileName: `${assetId}.png`,
        filePath: `/qr_codes/${assetId}.png`
      };
    }
    throw error;
  }
};

/**
 * Limpiar QR codes huérfanos (sin activo asociado)
 * @param {Array<string>} validAssetIds - Array de asset_ids válidos
 * @returns {Promise<Object>}
 */
const cleanOrphanQRCodes = async (validAssetIds) => {
  try {
    await ensureQRDirectory();
    
    const files = await fs.readdir(QR_CODES_DIR);
    const deleted = [];
    const errors = [];

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      const assetId = file.replace('.png', '');
      
      if (!validAssetIds.includes(assetId)) {
        try {
          await deleteQRCode(assetId);
          deleted.push(assetId);
        } catch (error) {
          errors.push({ assetId, error: error.message });
        }
      }
    }

    return {
      success: true,
      deleted: deleted.length,
      errors: errors.length,
      deletedFiles: deleted,
      errorFiles: errors
    };
  } catch (error) {
    throw new Error(`Error al limpiar QR codes: ${error.message}`);
  }
};

module.exports = {
  generateQRCode,
  generateQRDataURL,
  qrExists,
  deleteQRCode,
  regenerateQRCode,
  getQRInfo,
  cleanOrphanQRCodes,
  QR_CODES_DIR
};
