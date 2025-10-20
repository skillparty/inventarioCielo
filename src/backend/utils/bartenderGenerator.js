/**
 * Generador de archivos .wdfx para BarTender
 * Crea etiquetas de inventario con logo, QR y datos del activo
 */

const fs = require('fs').promises;
const path = require('path');
const { fileLogger } = require('../middleware/logger');

// Directorio donde se guardarán los archivos .wdfx
const LABELS_DIR = path.join(__dirname, '../../../public/labels');
const LOGO_PATH = path.join(__dirname, '../../../public/assets/logo-cielo.png');

/**
 * Asegurar que el directorio de etiquetas existe
 */
const ensureLabelsDirectory = async () => {
  try {
    await fs.access(LABELS_DIR);
  } catch (error) {
    await fs.mkdir(LABELS_DIR, { recursive: true });
    console.log(`✓ Directorio creado: ${LABELS_DIR}`);
  }
};

/**
 * Generar contenido XML para archivo .wdfx de BarTender
 * @param {Object} asset - Datos del activo
 * @param {string} qrCodePath - Ruta al archivo QR code
 * @returns {string} - Contenido XML del archivo .wdfx
 */
const generateBarTenderXML = (asset, qrCodePath) => {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  // Plantilla XML para BarTender (formato .wdfx simplificado)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<XMLScript Version="2.0">
  <Command Name="Job1">
    <Print>
      <Format>${asset.serial_number}.btw</Format>
      <RecordSet Name="Datos" Type="btTextFile">
        <Name>INVENTARIO_CIELO</Name>
        <Size>40 x 40(Mi)</Size>
        <Title>DOTACION CIELO</Title>
        <Logo1>${LOGO_PATH}</Logo1>
        <Logo2>${LOGO_PATH}</Logo2>
        <Fecha>${fecha}</Fecha>
        <Encargado>${asset.responsible || 'N/A'}</Encargado>
        <Ubicacion>${asset.location || 'N/A'}</Ubicacion>
        <QRCode>${qrCodePath}</QRCode>
        <SerialNumber>${asset.serial_number}</SerialNumber>
        <Description>${asset.description || ''}</Description>
        <Category>${asset.category || ''}</Category>
      </RecordSet>
    </Print>
  </Command>
</XMLScript>`;

  return xml;
};

/**
 * Generar plantilla BTW (BarTender Template) como XML
 * Esta es una versión simplificada del formato BTW
 */
const generateBTWTemplate = (asset, qrCodePath) => {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  // Formato BTW simplificado en XML
  const btw = `<?xml version="1.0" encoding="utf-8"?>
<BarTender Version="2024" Build="3358">
  <Format>
    <Template Name="INVENTARIO_CIELO" Width="40" Height="40" Units="Millimeters">
      <!-- Fondo y marco -->
      <Shape Type="Rectangle" X="0" Y="0" Width="40" Height="40" Fill="#F0F0F0" Stroke="#666666" StrokeWidth="0.5"/>
      
      <!-- Título superior -->
      <Text X="1" Y="2" FontSize="8" FontWeight="Bold" Align="Center" Width="38">
        <Value>INVENTARIO_CIELO</Value>
      </Text>
      
      <Text X="30" Y="2" FontSize="6" Align="Right" Width="9">
        <Value>40 x 40(Mi)</Value>
      </Text>
      
      <!-- Título principal -->
      <Text X="1" Y="6" FontSize="14" FontWeight="Bold" Align="Center" Width="38">
        <Value>DOTACION CIELO</Value>
      </Text>
      
      <!-- Logo izquierdo -->
      <Image X="2" Y="8" Width="8" Height="8" MaintainAspect="true">
        <Path>${LOGO_PATH}</Path>
      </Image>
      
      <!-- Logo derecho -->
      <Image X="30" Y="8" Width="8" Height="8" MaintainAspect="true">
        <Path>${LOGO_PATH}</Path>
      </Image>
      
      <!-- Fecha -->
      <Text X="10" Y="10" FontSize="8" Align="Center" Width="20">
        <Value>Fecha: ${fecha}</Value>
      </Text>
      
      <!-- Encargado (izquierda) -->
      <Text X="1" Y="18" FontSize="7" Align="Left" Width="10">
        <Value>ENCARGADO:</Value>
      </Text>
      <Text X="1" Y="20" FontSize="8" FontWeight="Bold" Align="Left" Width="10">
        <Value>${asset.responsible || 'N/A'}</Value>
      </Text>
      
      <!-- Código QR central -->
      <Barcode Type="QRCode" X="11" Y="17" Width="18" Height="18">
        <Data>${asset.serial_number}</Data>
        <ErrorCorrection>H</ErrorCorrection>
      </Barcode>
      
      <!-- Ubicación (derecha) -->
      <Text X="29" Y="18" FontSize="7" Align="Right" Width="10">
        <Value>UBICACIÓN</Value>
      </Text>
      <Text X="29" Y="20" FontSize="8" FontWeight="Bold" Align="Right" Width="10">
        <Value>${asset.location || 'N/A'}</Value>
      </Text>
      
      <!-- Serial Number (abajo) -->
      <Text X="1" Y="36" FontSize="12" FontWeight="Bold" Align="Center" Width="38">
        <Value>${asset.serial_number}</Value>
      </Text>
    </Template>
  </Format>
</BarTender>`;

  return btw;
};

/**
 * Generar archivo de datos CSV para BarTender
 */
const generateDataFile = (asset) => {
  const fecha = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });

  const csv = `SerialNumber,Description,Responsible,Location,Category,Fecha
"${asset.serial_number}","${asset.description || ''}","${asset.responsible || 'N/A'}","${asset.location || 'N/A'}","${asset.category || ''}","${fecha}"`;

  return csv;
};

/**
 * Generar archivo .wdfx completo con todos los datos
 * @param {Object} asset - Datos del activo de la base de datos
 * @returns {Promise<Object>} - Información del archivo generado
 */
const generateBarTenderLabel = async (asset) => {
  try {
    await ensureLabelsDirectory();

    const fileName = `${asset.serial_number}.wdfx`;
    const filePath = path.join(LABELS_DIR, fileName);
    const relativePath = `/labels/${fileName}`;
    
    // Ruta al código QR
    const qrCodePath = path.join(__dirname, `../../../public/qr_codes/${asset.serial_number}.png`);

    // Generar XML del archivo .wdfx
    const xmlContent = generateBTWTemplate(asset, qrCodePath);

    fileLogger.logWrite(filePath);

    // Guardar archivo
    await fs.writeFile(filePath, xmlContent, 'utf-8');

    console.log(`✓ Etiqueta .wdfx generada: ${fileName}`);

    return {
      success: true,
      filePath: relativePath,
      fullPath: filePath,
      fileName,
      serialNumber: asset.serial_number
    };
  } catch (error) {
    fileLogger.logError('generateBarTenderLabel', asset.serial_number, error);
    throw new Error(`Error al generar etiqueta BarTender: ${error.message}`);
  }
};

/**
 * Generar archivo .btw (plantilla BarTender) separado
 */
const generateBTWFile = async (asset) => {
  try {
    await ensureLabelsDirectory();

    const fileName = `${asset.serial_number}.btw`;
    const filePath = path.join(LABELS_DIR, fileName);
    const relativePath = `/labels/${fileName}`;
    
    const qrCodePath = path.join(__dirname, `../../../public/qr_codes/${asset.serial_number}.png`);

    // Generar contenido BTW
    const btwContent = generateBTWTemplate(asset, qrCodePath);

    await fs.writeFile(filePath, btwContent, 'utf-8');

    console.log(`✓ Plantilla .btw generada: ${fileName}`);

    return {
      success: true,
      filePath: relativePath,
      fullPath: filePath,
      fileName
    };
  } catch (error) {
    throw new Error(`Error al generar plantilla BTW: ${error.message}`);
  }
};

/**
 * Eliminar archivo .wdfx de un activo
 */
const deleteBartenderLabel = async (serialNumber) => {
  try {
    const fileName = `${serialNumber}.wdfx`;
    const filePath = path.join(LABELS_DIR, fileName);

    fileLogger.logDelete(filePath);
    await fs.unlink(filePath);
    
    console.log(`✓ Etiqueta eliminada: ${fileName}`);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    fileLogger.logError('deleteBartenderLabel', serialNumber, error);
    throw new Error(`Error al eliminar etiqueta: ${error.message}`);
  }
};

/**
 * Verificar si existe un archivo .wdfx para un activo
 */
const labelExists = async (serialNumber) => {
  try {
    const fileName = `${serialNumber}.wdfx`;
    const filePath = path.join(LABELS_DIR, fileName);
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = {
  generateBarTenderLabel,
  generateBTWFile,
  deleteBartenderLabel,
  labelExists,
  LABELS_DIR
};
