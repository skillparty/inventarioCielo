/**
 * Generador de PDF con múltiples etiquetas para impresión por lotes
 * Crea un PDF con múltiples etiquetas de 40mm x 40mm
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { fileLogger } = require('../middleware/logger');

// Directorio donde se guardarán los PDFs batch
const BATCH_LABELS_DIR = path.join(__dirname, '../../../public/batch_labels');
const LOGO_PATH = path.join(__dirname, '../../../public/logo-cielo.jpeg');

// Conversión de mm a puntos PDF (1mm = 2.83465 puntos)
const mmToPts = (mm) => mm * 2.83465;

/**
 * Asegurar que el directorio de etiquetas batch existe
 */
const ensureBatchLabelsDirectory = async () => {
  try {
    await fs.promises.access(BATCH_LABELS_DIR);
  } catch (error) {
    await fs.promises.mkdir(BATCH_LABELS_DIR, { recursive: true });
    console.log(`✓ Directorio creado: ${BATCH_LABELS_DIR}`);
  }
};

/**
 * Verificar si el logo existe
 */
const logoExists = async () => {
  try {
    await fs.promises.access(LOGO_PATH);
    const stats = await fs.promises.stat(LOGO_PATH);
    return stats.size > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Dibujar una etiqueta en el PDF
 * @param {PDFDocument} doc - Documento PDF
 * @param {Object} asset - Datos del activo
 * @param {number} x - Posición X en el documento
 * @param {number} y - Posición Y en el documento
 * @param {boolean} hasLogo - Si el logo existe
 */
const drawLabel = async (doc, asset, x, y, hasLogo) => {
  const width = mmToPts(40);
  const height = mmToPts(40);
  const margin = mmToPts(1);
  
  // Ruta al código QR
  const qrCodePath = path.join(__dirname, `../../../public/qr_codes/${asset.serial_number}.png`);

  // Guardar estado del documento
  doc.save();
  
  // Mover al origen de la etiqueta
  doc.translate(x, y);

  // Fondo gris claro
  doc.rect(0, 0, width, height).fill('#F5F5F5');

  // Borde
  doc.rect(mmToPts(0.5), mmToPts(0.5), mmToPts(39), mmToPts(39))
     .lineWidth(0.5)
     .stroke('#666666');

  // --- TÍTULO SUPERIOR ---
  doc.fillColor('#000000')
     .fontSize(6)
     .font('Helvetica-Bold')
     .text('INVENTARIO_CIELO', margin, mmToPts(2), {
       width: mmToPts(38),
       align: 'center'
     });

  // --- TÍTULO PRINCIPAL ---
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('DOTACION CIELO', margin, mmToPts(6), {
       width: mmToPts(38),
       align: 'center'
     });

  // --- LOGOS ---
  if (hasLogo) {
    try {
      // Logo izquierdo
      doc.image(LOGO_PATH, mmToPts(2), mmToPts(10), {
        width: mmToPts(8),
        height: mmToPts(8),
        fit: [mmToPts(8), mmToPts(8)],
        align: 'center'
      });

      // Logo derecho
      doc.image(LOGO_PATH, mmToPts(30), mmToPts(10), {
        width: mmToPts(8),
        height: mmToPts(8),
        fit: [mmToPts(8), mmToPts(8)],
        align: 'center'
      });
    } catch (logoError) {
      console.warn('⚠️ Error al cargar logo:', logoError.message);
    }
  }

  // --- FECHA ---
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  doc.fontSize(6)
     .font('Helvetica')
     .fillColor('#000000')
     .text(`Fecha: ${fecha}`, margin, mmToPts(12), {
       width: mmToPts(38),
       align: 'center'
     });

  // --- ENCARGADO (izquierda) ---
  doc.fontSize(4)
     .font('Helvetica')
     .text('ENCARGADO:', mmToPts(1), mmToPts(20), {
       width: mmToPts(10),
       align: 'left'
     });

  doc.fontSize(6)
     .font('Helvetica-Bold')
     .text(asset.responsible || 'N/A', mmToPts(1), mmToPts(23.5), {
       width: mmToPts(10),
       align: 'left',
       lineBreak: true
     });

  // --- CÓDIGO QR (centro) ---
  try {
    // Verificar si el QR existe
    await fs.promises.access(qrCodePath);
    doc.image(qrCodePath, mmToPts(11), mmToPts(19), {
      width: mmToPts(18),
      height: mmToPts(18),
      fit: [mmToPts(18), mmToPts(18)]
    });
  } catch (qrError) {
    console.warn('⚠️ QR Code no encontrado:', qrCodePath);
    // Dibujar un cuadrado placeholder
    doc.rect(mmToPts(11), mmToPts(19), mmToPts(18), mmToPts(18))
       .lineWidth(1)
       .stroke('#CCCCCC');
    
    doc.fontSize(7)
       .font('Helvetica')
       .text('QR N/D', mmToPts(11), mmToPts(26), {
         width: mmToPts(18),
         align: 'center'
       });
  }

  // --- UBICACIÓN (derecha) ---
  doc.fontSize(4)
     .font('Helvetica')
     .text('UBICACIÓN', mmToPts(29), mmToPts(20), {
       width: mmToPts(10),
       align: 'right'
     });

  doc.fontSize(6)
     .font('Helvetica-Bold')
     .text(asset.location || 'N/A', mmToPts(29), mmToPts(22.5), {
       width: mmToPts(10),
       align: 'right',
       lineBreak: true
     });

  // --- SERIAL NUMBER (inferior) ---
  doc.fontSize(7)
     .font('Helvetica-Bold')
     .fillColor('#000000')
     .text(asset.serial_number, margin, mmToPts(36), {
       width: mmToPts(38),
       align: 'center',
       lineBreak: false
     });

  // Restaurar estado del documento
  doc.restore();
};

/**
 * Generar PDF con múltiples etiquetas en formato rollo continuo
 * @param {Array} assets - Array de activos
 * @param {string} batchId - ID único para el batch (opcional)
 * @returns {Promise<Object>} - Información del archivo generado
 */
const generateBatchPDF = async (assets, batchId = null) => {
  try {
    await ensureBatchLabelsDirectory();

    // Generar nombre de archivo
    const timestamp = Date.now();
    const fileName = batchId 
      ? `batch_${batchId}_${timestamp}.pdf`
      : `batch_${timestamp}.pdf`;
    const filePath = path.join(BATCH_LABELS_DIR, fileName);
    const relativePath = `/batch_labels/${fileName}`;

    // Configuración para rollo de impresora térmica
    // Ancho fijo: 40mm, Alto: 40mm por etiqueta
    const labelWidth = mmToPts(40);
    const labelHeight = mmToPts(40);
    
    // Calcular altura total del rollo (todas las etiquetas apiladas verticalmente)
    const totalHeight = labelHeight * assets.length;

    // Crear documento PDF con tamaño personalizado (rollo continuo)
    const doc = new PDFDocument({
      size: [labelWidth, totalHeight],
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    // Stream para guardar el PDF
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const hasLogo = await logoExists();
    let labelCount = 0;

    // Procesar cada activo (apilados verticalmente)
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      
      // Calcular posición Y (apilamiento vertical)
      const y = i * labelHeight;

      // Dibujar etiqueta en posición vertical
      await drawLabel(doc, asset, 0, y, hasLogo);
      labelCount++;
    }

    // Finalizar el PDF
    doc.end();

    // Esperar a que el stream termine
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    fileLogger.logWrite(filePath);
    console.log(`✓ PDF Batch generado: ${fileName} (${labelCount} etiquetas en rollo continuo)`);

    return {
      success: true,
      filePath: relativePath,
      fullPath: filePath,
      fileName,
      labelCount,
      rollLength: Math.round(assets.length * 40), // Longitud en mm
      pageCount: 1 // Es un rollo continuo, se considera 1 "página"
    };
  } catch (error) {
    fileLogger.logError('generateBatchPDF', 'batch', error);
    throw new Error(`Error al generar PDF batch: ${error.message}`);
  }
};

/**
 * Eliminar PDF batch
 */
const deleteBatchPDF = async (fileName) => {
  try {
    const filePath = path.join(BATCH_LABELS_DIR, fileName);
    fileLogger.logDelete(filePath);
    await fs.promises.unlink(filePath);
    console.log(`✓ PDF Batch eliminado: ${fileName}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    fileLogger.logError('deleteBatchPDF', fileName, error);
    throw new Error(`Error al eliminar PDF batch: ${error.message}`);
  }
};

/**
 * Limpiar PDFs batch antiguos (más de 24 horas)
 */
const cleanOldBatchPDFs = async () => {
  try {
    await ensureBatchLabelsDirectory();
    
    const files = await fs.promises.readdir(BATCH_LABELS_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas en ms
    const deleted = [];
    const errors = [];

    for (const file of files) {
      if (!file.endsWith('.pdf')) continue;

      try {
        const filePath = path.join(BATCH_LABELS_DIR, file);
        const stats = await fs.promises.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await deleteBatchPDF(file);
          deleted.push(file);
        }
      } catch (error) {
        errors.push({ file, error: error.message });
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
    throw new Error(`Error al limpiar PDFs batch: ${error.message}`);
  }
};

module.exports = {
  generateBatchPDF,
  deleteBatchPDF,
  cleanOldBatchPDFs,
  BATCH_LABELS_DIR
};
