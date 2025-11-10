/**
 * Script para generar plantilla Excel de ubicaciones
 */

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Crear directorio de plantillas si no existe
const templatesDir = path.join(__dirname, '../public/templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Datos de ejemplo para la plantilla
const ejemplos = [
  {
    'Nombre': 'Oficina Central',
    'Descripción': 'Oficina principal en el primer piso'
  },
  {
    'Nombre': 'Almacén A',
    'Descripción': 'Almacén de equipos electrónicos'
  },
  {
    'Nombre': 'Sala de Reuniones 1',
    'Descripción': 'Sala de reuniones en el segundo piso'
  }
];

// Crear workbook
const workbook = XLSX.utils.book_new();

// Crear worksheet con los ejemplos
const worksheet = XLSX.utils.json_to_sheet(ejemplos);

// Ajustar ancho de columnas
worksheet['!cols'] = [
  { wch: 30 },  // Nombre
  { wch: 50 }   // Descripción
];

// Agregar worksheet al workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Ubicaciones');

// Guardar archivo
const outputPath = path.join(templatesDir, 'plantilla_ubicaciones.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('✅ Plantilla de ubicaciones generada exitosamente');
console.log(`📁 Ubicación: ${outputPath}`);
console.log('');
console.log('📋 Columnas:');
console.log('  - Nombre (Requerido)');
console.log('  - Descripción (Opcional)');
console.log('');
console.log('💡 La plantilla incluye 3 ejemplos que puedes eliminar o modificar');
