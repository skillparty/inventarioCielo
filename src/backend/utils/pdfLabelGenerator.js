/**
 * Generador de etiquetas en PDF para WePrint
 * Crea etiquetas de 40mm x 40mm con logo, QR y datos del activo
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { fileLogger } = require('../middleware/logger');

// Directorio donde se guardarán las etiquetas PDF
const LABELS_DIR = path.join(__dirname, '../../../public/labels');
const LOGO_PATH = path.join(__dirname, '../../../public/logo-cielo.jpeg');

// Conversión de mm a puntos PDF (1mm = 2.83465 puntos)
const mmToPts = (mm) => mm * 2.83465;

/**
 * Asegurar que el directorio de etiquetas existe
 */
const ensureLabelsDirectory = async () => {
  try {
    await fs.promises.access(LABELS_DIR);
  } catch (error) {
    await fs.promises.mkdir(LABELS_DIR, { recursive: true });
    console.log(`✓ Directorio creado: ${LABELS_DIR}`);
  }
};

/**
 * Verificar si el logo existe
 */
const logoExists = async () => {
  try {
    await fs.promises.access(LOGO_PATH);
    const stats = await fs.promises.stat(LOGO_PATH);
    return stats.size > 0; // Verificar que no esté vacío
  } catch (error) {
    return false;
  }
};

/**
 * Generar etiqueta PDF para WePrint
 * @param {Object} asset - Datos del activo
 * @returns {Promise<Object>} - Información del archivo generado
 */
const generatePDFLabel = async (asset) => {
  try {
    await ensureLabelsDirectory();

    const fileName = `${asset.serial_number}.pdf`;
    const filePath = path.join(LABELS_DIR, fileName);
    const relativePath = `/labels/${fileName}`;
    
    // Ruta al código QR
    const qrCodePath = path.join(__dirname, `../../../public/qr_codes/${asset.serial_number}.png`);

    // Crear documento PDF - 40mm x 40mm (113.39 x 113.39 puntos)
    const doc = new PDFDocument({
      size: [mmToPts(40), mmToPts(40)],
      margins: { top: mmToPts(1), bottom: mmToPts(1), left: mmToPts(1), right: mmToPts(1) }
    });

    // Stream para guardar el PDF
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Dimensiones útiles
    const width = mmToPts(40);
    const height = mmToPts(40);
    const margin = mmToPts(1);

    // Fondo gris claro
    doc.rect(0, 0, width, height).fill('#F5F5F5');

    // Borde
    doc.rect(mmToPts(0.5), mmToPts(0.5), mmToPts(39), mmToPts(39))
       .lineWidth(0.5)
       .stroke('#666666');

    // --- TÍTULO PRINCIPAL (más arriba) ---
    doc.fillColor('#000000')
       .fontSize(10)
       .font('Helvetica-Bold')
       .text('DOTACION CIELO', margin, mmToPts(2), {
         width: mmToPts(38),
         align: 'center'
       });

    // --- FECHA (más grande) ---
    const fecha = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });

    doc.fontSize(8)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(`Fecha: ${fecha}`, margin, mmToPts(6), {
         width: mmToPts(38),
         align: 'center'
       });

    // --- ENCARGADO (izquierda) ---
    doc.fontSize(4.5)
       .font('Helvetica')
       .text('ENCARGADO:', mmToPts(1), mmToPts(10), {
         width: mmToPts(16),
         align: 'left'
       });

    doc.fontSize(5)
       .font('Helvetica-Bold')
       .text(asset.responsible || 'N/A', mmToPts(1), mmToPts(12), {
         width: mmToPts(16),
         align: 'left',
         lineBreak: true
       });

    // --- UBICACIÓN (izquierda, debajo del encargado) ---
    doc.fontSize(4.5)
       .font('Helvetica')
       .text('UBICACIÓN:', mmToPts(1), mmToPts(16), {
         width: mmToPts(16),
         align: 'left'
       });

    doc.fontSize(5)
       .font('Helvetica-Bold')
       .text(asset.location || 'N/A', mmToPts(1), mmToPts(18), {
         width: mmToPts(16),
         align: 'left',
         lineBreak: true
       });

    // --- LOGO (debajo de ubicación, izquierda) ---
    const hasLogo = await logoExists();
    if (hasLogo) {
      try {
        doc.image(LOGO_PATH, mmToPts(4), mmToPts(22), {
          width: mmToPts(8),
          height: mmToPts(8),
          fit: [mmToPts(8), mmToPts(8)],
          align: 'center'
        });
      } catch (logoError) {
        console.warn('⚠️ Error al cargar logo:', logoError.message);
      }
    }

    // --- CÓDIGO QR (derecha) - Tamaño 20mm ---
    try {
      // Verificar si el QR existe
      await fs.promises.access(qrCodePath);
      doc.image(qrCodePath, mmToPts(18), mmToPts(10), {
        width: mmToPts(20),
        height: mmToPts(20),
        fit: [mmToPts(20), mmToPts(20)]
      });
    } catch (qrError) {
      console.warn('⚠️ QR Code no encontrado:', qrCodePath);
      // Dibujar un cuadrado placeholder
      doc.rect(mmToPts(18), mmToPts(10), mmToPts(20), mmToPts(20))
         .lineWidth(1)
         .stroke('#CCCCCC');
      
      doc.fontSize(8)
         .font('Helvetica')
         .text('QR N/D', mmToPts(18), mmToPts(18), {
           width: mmToPts(20),
           align: 'center'
         });
    }

    // --- SERIAL NUMBER (inferior - debajo del QR con más espacio) ---
    doc.fontSize(6)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(asset.serial_number, margin, mmToPts(31), {
         width: mmToPts(38),
         align: 'center'
       });

    // Finalizar el PDF
    doc.end();

    // Esperar a que el stream termine
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    fileLogger.logWrite(filePath);
    console.log(`✓ Etiqueta PDF generada: ${fileName}`);

    return {
      success: true,
      filePath: relativePath,
      fullPath: filePath,
      fileName,
      serialNumber: asset.serial_number
    };
  } catch (error) {
    fileLogger.logError('generatePDFLabel', asset.serial_number, error);
    throw new Error(`Error al generar etiqueta PDF: ${error.message}`);
  }
};

/**
 * Eliminar etiqueta PDF
 */
const deletePDFLabel = async (serialNumber) => {
  try {
    const fileName = `${serialNumber}.pdf`;
    const filePath = path.join(LABELS_DIR, fileName);

    fileLogger.logDelete(filePath);
    await fs.promises.unlink(filePath);
    
    console.log(`✓ Etiqueta PDF eliminada: ${fileName}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    fileLogger.logError('deletePDFLabel', serialNumber, error);
    throw new Error(`Error al eliminar etiqueta PDF: ${error.message}`);
  }
};

/**
 * Verificar si existe una etiqueta PDF
 */
const pdfLabelExists = async (serialNumber) => {
  try {
    const fileName = `${serialNumber}.pdf`;
    const filePath = path.join(LABELS_DIR, fileName);
    await fs.promises.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  generatePDFLabel,
  deletePDFLabel,
  pdfLabelExists,
  LABELS_DIR
};
