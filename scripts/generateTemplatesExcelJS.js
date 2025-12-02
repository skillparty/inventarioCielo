/**
 * Script para generar plantillas Excel con formato de tabla usando ExcelJS
 * Genera plantillas profesionales para: Activos, Ubicaciones y Responsables
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Asegurar que existe el directorio de templates
const templatesDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

/**
 * Genera plantilla de Activos
 */
async function generateAssetsTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Inventario Cielo';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Activos', {
    properties: { tabColor: { argb: '4472C4' } }
  });

  // Definir columnas
  const columns = [
    { header: 'Nombre', key: 'nombre', width: 35 },
    { header: 'Categoría', key: 'categoria', width: 20 },
    { header: 'Estado', key: 'estado', width: 15 },
    { header: 'Responsable', key: 'responsable', width: 25 },
    { header: 'Ubicación', key: 'ubicacion', width: 25 },
    { header: 'Observación o nota', key: 'observacion', width: 40 },
    { header: 'Valor', key: 'valor', width: 15 }
  ];

  worksheet.columns = columns;

  // Datos de ejemplo
  const exampleData = [
    { nombre: 'Laptop Dell Latitude 5420', categoria: 'Equipos de Cómputo', estado: 'Activo', responsable: 'Juan Pérez', ubicacion: 'Oficina Principal', observacion: 'Equipo nuevo asignado', valor: 1200 },
    { nombre: 'Monitor LG 24"', categoria: 'Periféricos', estado: 'Activo', responsable: 'María García', ubicacion: 'Sala de Reuniones', observacion: 'Monitor secundario', valor: 350 },
    { nombre: 'Silla Ergonómica', categoria: 'Mobiliario', estado: 'Activo', responsable: 'Carlos López', ubicacion: 'Área de Desarrollo', observacion: '', valor: 450 }
  ];

  // Agregar filas de ejemplo
  exampleData.forEach(row => worksheet.addRow(row));

  // Crear tabla
  worksheet.addTable({
    name: 'TablaActivos',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium2',
      showRowStripes: true
    },
    columns: columns.map(col => ({ name: col.header, filterButton: true })),
    rows: exampleData.map(row => [row.nombre, row.categoria, row.estado, row.responsable, row.ubicacion, row.observacion, row.valor])
  });

  // Estilo del encabezado
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4472C4' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // Agregar instrucciones en una hoja separada
  const instructionsSheet = workbook.addWorksheet('Instrucciones', {
    properties: { tabColor: { argb: '70AD47' } }
  });
  
  instructionsSheet.columns = [{ width: 80 }];
  
  const instructions = [
    'INSTRUCCIONES PARA CARGA MASIVA DE ACTIVOS',
    '',
    '1. Complete la información en la hoja "Activos"',
    '2. Puede eliminar las filas de ejemplo antes de agregar sus datos',
    '3. El número de serie se genera AUTOMÁTICAMENTE, no lo incluya',
    '',
    'CAMPOS:',
    '• Nombre (Requerido): Nombre descriptivo del activo',
    '• Categoría (Opcional): Tipo o categoría del activo',
    '• Estado (Opcional): Estado del activo (por defecto: "Activo")',
    '• Responsable (Requerido): Persona encargada del activo',
    '• Ubicación (Requerido): Lugar donde se encuentra el activo',
    '• Observación o nota (Opcional): Comentarios adicionales',
    '• Valor (Opcional): Valor monetario del activo',
    '',
    'NOTAS IMPORTANTES:',
    '• Asegúrese de que los responsables y ubicaciones existan en el sistema',
    '• El sistema generará automáticamente el código QR para cada activo',
    '• Guarde el archivo en formato .xlsx antes de subirlo'
  ];

  instructions.forEach((text, index) => {
    const row = instructionsSheet.addRow([text]);
    if (index === 0) {
      row.font = { bold: true, size: 14, color: { argb: '4472C4' } };
    } else if (text.startsWith('CAMPOS:') || text.startsWith('NOTAS')) {
      row.font = { bold: true, size: 11 };
    }
  });

  const filePath = path.join(templatesDir, 'plantilla_activos.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('✅ Plantilla de activos generada:', filePath);
}

/**
 * Genera plantilla de Ubicaciones
 */
async function generateLocationsTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Inventario Cielo';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Ubicaciones', {
    properties: { tabColor: { argb: '70AD47' } }
  });

  // Definir columnas
  const columns = [
    { header: 'Nombre', key: 'nombre', width: 35 },
    { header: 'Descripción', key: 'descripcion', width: 50 }
  ];

  worksheet.columns = columns;

  // Datos de ejemplo
  const exampleData = [
    { nombre: 'Oficina Principal', descripcion: 'Edificio administrativo principal' },
    { nombre: 'Sala de Reuniones A', descripcion: 'Sala de reuniones en el primer piso' },
    { nombre: 'Almacén Central', descripcion: 'Depósito de equipos y materiales' }
  ];

  // Agregar filas de ejemplo
  exampleData.forEach(row => worksheet.addRow(row));

  // Crear tabla
  worksheet.addTable({
    name: 'TablaUbicaciones',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium4',
      showRowStripes: true
    },
    columns: columns.map(col => ({ name: col.header, filterButton: true })),
    rows: exampleData.map(row => [row.nombre, row.descripcion])
  });

  // Estilo del encabezado
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '70AD47' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // Agregar instrucciones
  const instructionsSheet = workbook.addWorksheet('Instrucciones', {
    properties: { tabColor: { argb: '4472C4' } }
  });
  
  instructionsSheet.columns = [{ width: 80 }];
  
  const instructions = [
    'INSTRUCCIONES PARA CARGA MASIVA DE UBICACIONES',
    '',
    '1. Complete la información en la hoja "Ubicaciones"',
    '2. Puede eliminar las filas de ejemplo antes de agregar sus datos',
    '',
    'CAMPOS:',
    '• Nombre (Requerido): Nombre de la ubicación',
    '• Descripción (Opcional): Descripción detallada de la ubicación',
    '',
    'NOTAS IMPORTANTES:',
    '• Las ubicaciones duplicadas serán omitidas automáticamente',
    '• Guarde el archivo en formato .xlsx antes de subirlo'
  ];

  instructions.forEach((text, index) => {
    const row = instructionsSheet.addRow([text]);
    if (index === 0) {
      row.font = { bold: true, size: 14, color: { argb: '70AD47' } };
    } else if (text.startsWith('CAMPOS:') || text.startsWith('NOTAS')) {
      row.font = { bold: true, size: 11 };
    }
  });

  const filePath = path.join(templatesDir, 'plantilla_ubicaciones.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('✅ Plantilla de ubicaciones generada:', filePath);
}

/**
 * Genera plantilla de Responsables
 */
async function generateResponsiblesTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema Inventario Cielo';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Responsables', {
    properties: { tabColor: { argb: 'ED7D31' } }
  });

  // Definir columnas
  const columns = [
    { header: 'Nombre', key: 'nombre', width: 35 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Teléfono', key: 'telefono', width: 20 }
  ];

  worksheet.columns = columns;

  // Datos de ejemplo
  const exampleData = [
    { nombre: 'Juan Pérez', email: 'juan.perez@empresa.com', telefono: '+1 555-0101' },
    { nombre: 'María García', email: 'maria.garcia@empresa.com', telefono: '+1 555-0102' },
    { nombre: 'Carlos López', email: 'carlos.lopez@empresa.com', telefono: '+1 555-0103' }
  ];

  // Agregar filas de ejemplo
  exampleData.forEach(row => worksheet.addRow(row));

  // Crear tabla
  worksheet.addTable({
    name: 'TablaResponsables',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium3',
      showRowStripes: true
    },
    columns: columns.map(col => ({ name: col.header, filterButton: true })),
    rows: exampleData.map(row => [row.nombre, row.email, row.telefono])
  });

  // Estilo del encabezado
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'ED7D31' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 25;

  // Agregar instrucciones
  const instructionsSheet = workbook.addWorksheet('Instrucciones', {
    properties: { tabColor: { argb: '4472C4' } }
  });
  
  instructionsSheet.columns = [{ width: 80 }];
  
  const instructions = [
    'INSTRUCCIONES PARA CARGA MASIVA DE RESPONSABLES',
    '',
    '1. Complete la información en la hoja "Responsables"',
    '2. Puede eliminar las filas de ejemplo antes de agregar sus datos',
    '',
    'CAMPOS:',
    '• Nombre (Requerido): Nombre completo del responsable',
    '• Email (Opcional): Correo electrónico del responsable',
    '• Teléfono (Opcional): Número de contacto',
    '',
    'NOTAS IMPORTANTES:',
    '• Los responsables duplicados serán omitidos automáticamente',
    '• Guarde el archivo en formato .xlsx antes de subirlo'
  ];

  instructions.forEach((text, index) => {
    const row = instructionsSheet.addRow([text]);
    if (index === 0) {
      row.font = { bold: true, size: 14, color: { argb: 'ED7D31' } };
    } else if (text.startsWith('CAMPOS:') || text.startsWith('NOTAS')) {
      row.font = { bold: true, size: 11 };
    }
  });

  const filePath = path.join(templatesDir, 'plantilla_responsables.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log('✅ Plantilla de responsables generada:', filePath);
}

/**
 * Genera todas las plantillas
 */
async function generateAllTemplates() {
  console.log('\n🚀 Generando plantillas Excel con formato de tabla...\n');
  
  try {
    await generateAssetsTemplate();
    await generateLocationsTemplate();
    await generateResponsiblesTemplate();
    
    console.log('\n✅ Todas las plantillas han sido generadas exitosamente!\n');
    console.log('📁 Ubicación:', templatesDir);
  } catch (error) {
    console.error('❌ Error al generar plantillas:', error);
    process.exit(1);
  }
}

// Ejecutar
generateAllTemplates();
